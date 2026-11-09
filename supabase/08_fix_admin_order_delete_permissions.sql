-- Repair privileges and RLS for the owner-dashboard order delete action.
-- Safe to rerun. Deletion remains restricted to authenticated admins.
grant usage on schema public to authenticated;
grant select, delete on table public.orders to authenticated;

drop policy if exists orders_admin_delete on public.orders;
create policy orders_admin_delete on public.orders
  for delete to authenticated
  using (public.is_admin());
