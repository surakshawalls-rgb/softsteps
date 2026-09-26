export interface Category {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  sort_order?: number;

  [key: string]: unknown;
}
