import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CatalogFilterState,
  CatalogSort
} from '../../models/catalog-filter.model';

@Component({
  selector: 'app-catalog-toolbar',
  imports: [FormsModule],
  templateUrl: './catalog-toolbar.html',
  styleUrl: './catalog-toolbar.css'
})
export class CatalogToolbar {

  @Input() filter: CatalogFilterState = {
    search: '',
    category: '',
    material: '',
    minPrice: null,
    maxPrice: null,
    sort: 'featured'
  };

  @Input() categories: { name: string; slug: string }[] = [];
  @Input() materials: { name: string; slug: string }[] = [];
  @Input() resultCount = 0;
  @Input() totalCount = 0;

  @Output() filterChange =
    new EventEmitter<CatalogFilterState>();

  mobileFiltersOpen = false;

  readonly sortOptions: {
    value: CatalogSort;
    label: string;
  }[] = [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name-az', label: 'Name: A to Z' }
  ];

  update(): void {
    this.filterChange.emit({
      ...this.filter
    });
  }

  clear(): void {
    this.filter = {
      search: '',
      category: '',
      material: '',
      minPrice: null,
      maxPrice: null,
      sort: 'featured'
    };

    this.update();
  }

  hasFilters(): boolean {
    return Boolean(
      this.filter.search ||
      this.filter.category ||
      this.filter.material ||
      this.filter.minPrice !== null ||
      this.filter.maxPrice !== null ||
      this.filter.sort !== 'featured'
    );
  }

  toggleMobileFilters(): void {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;
  }
}
