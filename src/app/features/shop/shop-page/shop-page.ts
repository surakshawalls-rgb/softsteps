import { Component, OnInit, inject, signal } from '@angular/core';
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

  readonly loading = signal(true);
  errorMessage = '';
  products: Product[] = [];

  filter: CatalogFilterState = {
    ...DEFAULT_CATALOG_FILTER
  };

  constructor(public readonly catalogFilter: CatalogFilterService) {}

  ngOnInit(): void {
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
}
