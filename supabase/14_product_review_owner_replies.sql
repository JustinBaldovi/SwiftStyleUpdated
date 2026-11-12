-- Enable admin replies to product reviews and prevent customers from changing replies.
-- Run after 10_inventory_reviews.sql and 11_customer_order_cancellation_review_names.sql.
-- Safe to rerun.
begin;

grant usage on schema public to authenticated;

alter table public.product_reviews
  add column if not exists owner_reply text,
  add column if not exists owner_replied_at timestamptz;

alter table public.product_reviews
  drop constraint if exists product_reviews_owner_reply_length;
alter table public.product_reviews
  add constraint product_reviews_owner_reply_length
  check (owner_reply is null or char_length(btrim(owner_reply)) between 1 and 1500);

grant update (owner_reply, owner_replied_at) on public.product_reviews to authenticated;

drop policy if exists product_reviews_admin_reply on public.product_reviews;
create policy product_reviews_admin_reply on public.product_reviews
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.protect_product_review_owner_reply()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_admin() and tg_op = 'INSERT'
     and (new.owner_reply is not null or new.owner_replied_at is not null) then
    raise exception 'Only the store owner can reply to customer reviews.';
  end if;
  if not public.is_admin() and tg_op = 'UPDATE' and (
    new.owner_reply is distinct from old.owner_reply or
    new.owner_replied_at is distinct from old.owner_replied_at
  ) then
    raise exception 'Only the store owner can reply to customer reviews.';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_product_review_owner_reply() from public, anon, authenticated;

drop trigger if exists product_reviews_protect_owner_reply on public.product_reviews;
create trigger product_reviews_protect_owner_reply
  before insert or update on public.product_reviews
  for each row execute function public.protect_product_review_owner_reply();

notify pgrst, 'reload schema';

commit;
