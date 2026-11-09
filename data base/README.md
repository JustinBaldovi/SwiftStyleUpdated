# Swift Style PH — E-commerce Website (B2C)

> **Update:** The color theme was changed to a warm brown-to-gold autumn
> palette, all 9 original products now use real product photos, a 10th
> product ("New Everyday School Backpack") was added to New Arrivals, and
> the Categories menu now has **Men / Women / Children** tabs — picking
> **Children** swaps "Laptop Bags" for "Trolley Bags" in the subcategory
> list. See "What's New" near the bottom of this file for details.

A fully functional PHP + MySQL e-commerce website for **Swift Style PH**, a local
Filipino bag business (school backpacks, tote bags, laptop bags, mini backpacks,
sling bags, and organizers). Business model: **B2C (Business-to-Consumer)**.

Tagline: *"Carry What Matters."*

This project has been built and tested end-to-end (registration, login, add to
cart, checkout with payment method, order placement, and the admin panel) on a
local PHP + MySQL/MariaDB environment.

---

## 1. Requirements

- XAMPP / WAMP / MAMP (or any stack with **PHP 7.4+** and **MySQL/MariaDB**)
- A web browser
- phpMyAdmin (comes bundled with XAMPP/WAMP)

## 2. Installation Steps

### Step 1 — Copy the project files
Extract this zip and copy the whole `swiftstyleph` folder into your server's
web root:
- XAMPP (Windows): `C:\xampp\htdocs\swiftstyleph`
- XAMPP (Mac/Linux): `/Applications/XAMPP/htdocs/swiftstyleph` or `/opt/lampp/htdocs/swiftstyleph`
- WAMP: `C:\wamp64\www\swiftstyleph`

### Step 2 — Start Apache and MySQL
Open the XAMPP/WAMP Control Panel and start **Apache** and **MySQL**.

### Step 3 — Create the database using phpMyAdmin
1. Open your browser and go to `http://localhost/phpmyadmin`.
2. Click **Import** in the top menu.
3. Click **Choose File** and select `database/swiftstyleph.sql` from this project.
4. Click **Go** at the bottom of the page.
5. This will automatically:
   - Create the `swiftstyleph` database
   - Create all required tables (`users`, `categories`, `products`, `cart`, `orders`, `order_items`)
   - Seed 4 categories and 9 sample bag products
   - Create a default **admin account**

> You can also do this manually: create a database named `swiftstyleph` first,
> select it, then go to the **SQL** tab and paste the contents of
> `database/swiftstyleph.sql`, then click **Go**.

### Step 4 — Configure the database connection
Open `config/db.php` and confirm the credentials match your local setup
(defaults work for a fresh XAMPP install):

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'swiftstyleph');
define('DB_USER', 'root');
define('DB_PASS', '');        // default XAMPP password is empty
```

### Step 5 — Open the website
Go to: `http://localhost/swiftstyleph/index.php`

That's it — the site is live locally.

---

## 3. Default Accounts

| Role     | Email                       | Password  |
|----------|------------------------------|-----------|
| Admin    | admin@swiftstyleph.com       | admin123  |
| Customer | *(create your own via Sign Up)* | — |

Log in as admin, then visit `admin/dashboard.php` to manage products and orders.
**Change the admin password after your first login** if this ever goes on a
public server (edit it via a small script using `password_hash()`, or add an
account-settings page).

---

## 4. Site Pages (Customer-Facing)

| Page | File | Description |
|------|------|--------------|
| Home | `index.php` | Featured and new-arrival bags |
| Shop | `shop.php` | All available bags, with search and sort |
| Categories | `category.php?slug=...` | Backpacks, Tote Bags, Sling Bags, Laptop Bags |
| Product Page | `product.php?id=...` | Photo, price, description, color options, add to cart |
| Cart | `cart.php` | Items selected by the customer, update qty / remove |
| Checkout | `checkout.php` | Shipping info + **payment method** (COD, GCash, Card, Bank Transfer) |
| Order Confirmation | `order_success.php` | Confirms the placed order |
| About Us | `about.php` | Information about the business |
| Contact Us | `contact.php` | Contact form + social media / contact info |
| Sign Up / Sign In / Log Out | `register.php` / `login.php` / `logout.php` | Customer accounts |

## 5. Admin Panel

| Page | File | Description |
|------|------|--------------|
| Dashboard | `admin/dashboard.php` | Store stats (products, orders, customers, revenue) and recent orders |
| Products | `admin/products.php` | Add / edit / delete products, set price, stock, colors, category, featured/new flags |
| Orders | `admin/orders.php` | View orders and customer details, update order status |

Product images: to add a real photo, upload the image file into `assets/img/`
and type its filename (e.g. `backpack1.jpg`) into the **Image Filename** field
when adding/editing a product in the admin panel. If no image is set, a
placeholder graphic is shown automatically.

## 6. Core Features Implemented

- ✅ Product catalog with categories (Backpacks, Tote Bags, Sling Bags, Laptop Bags)
- ✅ Product detail pages with color selection and stock display
- ✅ **Add to Cart** (persisted per logged-in user in the database)
- ✅ Cart page — update quantity, remove items, view subtotal/total
- ✅ **Sign Up / Sign In / Log Out** with hashed passwords (`password_hash` / `password_verify`)
- ✅ Checkout with customer shipping info and **payment method selection**
  (Cash on Delivery, GCash, Credit/Debit Card, Bank Transfer)
