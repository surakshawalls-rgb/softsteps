import { Component, OnInit, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-shop-page',
  imports: [ProductCard, CatalogToolbar],
  templateUrl: './shop-page.html',
  styleUrl: './shop-page.css',
})
export class ShopPage implements OnInit {
  private readonly catalogQuery = inject(CatalogQueryService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  errorMessage = '';
  products: Product[] = [];

  filter: CatalogFilterState = {
    ...DEFAULT_CATALOG_FILTER
  };

  // The category asked for in the address, for example /shop?category=traditional-carpets
  private requestedCategory: string | null = null;

  constructor(public readonly catalogFilter: CatalogFilterService) {}

  ngOnInit(): void {
    // Opening /shop?category=... selects that category automatically.
    // If you open /shop with no ?category=, the filter stays on its default.
    this.route.queryParamMap.subscribe(params => {
      this.requestedCategory = params.get('category');

      if (this.requestedCategory) {
        this.applyRequestedCategory();
      } else {
        this.filter = { ...this.filter, category: DEFAULT_CATALOG_FILTER.category };
      }
    });

    void this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.loading.set(true);
    this.errorMessage = '';

    try {
      this.products = await this.catalogQuery.getProducts();
    } catch (error) {
      console.error('Failed to load products:', error);
      this.errorMessage = 'Unable to load products. Please try again.';
    } finally {
      this.loading.set(false);
    }

    // The real category options are known only now that the products are loaded,
    // so match the requested category against them.
    if (this.requestedCategory) {
      this.applyRequestedCategory();
    }
  }

  get filteredProducts(): Product[] {
    return this.catalogFilter.filterAndSort(this.products, this.filter);
  }

  get categories() {
    return this.catalogFilter.getCategories(this.products);
  }

  get materials() {
    return this.catalogFilter.getMaterials(this.products);
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

  // ---- category from the address ----

  private applyRequestedCategory(): void {
    if (!this.requestedCategory) {
      return;
    }

    this.filter = {
      ...this.filter,
      category: this.resolveCategory(this.requestedCategory)
    };
  }

  // Finds the shop's own category option that matches the requested one.
  // "traditional-carpets", "traditional-rugs" and "Traditional Rugs" all match
  // the same option, because the words rugs / carpets are ignored when comparing.
  // If nothing matches (or the products are not loaded yet), the requested
  // value is used unchanged.
  private resolveCategory(requested: string): string {
    const target = this.normalizeCategory(requested);
    const options = this.categories as unknown as Array<string | Record<string, unknown>>;

    for (const option of options) {
      if (typeof option === 'string') {
        if (this.normalizeCategory(option) === target) {
          return option;
        }
        continue;
      }

      const candidates = [
        option['value'],
        option['slug'],
        option['id'],
        option['name'],
        option['label']
      ];

      const matches = candidates.some(
        candidate => candidate != null && this.normalizeCategory(String(candidate)) === target
      );

      if (matches) {
        // The dropdown option value is what the filter compares against.
        const filterValue = candidates.find(candidate => candidate != null);
        return String(filterValue);
      }
    }

    return requested;
  }

  private normalizeCategory(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\b(rugs?|carpets?)\b/g, ' ')
      .replace(/\s+/g, '');
  }
}