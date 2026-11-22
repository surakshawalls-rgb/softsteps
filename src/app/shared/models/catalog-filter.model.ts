import { Product } from './product.model';

export type CatalogSort =
  | 'featured'
  | 'newest'
  | 'price-low'
  | 'price-high'
  | 'name-az';

export interface CatalogFilterState {
  search: string;
  /** selected normalized subcategory values */
  subcategories: string[];
  /** selected category slugs */
  categories: string[];
  /** selected material ids */
  materials: string[];
  /** selected styles (normalised, see normalizeFilterValue) */
  styles: string[];
  /** selected colours (normalised, see normalizeFilterValue) */
  colors: string[];
  /** "customizable" / "made-to-order" */
  availability?: string[];
  /** selected sizes (normalised) */
  sizes?: string[];
  /** selected shapes (normalised) */
  shapes?: string[];
  /** selected weaving techniques / constructions (normalised) */
  constructions?: string[];
  /** selected minimum-discount steps, e.g. "20" means 20% & above */
  discounts?: string[];
  minPrice: number | null;
  maxPrice: number | null;
  sort: CatalogSort;
}

export const DEFAULT_CATALOG_FILTER: CatalogFilterState = {
  search: '',
  subcategories: [],
  categories: [],
  materials: [],
  styles: [],
  colors: [],
  availability: [],
  sizes: [],
  shapes: [],
  constructions: [],
  discounts: [],
  minPrice: null,
  maxPrice: null,
  sort: 'featured'
};

/** Lower-cases and trims a value so "Hand Knotted " and "hand knotted" match. */
export function normalizeFilterValue(value: string | null | undefined): string {
  return (value ?? '').toString().trim().toLowerCase();
}

/** The discount steps shown in the filter (percent "& above"). */
export const DISCOUNT_STEPS = [10, 20, 30, 40];

/**
 * "blue, navy, cream, ochre" becomes four separate colours, so a rug turns up
 * under every colour it really has.
 */
export function productColors(product: Product): string[] {
  const raw = (product.primary_color ?? '').toString();
  const parts = raw
    .split(/,|\/|&|;|\band\b/i)
    .map(part => normalizeFilterValue(part))
    .filter(Boolean);

  return Array.from(new Set(parts));
}

/** Sizes a rug is sold in (variants first, then the size from the catalogue sheet). */
export function productSizes(product: Product): { value: string; label: string }[] {
  const found = new Map<string, string>();
  const add = (raw: unknown): void => {
    const label = typeof raw === 'string' ? raw.trim() : '';
    const value = normalizeFilterValue(label);
    if (label && value && !found.has(value)) found.set(value, label);
  };

  for (const variant of product.variants ?? []) {
    if (variant.is_active !== false) add(variant.size);
  }

  if (!found.size) {
    const specSize = product.specifications?.['size'];
    if (typeof specSize === 'string' && specSize.trim() && !Number.isFinite(Number(specSize))) {
      add(specSize);
    } else if (product.specifications?.['size_3x5_price'] != null) {
      add('3 x 5 ft');
    }
  }

  return Array.from(found, ([value, label]) => ({ value, label }));
}

export function productAvailability(product: Product): string[] {
  const out: string[] = [];
  if (product.is_customizable === true) out.push('customizable');
  if (product.made_to_order === true) out.push('made-to-order');
  return out;
}

/** How many percent cheaper the rug is because of a live offer (0 = no offer). */
export function productDiscount(product: Product): number {
  const off = product.offer?.percentOff;
  return typeof off === 'number' && off > 0 ? off : 0;
}