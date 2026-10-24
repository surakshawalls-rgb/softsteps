export type CatalogSort =
  | 'featured'
  | 'newest'
  | 'price-low'
  | 'price-high'
  | 'name-az';

export interface CatalogFilterState {
  search: string;
  /** selected category slugs */
  categories: string[];
  /** selected material ids */
  materials: string[];
  /** selected styles (normalised, see normalizeFilterValue) */
  styles: string[];
  /** selected colours (normalised, see normalizeFilterValue) */
  colors: string[];
  minPrice: number | null;
  maxPrice: number | null;
  sort: CatalogSort;
}

export const DEFAULT_CATALOG_FILTER: CatalogFilterState = {
  search: '',
  categories: [],
  materials: [],
  styles: [],
  colors: [],
  minPrice: null,
  maxPrice: null,
  sort: 'featured'
};

/** Lower-cases and trims a value so "Hand Knotted " and "hand knotted" match. */
export function normalizeFilterValue(value: string | null | undefined): string {
  return (value ?? '').toString().trim().toLowerCase();
}