-- Align an existing profiles table with the Auth signup trigger.
-- The trigger and application expect the profile primary key to be named `id`.
-- Renaming preserves values and automatically updates foreign-key dependencies.
do $$
declare
  has_id boolean;
  has_user_id boolean;
  user_id_is_uuid boolean;
  user_id_is_primary_key boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'id'
  ) into has_id;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'user_id'
  ) into has_user_id;

  if has_id and not has_user_id then
    return;
  end if;

  if has_id or not has_user_id then
    raise exception 'Unexpected public.profiles columns; expected only one UUID key column named user_id or id.';
  end if;

  select data_type = 'uuid'
    into user_id_is_uuid
    from information_schema.columns
   where table_schema = 'public' and table_name = 'profiles' and column_name = 'user_id';

  select exists (
    select 1
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on kcu.constraint_catalog = tc.constraint_catalog
       and kcu.constraint_schema = tc.constraint_schema
       and kcu.constraint_name = tc.constraint_name
     where tc.table_schema = 'public'
       and tc.table_name = 'profiles'
       and tc.constraint_type = 'PRIMARY KEY'
       and kcu.column_name = 'user_id'
  ) into user_id_is_primary_key;

  if not coalesce(user_id_is_uuid, false) or not user_id_is_primary_key then
    raise exception 'public.profiles.user_id must be the UUID primary key; no changes made.';
  end if;

  alter table public.profiles rename column user_id to id;
end
$$;
