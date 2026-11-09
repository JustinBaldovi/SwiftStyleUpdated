-- =====================================================================
-- Swift Style PH - create the admin account                 [run 3 of 3]
--
-- Passwords live in Supabase Auth, so the admin user is created there first:
--   Dashboard -> Authentication -> Users -> Add user -> Create new user
--     Email:    admin@swiftstyleph.com
--     Password: (choose one - the old demo password was admin123)
--     Tick "Auto Confirm User"
-- Then run this file. (Signing up on the site as admin@swiftstyleph.com also works.)
--
-- Only the SQL Editor / service role can do this: the website itself can never
-- grant admin, because `role` is not writable from the browser.
-- =====================================================================
update public.profiles
   set role = 'admin'
 where provider = 'email'
   and provider_id = 'admin@swiftstyleph.com';

-- should return 1 row with role = admin
select id, full_name, provider_id, role from public.profiles where role = 'admin';
