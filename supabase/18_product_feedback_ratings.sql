-- Derive product star summaries from customer feedback only.
-- Run after 10_inventory_reviews.sql and 17_product_ratings_favorites.sql.
begin;

grant usage on schema public to authenticated;

drop policy if exists product_reviews_insert_own on public.product_reviews;
create policy product_reviews_insert_own on public.product_reviews
  for insert to authenticated
  with check (user_id = (select auth.uid()) and not public.is_admin());

drop policy if exists product_reviews_update_own on public.product_reviews;
create policy product_reviews_update_own on public.product_reviews
  for update to authenticated
  using (user_id = (select auth.uid()) and not public.is_admin())
  with check (user_id = (select auth.uid()) and not public.is_admin());

create or replace function public.product_rating_summaries()
returns table (product_id integer, average_rating numeric, rating_count bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select review.product_id,
         round(avg(review.rating)::numeric, 2) as average_rating,
         count(*) as rating_count
  from public.product_reviews as review
  join public.profiles as customer on customer.id = review.user_id
  where customer.role = 'customer'
  group by review.product_id;
$$;

revoke all on function public.product_rating_summaries() from public, anon;
grant execute on function public.product_rating_summaries() to authenticated;

notify pgrst, 'reload schema';

commit;
