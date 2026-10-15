do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_images'
      and policyname = 'public_read_active_product_images'
  ) then
    create policy public_read_active_product_images
      on public.product_images
      for select
      to anon, authenticated
      using (
        exists (
          select 1
          from public.products
          where products.id = product_images.product_id
            and products.status = 'active'
        )
      );
  end if;
end
$$;
