-- Install the atomic, owner-checked cancellation endpoint used by the customer orders page.
-- Run after 01_schema.sql. Safe to rerun.
begin;

grant usage on schema public to authenticated;

create or replace function public.cancel_my_order(p_order_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  cancelled_order_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Sign in to cancel an order.';
  end if;

  update public.orders
  set order_status = 'Cancelled'
  where order_id = p_order_id
    and user_id = auth.uid()
    and order_status = 'Pending'
  returning order_id into cancelled_order_id;

  return cancelled_order_id is not null;
end;
$$;

revoke all on function public.cancel_my_order(bigint) from public, anon, authenticated;
grant execute on function public.cancel_my_order(bigint) to authenticated;

notify pgrst, 'reload schema';

commit;
