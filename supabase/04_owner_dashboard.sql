-- Run after 01_schema.sql through 03_make_admin.sql.
-- Existing projects need these additional order statuses and owner QR storage.
alter type public.order_status_type add value if not exists 'Preparing';
alter type public.order_status_type add value if not exists 'Packaging';
alter type public.order_status_type add value if not exists 'Ready for pickup';

create table if not exists public.store_settings (
  setting_key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.store_settings enable row level security;
drop policy if exists store_settings_admin_all on public.store_settings;
create policy store_settings_admin_all on public.store_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on public.store_settings from anon, authenticated;
grant select, insert, update, delete on public.store_settings to authenticated;
