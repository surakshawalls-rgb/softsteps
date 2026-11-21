import { DOCUMENT } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CatalogQueryService } from '../../../data-access/queries/catalog/catalog-query.service';
import { Product } from '../../../shared/models/product.model';
import { ProductGallery } from '../product-gallery/product-gallery';
import { Seo } from '../../../core/services/seo';
import { CartService, formatMoney } from '../../../core/services/cart.service';

/** One size a rug can be bought in. */
interface SizeOption {
  label: string;
  price: number;
  salePrice: number | null;
}

@Component({
  selector: 'app-product-page',
  imports: [RouterLink, ProductGallery],
  templateUrl: './product-page.html',
  styleUrl: './product-page.css',
})
export class ProductPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogQuery = inject(CatalogQueryService);
  private readonly seo = inject(Seo);
  private readonly document = inject(DOCUMENT);
  private readonly cart = inject(CartService);
  private routeSubscription?: Subscription;
  private addedTimer?: ReturnType<typeof setTimeout>;

  product: Product | null = null;
  readonly loading = signal(true);
  notFound = false;
  errorMessage = '';
  currentSlug = '';

  /** Cart controls */
  readonly selectedSizeIndex = signal(0);
  readonly quantity = signal(1);
  readonly justAdded = signal(false);

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) void this.loadProduct(slug);
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    clearTimeout(this.addedTimer);
  }

  async loadProduct(slug: string): Promise<void> {
    this.currentSlug = slug;
    this.loading.set(true);
    this.notFound = false;
    this.errorMessage = '';
    this.product = null;
    this.selectedSizeIndex.set(0);
    this.quantity.set(1);
    this.justAdded.set(false);

    try {
      this.product = await this.catalogQuery.getProductBySlug(slug);
      if (this.product) {
        this.updateSeo();
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      const message = error instanceof Error ? error.message : '';
      if (/0 rows|not found|multiple \(or no\) rows/i.test(message)) {
        this.notFound = true;
      } else {
        // Supabase PostgREST can return PGRST116 for a missing single row.
        const code = (error as { code?: string } | null)?.code;
        this.notFound = code === 'PGRST116';
        if (!this.notFound) this.errorMessage = 'Please try again in a moment.';
      }
    } finally {
      this.loading.set(false);
    }
  }

  private updateSeo(): void {
    if (!this.product) return;

    const title = this.product.meta_title?.trim() || this.product.name || 'Soft Steps Carpets & Rugs';
    const description = this.product.meta_description?.trim() || this.product.short_description || 'Handcrafted luxury rugs and carpets from Soft Steps.';

    this.seo.updateTitle(title);
    this.seo.updateDescription(description);

    const origin = this.document.location?.origin;
    if (this.product.slug && origin && origin !== 'null') {
      const canonicalUrl = `${origin}/products/${this.product.slug}`;
      this.seo.updateCanonicalUrl(canonicalUrl);
    }
  }

  /* ---------- product facts ---------- */

  get productCode(): string | null {
    return this.textValue(this.product?.['product_code']);
  }

  get currencyCode(): string {
    return this.textValue(this.product?.currency) ?? 'INR';
  }

  get price(): number | null {
    const value = this.product?.base_price ?? this.sizePrice;
    if (typeof value === 'number') return value;
    return null;
  }

  get pileHeightLabel(): string | null {
    const value = this.product?.pile_height_mm;
    if (value === null || value === undefined || value === '') return null;
    const text = String(value).trim();
    return /mm$/i.test(text) ? text : `${text} mm`;
  }

  get minimumOrderQuantity(): number | null {
    const value = this.product?.minimum_order_quantity ?? this.product?.moq;
    return typeof value === 'number' && value > 0 ? value : null;
  }

  get subcategory(): string | null {
    const subcat = this.product?.specifications?.['subcategory'];
    const text = typeof subcat === 'string' && subcat.trim() ? subcat.trim() : null;
    // don't repeat the category name
    return text && text.toLowerCase() !== (this.product?.category?.name ?? '').trim().toLowerCase() ? text : null;
  }

  get size(): string | null {
    const size = this.product?.specifications?.['size'];
    if (typeof size === 'string' && size.trim() && !Number.isFinite(Number(size))) return size.trim();
    return this.sizePrice !== null ? '3 x 5 ft' : null;
  }

  get sizePrice(): number | null {
    return this.numberValue(this.product?.specifications?.['size_3x5_price']);
  }

  get isNewArrival(): boolean {
    return this.product?.is_new_arrival === true;
  }

  get isBestSeller(): boolean {
    return this.product?.is_best_seller === true;
  }

  get customizable(): boolean {
    return this.product?.is_customizable === true;
  }

  get madeToOrder(): boolean {
    return this.product?.made_to_order === true;
  }

  get warrantyPolicy(): string[] {
    return this.policyLines(this.product?.specifications?.['warranty_policy']);
  }

  get freightPolicy(): string[] {
    return this.policyLines(this.product?.specifications?.['freight_policy']);
  }

  get inquiryUrl(): string {
    return '/custom-requirement';
  }

  /* ---------- sizes and pricing ---------- */

  /**
   * Sizes the rug is sold in, in this order of preference:
   * 1. active product variants that have a size and a price,
   * 2. a `sizes` list inside the product's specifications ({ size, price, sale_price }),
   * 3. the single size from the catalogue sheet (size(3x5) price).
   */
  get sizeOptions(): SizeOption[] {
    const product = this.product;
    if (!product) return [];

    const fromVariants = (product.variants ?? [])
      .filter(variant => variant.is_active !== false && variant.size && typeof variant.price === 'number')
      .map(variant => ({
        label: String(variant.size).trim(),
        price: variant.price as number,
        salePrice: typeof variant.sale_price === 'number' ? variant.sale_price : null,
      }));
    if (fromVariants.length) return fromVariants;

    const listed = product.specifications?.['sizes'];
    if (Array.isArray(listed)) {
      const fromSpecs = listed
        .map((entry: unknown) => {
          const row = (entry ?? {}) as Record<string, unknown>;
          const label = this.textValue(row['size'], row['label']);
          const price = this.numberValue(row['price']);
          return label && price !== null ? { label, price, salePrice: this.numberValue(row['sale_price']) } : null;
        })
        .filter((option): option is SizeOption => option !== null);
      if (fromSpecs.length) return fromSpecs;
    }

    const price = this.price;
    if (price === null) return [];
    return [{ label: this.size ?? 'Standard size', price, salePrice: null }];
  }

  get selectedSize(): SizeOption | null {
    const options = this.sizeOptions;
    if (!options.length) return null;
    return options[Math.min(this.selectedSizeIndex(), options.length - 1)];
  }

  /** Price per rug for the chosen size (the sale price when there is one). */
  get unitPrice(): number | null {
    const size = this.selectedSize;
    if (!size) return null;
    return size.salePrice !== null && size.salePrice < size.price ? size.salePrice : size.price;
  }

  get lineTotal(): number | null {
    const unit = this.unitPrice;
    return unit === null ? null : unit * this.quantity();
  }

  formatPrice(value: number | null): string {
    return value === null ? '' : formatMoney(value, this.currencyCode);
  }

  selectSize(index: number): void {
    this.selectedSizeIndex.set(index);
    this.justAdded.set(false);
  }

  /* ---------- cart ---------- */

  /** The cart needs a product code and a price. A rug can also be switched off in the catalogue (Cart Enabled = No). */
  get canAddToCart(): boolean {
    return this.product?.cart_enabled !== false && !!this.productCode && this.unitPrice !== null;
  }

  changeQuantity(step: number): void {
    this.quantity.update(value => Math.min(99, Math.max(1, value + step)));
    this.justAdded.set(false);
  }

  addToCart(): void {
    const product = this.product;
    const code = this.productCode;
    const size = this.selectedSize;
    const unit = this.unitPrice;

    if (!product || !code || !size || unit === null || !this.canAddToCart) return;

    const images = [...(product.images ?? [])].filter(image => !!image.image_url);
    const primary = images.find(image => image.is_primary === true) ?? images[0];

    this.cart.add(
      {
        productCode: code,
        slug: product.slug ?? '',
        name: product.name ?? code,
        imageUrl: primary?.image_url ?? null,
        size: size.label,
        unitPrice: unit,
        currency: this.currencyCode,
      },
      this.quantity(),
    );

    this.justAdded.set(true);
    clearTimeout(this.addedTimer);
    this.addedTimer = setTimeout(() => this.justAdded.set(false), 6000);
  }

  scrollToSection(id: string): void {
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- helpers ---------- */

  /** Splits a policy into readable lines and drops a first line that is only the policy title. */
  private policyLines(value: unknown): string[] {
    const text = this.textValue(value);
    if (!text) return [];
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length > 1 && lines[0].length < 80 && /policy/i.test(lines[0])) lines.shift();
    return lines;
  }

  private textValue(...values: unknown[]): string | null {
    const value = values.find(item => typeof item === 'string' && item.trim());
    return typeof value === 'string' ? value.trim() : null;
  }

  private numberValue(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
    return null;
  }
}