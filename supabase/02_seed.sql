-- =====================================================================
-- Swift Style PH - seed data                                [run 2 of 3]
-- Generated from assets/js/data.js (the newest catalog: current photos/prices).
-- Safe to re-run: existing rows are left alone.
-- =====================================================================

insert into public.categories (category_id, category_name, slug) values
  (1, $$Backpacks$$, $$backpacks$$),
  (2, $$Tote Bags$$, $$tote-bags$$),
  (3, $$Sling Bags$$, $$sling-bags$$),
  (4, $$Laptop Bags$$, $$laptop-bags$$),
  (5, $$Trolley Bags$$, $$trolley-bags$$)
on conflict (category_id) do nothing;

insert into public.products
  (product_id, category_id, gender, product_name, description, price, colors, stock, image, image_fit, is_featured, is_new)
values
  (1, 1, 'Men', $$Everyday School Backpack$$, $$A durable, water-resistant school backpack with a padded laptop sleeve, multiple compartments, and ergonomic straps. Perfect for students carrying books, gadgets, and daily essentials.$$, 899.00, array['Black','Navy','Maroon']::text[], 40, 'backpack1.jpg', 'cover', true, false),
  (2, 1, 'Men', $$Classic Campus Backpack$$, $$Lightweight canvas backpack with a spacious main compartment and front pocket organizer, great for everyday campus use.$$, 749.00, array['Gray','Olive','Black']::text[], 35, 'backpack2.jpg', 'cover', true, false),
  (3, 2, 'Men', $$Canvas Tote Bag$$, $$A roomy, sturdy canvas tote bag great for grocery runs, books, or everyday carry. Reinforced handles for heavy loads.$$, 349.00, array['Natural','Black','Red']::text[], 50, 'tote1.png', 'cover', true, false),
  (4, 3, 'Men', $$Sling Crossbody Bag$$, $$Compact sling bag with adjustable strap, perfect for keeping your phone, wallet, and essentials close while on the go.$$, 449.00, array['Black','Brown','Navy']::text[], 45, 'sling1.png', 'cover', true, false),
  (5, 4, 'Men', $$Business Laptop Bag$$, $$Professional laptop bag with padded compartment fitting up to 15.6" laptops, plus organizer pockets for documents and accessories.$$, 1099.00, array['Black','Dark Gray']::text[], 20, 'laptop1.jpg', 'cover', true, false),
  (6, 4, 'Men', $$Slim Laptop Sleeve Bag$$, $$Slim, lightweight laptop bag with water-resistant exterior, ideal for work or school.$$, 799.00, array['Black','Navy']::text[], 28, 'laptop2.jpg', 'cover', false, true),
  (7, 1, 'Women', $$Mini Backpack$$, $$A compact mini backpack ideal for light essentials, perfect for short trips or as a stylish everyday accessory.$$, 599.00, array['Beige','Pink','Black']::text[], 25, 'backpack3.jpg', 'cover', false, true),
  (8, 2, 'Women', $$Printed Canvas Tote$$, $$Trendy printed canvas tote bag with inner pocket, perfect for casual outings and shopping.$$, 399.00, array['White','Beige']::text[], 30, 'tote2.jpg', 'cover', false, true),
  (9, 3, 'Women', $$Small Organizer Pouch$$, $$A small zip pouch/organizer for cables, cosmetics, or accessories. Fits easily inside any bag.$$, 199.00, array['Black','Gray','Pink']::text[], 60, 'pouch1.png', 'cover', false, false),
  (10, 4, 'Women', $$Women's Laptop Tote Bag$$, $$A sleek laptop tote that transitions from work to weekend, with a padded sleeve fitting up to 14-inch laptops and a spacious main compartment.$$, 1199.00, array['Blush','Black','Taupe']::text[], 18, 'laptop3.png', 'cover', false, false),
  (11, 1, 'Children', $$New Everyday School Backpack$$, $$Our newest kids' school backpack style, featuring a bold structured silhouette, multiple zip compartments, and a sturdy carry handle on top. Comes with a matching keychain charm for a fun personal touch.$$, 949.00, array['Maroon','Black']::text[], 30, 'backpack4.png', 'cover', false, true),
  (12, 2, 'Children', $$Kids Tote Bag$$, $$A fun, lightweight tote sized just right for kids to carry books, snacks, and small toys.$$, 279.00, array['Yellow','Sky Blue','Pink']::text[], 22, 'kids-tote.jpg', 'contain', false, false),
  (13, 3, 'Children', $$Kids Sling Bag$$, $$A cute glossy pink quilted sling bag for kids, with a bow accent, top carry handle and an adjustable crossbody strap — just right for carrying their small essentials on school trips or outings.$$, 249.00, '{}'::text[], 24, 'kids-sling.webp', 'cover', false, false),
  (14, 5, 'Children', $$Kids Trolley Bag$$, $$A rolling trolley bag sized for children, with a retractable handle and smooth wheels — easy for kids to pull on their own.$$, 1299.00, array['Blue','Pink']::text[], 15, 'trolley1.png', 'cover', false, false)
on conflict (product_id) do nothing;

-- Identity columns do not advance when ids are inserted by hand; sync them
-- so the next product added from the admin panel gets a fresh id.
select setval(pg_get_serial_sequence('public.categories', 'category_id'), (select max(category_id) from public.categories));
select setval(pg_get_serial_sequence('public.products',   'product_id'),  (select max(product_id)  from public.products));
