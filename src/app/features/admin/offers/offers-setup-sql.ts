/**
 * The database setup for offers. The Offers page shows this text with a Copy button
 * when the offers table does not exist yet. Same content as
 * supabase/migrations/202611210001_product_offers.sql
 */
export const OFFERS_SETUP_SQL = `-- ==========================================================================
-- Soft Steps - Product offers (applied by product code, with start / end dates)
-- Run once in Supabase Dashboard > SQL Editor.  Safe to run again.
-- ==========================================================================

-- 0) Helper: is the signed-in user an admin?
create or replace function public.ss_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- 1) The offers table
create table if not exists public.product_offers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) > 0),
  offer_type text not null default 'discount'
    check (offer_type in ('festive', 'big_billion', 'discount', 'custom')),
  discount_type text not null default 'percent'
    check (discount_type in ('percent', 'flat')),
  discount_value numeric(12, 2) not null check (discount_value > 0),
  product_codes text[] not null default '{}',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_type <> 'percent' or discount_value <= 90),
  check (ends_at is null or ends_at > starts_at)
);

create or replace function public.ss_touch_product_offers()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ss_touch_product_offers on public.product_offers;
create trigger ss_touch_product_offers
  before update on public.product_offers
  for each row execute function public.ss_touch_product_offers();

-- 2) Who can see / change offers
alter table public.product_offers enable row level security;

drop policy if exists "offers_public_read_live" on public.product_offers;
create policy "offers_public_read_live"
  on public.product_offers for select
  to anon, authenticated
  using (is_active and starts_at <= now() and (ends_at is null or ends_at > now()));

drop policy if exists "offers_admin_read_all" on public.product_offers;
create policy "offers_admin_read_all"
  on public.product_offers for select
  to authenticated
  using (public.ss_is_admin());

drop policy if exists "offers_admin_insert" on public.product_offers;
create policy "offers_admin_insert"
  on public.product_offers for insert
  to authenticated
  with check (public.ss_is_admin());

drop policy if exists "offers_admin_update" on public.product_offers;
create policy "offers_admin_update"
  on public.product_offers for update
  to authenticated
  using (public.ss_is_admin())
  with check (public.ss_is_admin());

drop policy if exists "offers_admin_delete" on public.product_offers;
create policy "offers_admin_delete"
  on public.product_offers for delete
  to authenticated
  using (public.ss_is_admin());

grant select on public.product_offers to anon, authenticated;
grant insert, update, delete on public.product_offers to authenticated;

-- 3) Clean-up of the first (older) offers version, if it was ever used:
--    give the products their original prices back, then remove the old functions.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'offer_type'
  ) then
    execute 'update public.products
             set base_price = offer_original_base_price,
                 compare_at_price = offer_original_compare_at_price,
                 offer_type = null, offer_label = null, offer_discount_type = null,
                 offer_discount_value = null, offer_original_base_price = null,
                 offer_original_compare_at_price = null, offer_applied_at = null
             where offer_type is not null';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_variants' and column_name = 'offer_active'
  ) then
    execute 'update public.product_variants
             set sale_price = offer_original_sale_price,
                 offer_original_sale_price = null,
                 offer_active = false
             where offer_active';
  end if;
end
$$;

drop function if exists public.apply_product_offer(text[], text, text, text, numeric);
drop function if exists public.remove_product_offer(text[]);
`;