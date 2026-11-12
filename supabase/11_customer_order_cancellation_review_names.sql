-- Allow customers to cancel only their own pending orders and display reviewer names.
-- Run after 01_schema.sql, 09_authenticated_permissions_with_rls.sql, and
-- 10_inventory_reviews.sql. Safe to rerun.
begin;

grant usage on schema public to authenticated;

-- Remove the broad UPDATE grant from migration 09, then retain only the status
-- column required by the admin dashboard and the pending-only customer action.
revoke update on table public.orders from authenticated;
grant update (order_status) on table public.orders to authenticated;

drop policy if exists orders_customer_cancel on public.orders;
create policy orders_customer_cancel on public.orders
  for update to authenticated
  using (user_id = (select auth.uid()) and order_status = 'Pending')
  with check (user_id = (select auth.uid()) and order_status = 'Cancelled');

alter table public.product_reviews
  add column if not exists reviewer_name text;

update public.product_reviews r
set reviewer_name = case
  when p.provider = 'instagram' then '@' || p.provider_id
  else coalesce(nullif(btrim(p.full_name), ''), 'Customer')
end
from public.profiles p
where p.id = r.user_id
  and r.reviewer_name is null;

alter table public.product_reviews
  alter column reviewer_name set not null;

create or replace function public.set_product_review_reviewer_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select case
    when p.provider = 'instagram' then '@' || p.provider_id
    else coalesce(nullif(btrim(p.full_name), ''), 'Customer')
  end
  into new.reviewer_name
  from public.profiles p
  where p.id = new.user_id;

  if new.reviewer_name is null then
    raise exception 'Could not determine the review author name.';
  end if;

  return new;
end;
$$;

revoke all on function public.set_product_review_reviewer_name() from public, anon, authenticated;

drop trigger if exists product_reviews_set_reviewer_name on public.product_reviews;
create trigger product_reviews_set_reviewer_name
  before insert or update of user_id on public.product_reviews
  for each row execute function public.set_product_review_reviewer_name();

notify pgrst, 'reload schema';

commit;
