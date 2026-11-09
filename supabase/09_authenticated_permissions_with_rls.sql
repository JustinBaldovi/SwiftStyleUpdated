-- Grant the app's signed-in role the table operations it needs while preserving RLS.
-- Do not grant these privileges to PUBLIC or anon: orders and profiles contain
-- customer data. Run after migrations 04 and 08.
begin;

grant usage on schema public to authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.cart enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_settings enable row level security;

revoke all privileges on table
  public.profiles,
  public.categories,
  public.products,
  public.cart,
  public.orders,
  public.order_items,
  public.store_settings
from public, anon, authenticated;

revoke all privileges on all sequences in schema public from public, anon, authenticated;

revoke all privileges (id, full_name, email, provider, provider_id, phone, address, role, created_at)
on table public.profiles from public, anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (full_name, phone, address) on table public.profiles to authenticated;

grant select, insert, update, delete on table
  public.categories,
  public.products,
  public.cart,
  public.orders,
  public.order_items,
  public.store_settings
to authenticated;

grant usage, select on all sequences in schema public to authenticated;

commit;
