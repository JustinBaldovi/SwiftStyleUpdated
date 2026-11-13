-- Customer-owned product ratings and favorites. Safe to rerun.
begin;

create table if not exists public.product_ratings (
  product_id integer not null references public.products (product_id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_id, user_id)
);
create index if not exists product_ratings_product_idx
  on public.product_ratings (product_id);

create table if not exists public.product_favorites (
  product_id integer not null references public.products (product_id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, user_id)
);
create index if not exists product_favorites_user_idx
  on public.product_favorites (user_id, created_at desc);

alter table public.product_ratings enable row level security;
alter table public.product_favorites enable row level security;

drop policy if exists product_ratings_read on public.product_ratings;
drop policy if exists product_ratings_insert_own on public.product_ratings;
drop policy if exists product_ratings_update_own on public.product_ratings;
drop policy if exists product_favorites_own on public.product_favorites;

create policy product_ratings_read on public.product_ratings
  for select to authenticated using (true);
create policy product_ratings_insert_own on public.product_ratings
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy product_ratings_update_own on public.product_ratings
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy product_favorites_own on public.product_favorites
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all privileges on table public.product_ratings, public.product_favorites
  from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, update on table public.product_ratings to authenticated;
grant select, insert, delete on table public.product_favorites to authenticated;

commit;
