export type CatalogSort =
  | 'featured'
  | 'newest'
  | 'price-low'
  | 'price-high'
  | 'name-az';

export interface CatalogFilterState {
  search: string;
  category: string;
  material: string;
  minPrice: number | null;
  maxPrice: number | null;
  sort: CatalogSort;
}

export const DEFAULT_CATALOG_FILTER: CatalogFilterState = {
  search: '',
  category: '',
  material: '',
  minPrice: null,
  maxPrice: null,
  sort: 'featured'
};
