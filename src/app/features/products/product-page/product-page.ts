import { DOCUMENT } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CatalogQueryService } from '../../../data-access/queries/catalog/catalog-query.service';
import { Product } from '../../../shared/models/product.model';
import { ProductGallery } from '../product-gallery/product-gallery';
import { PriceDisplay } from '../../../shared/components/price-display/price-display';
import { Seo } from '../../../core/services/seo';

@Component({
  selector: 'app-product-page',
  imports: [RouterLink, ProductGallery, PriceDisplay],
  templateUrl: './product-page.html',
  styleUrl: './product-page.css',
})
export class ProductPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogQuery = inject(CatalogQueryService);
  private readonly seo = inject(Seo);
  private readonly document = inject(DOCUMENT);
  private routeSubscription?: Subscription;

  product: Product | null = null;
  readonly loading = signal(true);
  notFound = false;
  errorMessage = '';
  currentSlug = '';

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) void this.loadProduct(slug);
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  async loadProduct(slug: string): Promise<void> {
    this.currentSlug = slug;
    this.loading.set(true);
    this.notFound = false;
    this.errorMessage = '';
    this.product = null;

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

  get price(): number | null {
    const variant = this.product?.variants?.find(item => item.is_active !== false);
    if (variant?.price !== null && variant?.price !== undefined) return variant.price;
    if (this.product?.base_price != null && this.product?.compare_at_price != null) return this.product.compare_at_price;
    return this.product?.base_price ?? null;
  }

  get salePrice(): number | null {
    const variant = this.product?.variants?.find(item => item.is_active !== false);
    if (variant?.sale_price !== null && variant?.sale_price !== undefined) return variant.sale_price;
    return this.product?.compare_at_price != null ? this.product.base_price ?? null : null;
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
    const specs = this.product?.specifications as Record<string, unknown> | null;
    if (!specs) return null;
    const subcat = specs['subcategory'] ?? specs['Subcategory'];
    return typeof subcat === 'string' && subcat.trim() ? subcat.trim() : null;
  }

  get size(): string | null {
    const specs = this.product?.specifications as Record<string, unknown> | null;
    if (!specs) return null;
    const size = specs['size(3x5)'] ?? specs['size'] ?? specs['Size'];
    return typeof size === 'string' && size.trim() ? size.trim() : null;
  }

  get warrantyPolicy(): string | null {
    const specs = this.product?.specifications as Record<string, unknown> | null;
    if (!specs) return null;
    const warranty = specs['warranty and return policy'] ?? specs['warranty'] ?? specs['Warranty'];
    return typeof warranty === 'string' && warranty.trim() ? warranty.trim() : null;
  }

  get freightPolicy(): string | null {
    const specs = this.product?.specifications as Record<string, unknown> | null;
    if (!specs) return null;
    const freight = specs['Freight'] ?? specs['freight'] ?? specs['Freight and Shipping Policy'];
    return typeof freight === 'string' && freight.trim() ? freight.trim() : null;
  }

  get satus(): string | null {
    const specs = this.product?.specifications as Record<string, unknown> | null;
    if (!specs) return null;
    const satus = specs['SATUS'] ?? specs['status'] ?? specs['Status'];
    return typeof satus === 'string' && satus.trim() ? satus.trim() : null;
  }

  get inquiryUrl(): string {
    return '/custom-requirement';
  }
}
