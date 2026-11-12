# Swift Style PH → Supabase

Everything here was converted from `data base/database/swiftstyleph.sql` (MySQL) and the
localStorage logic in `assets/js/app.js`. The SQL was tested on PostgreSQL 16 (signup rules, RLS,
checkout, stock, admin permissions). It has **not** been run against a live Supabase project, since
I can't reach yours — step 5 below is your smoke test.

## 1. Set up Supabase (5 min)

1. https://supabase.com → **New project** (save the database password).
2. **Authentication → Providers → Email → turn OFF "Confirm email".**
   (Facebook/Instagram accounts use made-up internal emails that can't receive mail, so confirmation must be off.)
3. **SQL Editor** → run, in this order: `supabase/01_schema.sql`, `supabase/02_seed.sql`.
4. On existing projects where signup fails with `column "id" of relation "profiles" does not exist`,
   run `supabase/06_fix_profiles_user_id.sql` before creating users. It safely renames the existing
   UUID primary-key column `user_id` to `id`; it does not recreate or delete profile data. It is also
   safe to run on a correctly initialized project.
5. **Authentication → Users → Add user** → a real email you control + a strong password; tick *Auto Confirm User*.
   Then run `supabase/03_make_admin.sql` (update its email to match the owner account first).
6. Run `supabase/04_owner_dashboard.sql` to add fulfillment statuses and owner payment-QR storage.
7. Run `supabase/05_realtime_orders.sql` to publish order changes to Supabase Realtime.
8. Run `supabase/07_admin_delete_orders.sql` to enable admin-only order deletion from the dashboard.
   If Supabase reports `permission denied for table orders`, run `supabase/08_fix_admin_order_delete_permissions.sql`.
9. Optional: run `supabase/09_authenticated_permissions_with_rls.sql` to reset app-table grants for signed-in users
   while keeping row-level security enabled. It does not grant access to anonymous users; existing RLS policies
   continue to restrict customer and admin operations.
10. Run `supabase/10_inventory_reviews.sql` to enable admin inventory/image management and customer product reviews.
    It creates the public product-image bucket and review table with RLS; only admins can upload or change products.
    If the API reports `product_reviews` is missing from the schema cache, rerun this migration and reload the page.
11. Run `supabase/11_customer_order_cancellation_review_names.sql` to add reviewer names and the pending-only
    cancellation policy. If this migration has not been applied, existing reviews still load with a generic
    "Customer" label; run it to show each reviewer's display name or Instagram username.
12. Run `supabase/12_fix_customer_order_cancellation.sql` to install the atomic cancellation function used by
    the customer orders page.
13. **Project Settings → API** → copy *Project URL* and *anon public* key into `assets/js/supabase-config.js`.

## 2. Static site connection (already wired in this zip)

Copy `assets/js/supabase-config.js` and `assets/js/db.js` into your project's `assets/js/`.
On each page, add before your page script (after `app.js`):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
<script src="assets/js/supabase-config.js"></script>
<script src="assets/js/db.js"></script>
```

`db.js` exposes `window.SSPH_DB`. Every function is async and returns `{ ok, data }` or `{ ok:false, error }`.

| Old (localStorage, app.js) | New (Supabase) |
|---|---|
| `registerUser()` / `socialAuth(…,'signup')` | `SSPH_DB.signUp(provider, id, password, {fullName, phone, address})` |
| `loginUser()` / `socialAuth(…,'login')` | `SSPH_DB.signIn(provider, id, password)` |
| `logoutUser()` | `SSPH_DB.signOut()` |
| `gate.js` redirect | keep it, and also call `SSPH_DB.requireSession()` on protected pages |
| `CATEGORIES` / `PRODUCTS` in data.js | `await SSPH_DB.loadCatalog()` — fills those same arrays in place, so render code is unchanged |
| `getCart/addToCart/updateCartQty/removeFromCart` | `cartList / cartAdd / cartUpdate(cartId, qty) / cartRemove(cartId)` |
| `saveOrder()` + `clearCart()` | `SSPH_DB.placeOrder({fullName,email,phone,address,paymentMethod})` → order id |
| `getOrders()` | `myOrders()` / `getOrder(id)` (includes line items) |
| PHP `admin/*.php` | `adminStats, adminListOrders, adminSetOrderStatus, adminListProducts, adminSaveProduct, adminDeleteProduct` |

Pages that render products/cart must wait for the data: `SSPH_DB.loadCatalog().then(() => { …render… })`.
Cart is keyed by `cartId` (not array index) now.

## 3. PHP version (the school/phpMyAdmin one)

`php-config/db.php` replaces `config/db.php` and connects over PDO to Supabase Postgres (values from
Dashboard → Connect → Session pooler; enable `pdo_pgsql` in php.ini). Secrets go in env vars / `.env.example`.
**That file only makes the connection.** The PHP pages still use MySQL-isms and the old `users` table
(`lastInsertId()`, `<=>`, `SHOW COLUMNS`, password hashes in PHP), so they need porting before they run on Postgres.
Also: if your rubric requires phpMyAdmin specifically, Supabase's Table Editor/SQL Editor replaces it.

## 4. Things you should know

- **Schema differences:** `users` → `profiles` (passwords now live in Supabase Auth); `colors` is a real array;
  `cart.color` is `''` instead of NULL; deleting a product keeps old orders (item rows keep name/price, `product_id` becomes NULL).
- **Seed data comes from `data.js`, not the old `.sql`**, because they had drifted apart: Slim Laptop Sleeve Bag is ₱799 (was ₱399),
  Kids Sling Bag has no colors (was Red/Blue/Green), and image filenames are the newer .png/.webp ones.
- **Security:** the anon key is public by design; Row Level Security is the real protection. Customers can only see their own
  cart/orders/profile; only admins can edit products or order status; nobody can set their own `role`; prices and stock are
  always taken from the database at checkout. Signed-out visitors can't read the catalog (matches your login gate).
  Never put the `service_role` key or DB password in browser code.
- **Facebook/Instagram are still a simulation** (as before): nobody verifies you own that Gmail/username, so someone could
  register a name first. Real login needs a Meta developer app.
- **Wrong password vs. no account:** Supabase deliberately returns one generic error for both, so the old separate messages
  ("No account found…" vs "Incorrect password") are combined.
- **Auth emails:** Facebook `a@gmail.com` → `a_at_gmail.com@facebook.local`, Instagram `x` → `x@instagram.local`. If Supabase ever rejects
  `.local`, change it in BOTH `public.auth_email_for()` (01_schema.sql) and `authEmailFor()` (db.js).
- Product photos still load from `assets/img/`; moving them to Supabase Storage is optional.
- The owner dashboard is at `owner.html` for accounts with the `admin` role. It shows sales totals and customer orders,
  supports fulfillment updates (Preparing, Packaging, Ready for pickup, and more), manages product inventory and images,
  displays customer reviews, and lets the owner save or download a payment QR code.
  Run `supabase/04_owner_dashboard.sql` on existing projects before using the dashboard.
- Customers can rate products from 1 to 5 stars and leave a comment on the product page. Each signed-in customer can submit
  one review per product; they can update their own review. Signed-in customers can see the latest 50 reviews for each
  product; the list updates through Supabase Realtime with a periodic refresh fallback. The dashboard lists submitted feedback.
  Run `supabase/10_inventory_reviews.sql` before using inventory image uploads or customer reviews. If the API reports
  that `product_reviews` is missing from its schema cache, rerun the migration and reload the page.
- Product color swatches use the built-in default colors in `assets/js/app.js`; owners only enter color names.
  If you previously added a `color_hexes` column to Supabase, it is unused and can be left in place.
- Admins can permanently delete orders from the owner dashboard after confirmation. Related order items are deleted too;
  inventory is not restored. Run `supabase/07_admin_delete_orders.sql` on existing projects to enable this feature.
  If the API reports a table permission error, apply `supabase/08_fix_admin_order_delete_permissions.sql`.
- Customers can cancel an order only while its status is `Pending`; the database rejects cancellations after an owner
  advances the status. Apply migrations 11 and 12 to enable it. Product reviews show the author's saved display name
  (or Instagram username) to signed-in shoppers and owners.
- Customers can track purchases from `orders.html`. The customer page subscribes only to that customer's order changes;
  the owner dashboard subscribes to order changes allowed by admin RLS. Both pages refresh from the database when an
  order is created or its status changes, and use periodic refreshes as a reconnect fallback. Apply `supabase/05_realtime_orders.sql`
  once to enable the `orders` table in the `supabase_realtime` publication.

## 5. Smoke test

Sign up (Email) → browse → add to cart → checkout → in the Table Editor, `orders` and `order_items` have rows and
`products.stock` dropped. Sign in as admin → `SSPH_DB.adminStats()` in the browser console returns four numbers.
Verify a customer can cancel a `Pending` order, but cannot cancel one after the owner advances its status. Submit a
product review and confirm its reviewer name appears on the product page and in the owner feedback panel.
