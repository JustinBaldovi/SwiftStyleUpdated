-- Create a single-item checkout without adding it to the customer's saved cart.
-- Run after 13_checkout_structured_delivery_address.sql. Safe to rerun.
begin;

grant usage on schema public to authenticated;

create or replace function public.place_direct_order(
  p_full_name      text,
  p_email          text,
  p_phone          text,
  p_address        text,
  p_city           text,
  p_province       text,
  p_postal_code    text,
  p_product_id     integer,
  p_color          text,
  p_quantity       integer,
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
  v_price    numeric(10,2);
  v_name     text;
  v_stock    integer;
  v_colors   text[];
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
  if trim(p_postal_code) !~ '^[0-9]{4}$' then
    raise exception 'Enter a 4-digit Philippine postal code.' using errcode = '22023';
  end if;
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Choose a quantity of at least one.' using errcode = '22023';
  end if;
  if length(trim(p_address)) > 250 or length(trim(p_city)) > 100
     or length(trim(p_province)) > 100 or length(coalesce(trim(p_delivery_note), '')) > 500 then
    raise exception 'Please shorten the delivery address or instructions.' using errcode = '22023';
  end if;

  select product_name, price, stock, colors
  into v_name, v_price, v_stock, v_colors
  from public.products
  where product_id = p_product_id
  for update;
  if not found then
    raise exception 'This product is no longer available.' using errcode = 'P0002';
  end if;
  if v_stock < p_quantity then
    raise exception 'Only % of this product remain in stock.', v_stock using errcode = '23514';
  end if;
  if cardinality(v_colors) > 0 and coalesce(trim(p_color), '') = '' then
    raise exception 'Choose a color for this product.' using errcode = '22023';
  end if;
  if coalesce(trim(p_color), '') <> '' and not (trim(p_color) = any(v_colors)) then
    raise exception 'The selected color is not available for this product.' using errcode = '22023';
  end if;

  insert into public.orders (
    user_id, full_name, email, phone, address, delivery_city, delivery_province,
    postal_code, delivery_note, payment_method, total_amount, order_status
  )
  values (
    v_uid, trim(p_full_name), trim(p_email), trim(p_phone), trim(p_address),
    trim(p_city), trim(p_province), trim(p_postal_code),
    nullif(trim(coalesce(p_delivery_note, '')), ''), p_payment_method,
    v_price * p_quantity, 'Pending'
  )
  returning order_id into v_order_id;

  update public.products
  set stock = stock - p_quantity
  where product_id = p_product_id and stock >= p_quantity;
  if not found then
    raise exception 'There is not enough stock to complete this order.' using errcode = '23514';
  end if;

  insert into public.order_items (order_id, product_id, product_name, color, quantity, price, subtotal)
  values (
    v_order_id, p_product_id, v_name, nullif(trim(coalesce(p_color, '')), ''),
    p_quantity, v_price, v_price * p_quantity
  );

  return v_order_id;
end;
$$;

revoke execute on function public.place_direct_order(
  text, text, text, text, text, text, text, integer, text, integer, text, public.payment_method_type
) from public, anon;
grant execute on function public.place_direct_order(
  text, text, text, text, text, text, text, integer, text, integer, text, public.payment_method_type
) to authenticated;

notify pgrst, 'reload schema';

commit;
