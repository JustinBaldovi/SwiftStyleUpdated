/* Swift Style PH — Static Data (mirrors database/swiftstyleph.sql seed data) */

const CATEGORIES = [
  { id: 1, name: 'Backpacks', slug: 'backpacks' },
  { id: 2, name: 'Tote Bags', slug: 'tote-bags' },
  { id: 3, name: 'Sling Bags', slug: 'sling-bags' },
  { id: 4, name: 'Laptop Bags', slug: 'laptop-bags' },
  { id: 5, name: 'Trolley Bags', slug: 'trolley-bags' }
];

const PRODUCTS = [
  // ---------------- MEN ----------------
  { id: 1, categoryId: 1, gender: 'Men', name: 'Everyday School Backpack',
    description: 'A durable, water-resistant school backpack with a padded laptop sleeve, multiple compartments, and ergonomic straps. Perfect for students carrying books, gadgets, and daily essentials.',
    price: 899.00, colors: ['Black','Navy','Maroon'], stock: 40, image: 'backpack1.jpg', featured: true, isNew: false },
  { id: 2, categoryId: 1, gender: 'Men', name: 'Classic Campus Backpack',
    description: 'Lightweight canvas backpack with a spacious main compartment and front pocket organizer, great for everyday campus use.',
    price: 749.00, colors: ['Gray','Olive','Black'], stock: 35, image: 'backpack2.jpg', featured: true, isNew: false },
  { id: 3, categoryId: 2, gender: 'Men', name: 'Canvas Tote Bag',
    description: 'A roomy, sturdy canvas tote bag great for grocery runs, books, or everyday carry. Reinforced handles for heavy loads.',
    price: 349.00, colors: ['Natural','Black','Red'], stock: 50, image: 'tote1.png', featured: true, isNew: false },
  { id: 4, categoryId: 3, gender: 'Men', name: 'Sling Crossbody Bag',
    description: 'Compact sling bag with adjustable strap, perfect for keeping your phone, wallet, and essentials close while on the go.',
    price: 449.00, colors: ['Black','Brown','Navy'], stock: 45, image: 'sling1.png', featured: true, isNew: false },
  { id: 5, categoryId: 4, gender: 'Men', name: 'Business Laptop Bag',
    description: 'Professional laptop bag with padded compartment fitting up to 15.6" laptops, plus organizer pockets for documents and accessories.',
    price: 1099.00, colors: ['Black','Dark Gray'], stock: 20, image: 'laptop1.jpg', featured: true, isNew: false },
  { id: 6, categoryId: 4, gender: 'Men', name: 'Slim Laptop Sleeve Bag',
    description: 'Slim, lightweight laptop bag with water-resistant exterior, ideal for work or school.',
    price: 799.00, colors: ['Black','Navy'], stock: 28, image: 'laptop2.jpg', featured: false, isNew: true },

  // ---------------- WOMEN ----------------
  { id: 7, categoryId: 1, gender: 'Women', name: 'Mini Backpack',
    description: 'A compact mini backpack ideal for light essentials, perfect for short trips or as a stylish everyday accessory.',
    price: 599.00, colors: ['Beige','Pink','Black'], stock: 25, image: 'backpack3.jpg', featured: false, isNew: true },
  { id: 8, categoryId: 2, gender: 'Women', name: 'Printed Canvas Tote',
    description: 'Trendy printed canvas tote bag with inner pocket, perfect for casual outings and shopping.',
    price: 399.00, colors: ['White','Beige'], stock: 30, image: 'tote2.jpg', featured: false, isNew: true },
  { id: 9, categoryId: 3, gender: 'Women', name: 'Small Organizer Pouch',
    description: 'A small zip pouch/organizer for cables, cosmetics, or accessories. Fits easily inside any bag.',
    price: 199.00, colors: ['Black','Gray','Pink'], stock: 60, image: 'pouch1.png', featured: false, isNew: false },
  { id: 10, categoryId: 4, gender: 'Women', name: "Women's Laptop Tote Bag",
    description: 'A sleek laptop tote that transitions from work to weekend, with a padded sleeve fitting up to 14-inch laptops and a spacious main compartment.',
    price: 1199.00, colors: ['Blush','Black','Taupe'], stock: 18, image: 'laptop3.png', featured: false, isNew: false },

  // ---------------- CHILDREN ----------------
  { id: 11, categoryId: 1, gender: 'Children', name: 'New Everyday School Backpack',
    description: "Our newest kids' school backpack style, featuring a bold structured silhouette, multiple zip compartments, and a sturdy carry handle on top. Comes with a matching keychain charm for a fun personal touch.",
    price: 949.00, colors: ['Maroon','Black'], stock: 30, image: 'backpack4.png', featured: false, isNew: true },
  { id: 12, categoryId: 2, gender: 'Children', name: 'Kids Tote Bag',
    description: 'A fun, lightweight tote sized just right for kids to carry books, snacks, and small toys.',
    price: 279.00, colors: ['Yellow','Sky Blue','Pink'], stock: 22, image: 'kids-tote.jpg', fit: 'contain', featured: false, isNew: false },
  { id: 13, categoryId: 3, gender: 'Children', name: 'Kids Sling Bag',
    description: 'A cute glossy pink quilted sling bag for kids, with a bow accent, top carry handle and an adjustable crossbody strap — just right for carrying their small essentials on school trips or outings.',
    price: 249.00, colors: [], stock: 24, image: 'kids-sling.webp', featured: false, isNew: false },
  { id: 14, categoryId: 5, gender: 'Children', name: 'Kids Trolley Bag',
    description: 'A rolling trolley bag sized for children, with a retractable handle and smooth wheels — easy for kids to pull on their own.',
    price: 1299.00, colors: ['Blue','Pink'], stock: 15, image: 'trolley1.png', featured: false, isNew: false }
];

/* Subcategories shown per gender in the Categories menu.
   Men & Women share the same four bag types; Children swaps
   Laptop Bags out for Trolley Bags. */
const SUBCATS_BY_GENDER = {
  men: [
    { name: 'Backpacks', slug: 'backpacks' },
    { name: 'Tote Bags', slug: 'tote-bags' },
    { name: 'Sling Bags', slug: 'sling-bags' },
    { name: 'Laptop Bags', slug: 'laptop-bags' }
  ],
  women: [
    { name: 'Backpacks', slug: 'backpacks' },
    { name: 'Tote Bags', slug: 'tote-bags' },
    { name: 'Sling Bags', slug: 'sling-bags' },
    { name: 'Laptop Bags', slug: 'laptop-bags' }
  ],
  children: [
    { name: 'Backpacks', slug: 'backpacks' },
    { name: 'Tote Bags', slug: 'tote-bags' },
    { name: 'Sling Bags', slug: 'sling-bags' },
    { name: 'Trolley Bags', slug: 'trolley-bags' }
  ]
};
