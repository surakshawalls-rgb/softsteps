import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { CatalogToolbar } from '../../../shared/components/catalog-toolbar/catalog-toolbar';
import { Product } from '../../../shared/models/product.model';
import {
  CatalogFilterState,
  DEFAULT_CATALOG_FILTER
} from '../../../shared/models/catalog-filter.model';
import { CatalogFilterService } from '../../../shared/services/catalog-filter.service';
import { CatalogQueryService } from '../../../data-access/queries/catalog/catalog-query.service';

interface CatalogOption {
  id: string;
  name: string;
  slug: string;
}

@Component({
  selector: 'app-shop-page',
  imports: [ProductCard, CatalogToolbar],
  templateUrl: './shop-page.html',
  styleUrl: './shop-page.css',
})
export class ShopPage implements OnInit {
  private readonly catalogQuery = inject(CatalogQueryService);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  readonly loading = signal(true);

  errorMessage = '';
  products: Product[] = [];
  categories: CatalogOption[] = [];
  materials: CatalogOption[] = [];

  filter: CatalogFilterState = {
    ...DEFAULT_CATALOG_FILTER
  };

  private requestedCategory: string | null = null;

  /** true when the visitor came from a category / home link and should land on the filters */
  private landOnFilters = false;

  constructor(public readonly catalogFilter: CatalogFilterService) {}

  ngOnInit(): void {
    this.landOnFilters = this.route.snapshot.fragment === 'catalog' || !!this.route.snapshot.queryParamMap.get('category');

    // Start at the filters straight away (no flash of the big banner while products load)
    if (this.landOnFilters) {
      this.scrollToFilters();
    }

    this.route.queryParamMap.subscribe(params => {
      this.requestedCategory = params.get('category');

      if (this.products.length && this.requestedCategory) {
        this.applyRequestedCategory();
      } else if (!this.requestedCategory) {
        this.filter = {
          ...this.filter,
          category: DEFAULT_CATALOG_FILTER.category
        };
      }
    });

    void this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.loading.set(true);
    this.errorMessage = '';

    try {
      // Load each dataset from its own Supabase table/query.
      const [products, categories, materials] = await Promise.all([
        this.catalogQuery.getProducts(),
        this.catalogQuery.getCategories(),
        this.catalogQuery.getMaterials()
      ]);

      this.products = products ?? [];

      this.categories = (categories ?? [])
        .filter(item => item.is_active !== false && item.slug && item.name)
        .map(item => ({
          id: item.id,
          name: item.name,
          slug: item.slug
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      this.materials = (materials ?? [])
        .filter(item => item.is_active !== false && item.id && item.name)
        .map(item => ({
          id: item.id,
          name: item.name,
          slug: item.slug ?? ''
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      console.info('Shop catalogue loaded:', {
        products: this.products.length,
        categories: this.categories.length,
        materials: this.materials.length
      });
    } catch (error) {
      console.error('Failed to load shop catalogue:', error);
      this.errorMessage = 'Unable to load products. Please try again.';
    } finally {
      this.loading.set(false);
    }

    if (this.requestedCategory) {
      this.applyRequestedCategory();
    }

    // Products are on screen now: line the filters up at the top of the screen
    if (this.landOnFilters) {
      this.scrollToFilters();
    }
  }

  /** Scrolls so the filters sit at the top of the screen (skips the banner above them). */
  private scrollToFilters(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    setTimeout(() => {
      const target = document.getElementById('catalog') ?? document.getElementById('catalog-section');
      target?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, 60);
  }

  get filteredProducts(): Product[] {
    return this.catalogFilter.filterAndSort(this.products, this.filter);
  }

  onFilterChange(filter: CatalogFilterState): void {
    this.filter = { ...filter };
  }

  clearFilters(): void {
    this.filter = this.catalogFilter.reset();
  }

  retry(): void {
    void this.loadProducts();
  }

  private applyRequestedCategory(): void {
    if (!this.requestedCategory) {
      return;
    }

    const target = this.normalizeCategory(this.requestedCategory);

    const matchedCategory = this.categories.find(category =>
      [
        category.slug,
        category.name,
        category.id
      ].some(value => this.normalizeCategory(value) === target)
    );

    this.filter = {
      ...this.filter,
      category: matchedCategory?.slug ?? this.requestedCategory
    };
  }

  private normalizeCategory(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\b(rugs?|carpets?)\b/g, ' ')
      .replace(/\s+/g, '')
      .trim();
  }
}