export interface ProductVariant {
  id?: string;
  product_id?: string;
  sku?: string;
  size?: string;
  color?: string;
  price?: number;
  sale_price?: number | null;
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
}

export interface Product {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  short_description?: string;

  category_id?: string;
  collection_id?: string;
  material_id?: string;
  supplier_id?: string;

  status?: string;
  featured?: boolean;

  category?: Category;
  collection?: Collection;
  material?: Material;

  variants?: ProductVariant[];
  images?: ProductImage[];

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