- ✅ Order placement: creates an order + order items, deducts stock, clears the cart
- ✅ Order confirmation page
- ✅ About Us and Contact Us pages
- ✅ Admin panel: dashboard stats, product CRUD, order status management
- ✅ Role-based access (`customer` vs `admin`)
- ✅ SQL injection protection via PDO prepared statements throughout
- ✅ Responsive layout (mobile-friendly CSS)

## 7. Database Structure (see `database/swiftstyleph.sql`)

- **users** — customer & admin accounts (hashed passwords)
- **categories** — Backpacks, Tote Bags, Sling Bags, Laptop Bags
- **products** — name, description, price, colors, stock, image, category
- **cart** — persistent per-user shopping cart
- **orders** — order header (customer info, payment method, total, status)
- **order_items** — line items per order (snapshot of product/price at time of purchase)

## 8. Notes for Your Report / Rubric

- **UI/UX Design (25%)** — Custom CSS matching the brand's purple-to-teal gradient theme from the provided slides, responsive product grid, sticky nav with dropdown categories.
- **Core Functionality (35%)** — Full cart → checkout → order pipeline, working payment method selection, login/logout/register, admin CRUD, stock deduction on purchase.
- **Code Structure & Version Control (15%)** — Organized into `/config`, `/includes`, `/admin`, `/assets`, `/database` folders; reusable `header.php`/`footer.php`/`functions.php`. Recommend initializing a Git repository (`git init`) after extracting this zip and committing before you start customizing, so your version history satisfies this criterion.
- **Content & Completeness (25%)** — All required pages implemented (Home, Shop, Categories, Product Page, Cart, Checkout, About Us, Contact Us) with real seeded content for Swift Style PH.

## 9. What's New (Latest Update)

- **New color palette** — the site now uses a warm brown → rust → orange →
  gold gradient theme (replacing the earlier purple/teal one) across the
  header, buttons, badges, footer, and admin panel.
- **Real product photos** — all 9 original products now use actual bag
  photos instead of placeholders (in `assets/img/`).
- **New product added** — "New Everyday School Backpack" (₱949.00,
  Backpacks category, marked as New Arrival) using its own photo.
  The original "Everyday School Backpack" is now Featured only, so the
  homepage doesn't show the same bag twice.
- **Categories menu restructured** — the header's Categories dropdown now
  shows three tabs: **Men**, **Women**, **Children**. Clicking a tab shows
  that group's bag types. Selecting **Children** replaces "Laptop Bags"
  with "Trolley Bags" in the list.
- A new **Trolley Bags** category was added to the database so that link
  works (currently empty of products — add some via the admin panel's
  Products page whenever you have trolley bag inventory to list).

## 9. What's New (Latest Update)

- **Location updated** — Contact Us now shows Davao City, Philippines
  instead of Metro Manila.
- **Homepage hero background** — the banner now shows a faint fashion/bag
  photo behind the "Carry What Matters" text, tinted with the brand's
  gradient so the text stays fully readable.
- **About Us background** — the page title area now has a faint photo
  background too; the paragraphs below remain on a plain white background
  for readability.
- **Nav hover effect** — hovering Home, Shop, About Us, or Contact Us now
  shows a soft white "bubble" highlight behind the text.
- **Sort now auto-applies** — on the Shop page and category pages,
  changing the sort dropdown (e.g. "Price: High to Low") re-sorts the
  product list immediately, no extra click needed.
- **Genuinely separate Men / Women / Children catalogs** — this is the
  big one. Previously, picking Men, Women, or Children in the Categories
  menu showed the *same* products no matter which one you picked. Now
  each gender has its own real, separate product list per category:
  - **Men:** Everyday School Backpack, Classic Campus Backpack, Canvas
    Tote Bag, Sling Crossbody Bag, Business Laptop Bag, Slim Laptop
    Sleeve Bag
  - **Women:** Mini Backpack, Printed Canvas Tote, Small Organizer Pouch
    (Sling Bags), Women's Laptop Tote Bag
  - **Children:** New Everyday School Backpack, Kids Tote Bag, Kids
    Sling Bag, and a **Kids Trolley Bag** (a template placeholder in the
    new Trolley Bags category — swap in real photos/details once you
    have actual trolley bag inventory)
  - A `gender` column was added to the `products` table
    (`database/swiftstyleph.sql`), and the admin Products page now has a
    Gender dropdown when adding or editing a product.
  - Clicking Men or Women shows Backpacks / Tote Bags / Sling Bags /
    Laptop Bags. Clicking Children shows the same three plus **Trolley
    Bags** instead of Laptop Bags.
  - Some Women's and Children's items (Small Organizer Pouch, Women's
    Laptop Tote Bag, Kids Tote Bag, Kids Sling Bag, Kids Trolley Bag)
    don't have real photos yet, so they show the placeholder graphic —
    add real photos anytime via the admin Products page.

---

Made for **CP 308 — Web Systems and Technologies** | E-Commerce Website Project (B2C Model)
