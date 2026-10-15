alter table public.products
  add column if not exists product_code text,
  add column if not exists catalog_category text,
  add column if not exists subcategory text,
  add column if not exists design_story text,
  add column if not exists construction text,
  add column if not exists style text,
  add column if not exists primary_color text,
  add column if not exists shape text,
  add column if not exists pile_height text,
  add column if not exists currency text,
  add column if not exists base_price numeric(12, 2),
  add column if not exists compare_at_price numeric(12, 2),
  add column if not exists is_new_arrival boolean,
  add column if not exists best_seller boolean,
  add column if not exists customizable boolean,
  add column if not exists made_to_order boolean,
  add column if not exists cart_enabled boolean,
  add column if not exists purchase_eligible boolean not null default false,
  add column if not exists review_status text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists keywords text[],
  add column if not exists published boolean not null default false;

create unique index if not exists products_product_code_unique
  on public.products (product_code)
  where product_code is not null;

alter table public.categories
  add column if not exists image_url text,
  add column if not exists is_active boolean not null default false,
  add column if not exists sort_order integer not null default 0;

create unique index if not exists categories_slug_unique
  on public.categories (slug)
  where slug is not null;

alter table public.materials
  add column if not exists is_active boolean not null default false;

create unique index if not exists materials_slug_unique
  on public.materials (slug)
  where slug is not null;

alter table public.product_images
  add column if not exists image_role text not null default 'gallery';

create unique index if not exists product_images_product_url_unique
  on public.product_images (product_id, image_url);
