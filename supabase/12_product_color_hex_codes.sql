-- Store an optional hex swatch color for every named product color.
-- Run after supabase/10_inventory_reviews.sql.
begin;

alter table public.products
  add column if not exists color_hexes jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_color_hexes_object_check'
  ) then
    alter table public.products
      add constraint products_color_hexes_object_check
      check (jsonb_typeof(color_hexes) = 'object');
  end if;
end
$$;

notify pgrst, 'reload schema';

commit;
