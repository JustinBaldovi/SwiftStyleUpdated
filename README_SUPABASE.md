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
4. **Authentication → Users → Add user** → `admin@swiftstyleph.com` + a password, tick *Auto Confirm User*.
   Then run `supabase/03_make_admin.sql`.
5. **Project Settings → API** → copy *Project URL* and *anon public* key into `assets/js/supabase-config.js`.

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

## 5. Smoke test

Sign up (Email) → browse → add to cart → checkout → in the Table Editor, `orders` and `order_items` have rows and
`products.stock` dropped. Sign in as admin → `SSPH_DB.adminStats()` in the browser console returns four numbers.
