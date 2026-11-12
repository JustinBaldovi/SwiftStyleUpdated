-- Store complete structured delivery addresses and optional courier instructions.
-- Run after 01_schema.sql. Safe to rerun.
begin;

grant usage on schema public to authenticated;

alter table public.orders
  add column if not exists delivery_city text,
  add column if not exists delivery_province text,
  add column if not exists postal_code text,
  add column if not exists delivery_note text;

drop function if exists public.place_order(text, text, text, text, public.payment_method_type);

create function public.place_order(
  p_full_name      text,
  p_email          text,
  p_phone          text,
  p_address        text,
  p_city           text,
  p_province       text,
  p_postal_code    text,
  p_delivery_note  text default '',
  p_payment_method public.payment_method_type default 'COD'
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := (select auth.uid());
  v_order_id bigint;
  v_total    numeric(10,2);
  r          record;
begin
  if v_uid is null then
    raise exception 'You must be signed in to place an order.' using errcode = '28000';
  end if;

  if coalesce(trim(p_full_name), '') = '' or coalesce(trim(p_email), '') = ''
     or coalesce(trim(p_phone), '') = '' or coalesce(trim(p_address), '') = ''
     or coalesce(trim(p_city), '') = '' or coalesce(trim(p_province), '') = ''
     or coalesce(trim(p_postal_code), '') = '' then
    raise exception 'Complete your name, email, phone number, address line, city, province, and postal code.' using errcode = '22023';
  end if;

  if length(trim(p_address)) > 250 or length(trim(p_city)) > 100
     or length(trim(p_province)) > 100 or length(coalesce(trim(p_delivery_note), '')) > 500 then
    raise exception 'Please shorten the delivery address or instructions.' using errcode = '22023';
  end if;

  if trim(p_postal_code) !~ '^[0-9]{4}$' then
    raise exception 'Enter a 4-digit Philippine postal code.' using errcode = '22023';
  end if;

  select sum(p.price * c.quantity) into v_total
  from public.cart c join public.products p on p.product_id = c.product_id
  where c.user_id = v_uid;

  if v_total is null then
    raise exception 'Your cart is empty.' using errcode = '22023';
  end if;

  insert into public.orders (
    user_id, full_name, email, phone, address, delivery_city, delivery_province,
    postal_code, delivery_note, payment_method, total_amount, order_status
  )
  values (
    v_uid, trim(p_full_name), trim(p_email), trim(p_phone), trim(p_address),
    trim(p_city), trim(p_province), trim(p_postal_code),
    nullif(trim(coalesce(p_delivery_note, '')), ''), p_payment_method, v_total, 'Pending'
  )
  returning order_id into v_order_id;

  for r in
    select c.product_id, c.color, c.quantity, p.product_name, p.price
    from public.cart c join public.products p on p.product_id = c.product_id
    where c.user_id = v_uid
    order by c.cart_id
  loop
    update public.products set stock = stock - r.quantity
    where product_id = r.product_id and stock >= r.quantity;
    if not found then
      raise exception 'Not enough stock for "%".', r.product_name using errcode = '23514';
    end if;

    insert into public.order_items (order_id, product_id, product_name, color, quantity, price, subtotal)
    values (v_order_id, r.product_id, r.product_name, nullif(r.color, ''), r.quantity, r.price, r.price * r.quantity);
  end loop;

  delete from public.cart where user_id = v_uid;
  return v_order_id;
end;
$$;

revoke execute on function public.place_order(text, text, text, text, text, text, text, text, public.payment_method_type) from public, anon;
grant execute on function public.place_order(text, text, text, text, text, text, text, text, public.payment_method_type) to authenticated;

notify pgrst, 'reload schema';

commit;
