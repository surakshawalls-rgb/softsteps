import { AppliedOffer } from './offer.model';
export interface ProductVariant {
  id?: string;
  product_id?: string;
  sku?: string;
  size?: string;
  color?: string;
  price?: number;
  sale_price?: number | null;
  compare_at_price?: number | null;
  stock_quantity?: number;
  is_active?: boolean;
}

export interface ProductImage {
  id?: string;
  product_id?: string;
  image_url?: string;
  alt_text?: string;
  sort_order?: number;
  is_primary?: boolean;
  image_type?: string | null;
}

export interface ProductSpecifications {
  subcategory?: string | null;
  size?: string | null;
  size_3x5?: number | string | null;
  size_3x5_price?: number | string | null;
  spreadsheet_status?: string | null;
  warranty_policy?: string | null;
  freight_policy?: string | null;
  source_category?: string | null;
  [key: string]: unknown;
}

export interface Product {
  id?: string;
  product_code?: string | null;
  name?: string;
  slug?: string;
  description?: string;
  short_description?: string;
  design_story?: string | null;
  style?: string | null;
  primary_color?: string | null;
  shape?: string | null;
  pile_height_mm?: number | string | null;
  base_price?: number | null;
  compare_at_price?: number | null;
  currency?: string | null;
  construction?: string | null;
  origin_country?: string | null;
  moq?: number | null;
  minimum_order_quantity?: number | null;
  lead_time?: string | null;
  is_new_arrival?: boolean;
  is_best_seller?: boolean;
  is_customizable?: boolean;
  made_to_order?: boolean;
  cart_enabled?: boolean;
  verification_status?: string | null;
  specifications?: ProductSpecifications | null;
  meta_title?: string | null;
  meta_description?: string | null;
  tags?: string[] | null;

  category_id?: string;
  collection_id?: string;
  material_id?: string;
  supplier_id?: string;

  status?: string;
  featured?: boolean;

  category?: Category;
  collection?: Collection;
  material?: Material;
  supplier?: Record<string, unknown> | null;

  variants?: ProductVariant[];
  images?: ProductImage[];
  
  /** Set when a live offer has been applied to this product's prices. */
  offer?: AppliedOffer | null;

  created_at?: string;
  updated_at?: string;

  [key: string]: unknown;
}

export interface Category {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface Collection {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface Material {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  is_active?: boolean;
}
