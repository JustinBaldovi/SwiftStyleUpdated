> **Now runs on Supabase.** Accounts, products, cart and orders live in your Supabase project (see README_SUPABASE.md). The site needs internet and must be opened from the files with a Supabase project configured in assets/js/supabase-config.js. The localStorage notes below describe the older offline version.

# Swift Style PH — Static Demo Version (No Server Needed)

This is a **plain HTML/CSS/JavaScript** version of the Swift Style PH website.
Unlike the full PHP + MySQL version, this one needs **no installation at all** —
just open `index.html` in your browser and everything works: browsing bags,
signing up/in, adding to cart, and checking out with a payment method.

## How to open it

1. Extract this zip anywhere on your computer.
2. Double-click `index.html`.
3. That's it — your browser opens the homepage and the whole site is
   click-through functional from there (Shop, Categories, Product pages,
   Cart, Checkout, Sign Up/In, About, Contact).

You can also right-click `index.html` → **Open With** → your browser of choice.

## What actually works here

- Browsing featured/new bags on the homepage, the shop page, and category pages
- Product pages with color selection and **working Add to Cart**
- A real cart page — update quantity, remove items, see the total
- **Sign Up / Sign In / Log Out** (accounts are saved in your browser's
  local storage — this is a front-end demo, not a real user database)
- **Checkout with payment method selection** (COD, GCash, Card, Bank Transfer)
  that creates an order and shows an order confirmation page
- A working Contact form (shows a confirmation message)

## Login Required (New)

The whole site is now locked behind a login. Visitors who are not signed in
are sent to `login.html` and cannot see the homepage, shop, cart, etc. until
they sign in or sign up. They can use:

- **Email + password** (Sign Up / Sign In)
- **Continue with Facebook** and **Continue with Instagram**

**Sign Up vs Log In**

- **Sign Up** creates an account only once. If the account already exists you are told to Log In instead.
- **Log In** only works for an account that was already signed up in this browser, otherwise you are told to Sign Up first.
- Each login type uses its own format: **Email** = email + password, **Facebook** = Gmail address (`name@gmail.com`) + password, **Instagram** = username (letters, numbers, `.` and `_`, max 30; `@` optional) + password. Passwords are at least 6 characters; Sign Up asks to confirm it.
- The three types are separate accounts, so the same Gmail can be used for an Email account and a Facebook account without clashing.

**Facebook / Instagram are a demo simulation.** A real "Login with Facebook"
needs a Meta developer app (App ID/secret) and a server, and Instagram does not
offer a normal consumer login API. Here the button asks for the Gmail / username
and signs that person in locally (with the password they set) (`socialAuth()` in `assets/js/app.js`).
The PHP version equivalent is `data base/social_login.php` (not changed).

The static gate is `assets/js/gate.js` (front-end only, so it is a convenience
lock, not real security). The PHP version enforces the lock on the server in
`data base/includes/functions.php` (`enforceLoginGate()`).

## Product color swatches

Product color dots use the built-in default color palette in `COLOR_HEX` in
`assets/js/app.js`. Owners enter color names in inventory; no per-product hex
values or color-specific photos are required. If a custom color name is added,
add its swatch to `COLOR_HEX`; unknown names use a neutral gray swatch.

## What's New (Earlier Update)

- Warm brown → gold color theme, matching the PHP version
- Real product photos throughout (no more placeholder icons except for
  the few items noted below that don't have photos yet)
- Faint background photo on the homepage hero and About Us title area
- Hovering Home / Shop / About Us / Contact Us now shows a soft white
  bubble highlight
- Sort dropdown re-arranges products immediately (no extra click)
- **Genuinely separate Men / Women / Children catalogs** — picking a
  gender in the Categories menu now shows that gender's own products,
  not the same list for everyone. Children's menu shows Trolley Bags
  instead of Laptop Bags, including a "Kids Trolley Bag" placeholder item.
- Contact Us now shows Davao City, Philippines

Note: the Kids Tote Bag now has its own photo (shown whole, not cropped).
Every other bag now uses a background-removed PNG on a square canvas, shown on a white
frame so all product cards line up the same way.

## Important — how this is different from your real project

This static version uses your browser's **localStorage** to fake a cart,
accounts, and orders, so it can run with zero setup. It is meant as a
**quick, always-working preview** of your site's design and flow.

**Your actual school project still needs the PHP + MySQL/phpMyAdmin version**
(the other zip, `swiftstyleph.zip`, with the `.php` files and
`database/swiftstyleph.sql`), since your rubric requires a real database
managed through phpMyAdmin. Run that version through XAMPP for your actual
submission — use this static version only to preview the look and feel or to
show someone the site quickly without installing anything.

## Files in this zip

- `index.html`, `shop.html`, `category.html`, `product.html` — browsing pages
- `cart.html`, `checkout.html`, `order-success.html` — cart & checkout flow
- `login.html`, `register.html` — account pages (demo only)
- `about.html`, `contact.html` — info pages
- `assets/css/style.css` — styling (same look as the PHP version)
- `assets/js/data.js` — the 9 sample bags & 4 categories (same as the database seed)
- `assets/js/app.js` — all the cart/login/rendering logic

- The **Kids Sling Bag** (`kids-sling.webp`) is a single-photo product: no color options, so no variant images are needed for it.
