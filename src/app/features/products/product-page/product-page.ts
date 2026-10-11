import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CatalogQueryService } from '../../../data-access/queries/catalog/catalog-query.service';
import { Product } from '../../../shared/models/product.model';
import { ProductGallery } from '../product-gallery/product-gallery';
import { PriceDisplay } from '../../../shared/components/price-display/price-display';

@Component({
  selector: 'app-product-page',
  imports: [RouterLink, ProductGallery, PriceDisplay],
  templateUrl: './product-page.html',
  styleUrl: './product-page.css',
})
export class ProductPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogQuery = inject(CatalogQueryService);
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

  get inquiryUrl(): string {
    return '/custom-requirement';
  }
}
