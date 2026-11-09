-- =========================================================
-- Swift Style PH - E-commerce Database (B2C)
-- Import this file using phpMyAdmin (Import tab)
-- =========================================================

CREATE DATABASE IF NOT EXISTS swiftstyleph CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE swiftstyleph;

-- ---------------------------------------------------------
-- Table: users  (customers + admin)
-- ---------------------------------------------------------
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(30) DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
    provider VARCHAR(20) NOT NULL DEFAULT 'email',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table: categories
-- ---------------------------------------------------------
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table: products
-- ---------------------------------------------------------
CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    gender ENUM('Men','Women','Children') NOT NULL DEFAULT 'Men',
    product_name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    colors VARCHAR(255) DEFAULT NULL,     -- comma separated e.g. Black,Navy,Beige
    stock INT NOT NULL DEFAULT 0,
    image VARCHAR(255) DEFAULT NULL,      -- filename inside assets/img
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    is_new TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table: cart  (persistent cart per logged-in user)
-- ---------------------------------------------------------
CREATE TABLE cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    color VARCHAR(50) DEFAULT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table: orders
-- ---------------------------------------------------------
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address VARCHAR(255) NOT NULL,
    payment_method ENUM('COD','GCash','Credit/Debit Card','Bank Transfer') NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    order_status ENUM('Pending','Processing','Shipped','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table: order_items
-- ---------------------------------------------------------
CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    color VARCHAR(50) DEFAULT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
) ENGINE=InnoDB;

-- =========================================================
-- SEED DATA
-- =========================================================

INSERT INTO categories (category_name, slug) VALUES
('Backpacks', 'backpacks'),
('Tote Bags', 'tote-bags'),
('Sling Bags', 'sling-bags'),
('Laptop Bags', 'laptop-bags'),
('Trolley Bags', 'trolley-bags');

-- Default admin account -> email: admin@swiftstyleph.com / password: admin123
-- Password hash generated with PHP password_hash('admin123', PASSWORD_DEFAULT) and verified working.
INSERT INTO users (full_name, email, password, role) VALUES
('Swift Style Admin', 'admin@swiftstyleph.com', '$2y$10$IiEImwUeoR4iQY.BfhU79.jpGMfCM7CgL0pXmw3iGXsIraAnbBV7K', 'admin');
-- NOTE: the hash above corresponds to "admin123". You can change it after logging in.

INSERT INTO products (category_id, gender, product_name, description, price, colors, stock, image, is_featured, is_new) VALUES
-- MEN
(1, 'Men', 'Everyday School Backpack', 'A durable, water-resistant school backpack with a padded laptop sleeve, multiple compartments, and ergonomic straps. Perfect for students carrying books, gadgets, and daily essentials.', 899.00, 'Black,Navy,Maroon', 40, 'backpack1.jpg', 1, 0),
(1, 'Men', 'Classic Campus Backpack', 'Lightweight canvas backpack with a spacious main compartment and front pocket organizer, great for everyday campus use.', 749.00, 'Gray,Olive,Black', 35, 'backpack2.jpg', 1, 0),
(2, 'Men', 'Canvas Tote Bag', 'A roomy, sturdy canvas tote bag great for grocery runs, books, or everyday carry. Reinforced handles for heavy loads.', 349.00, 'Natural,Black,Red', 50, 'tote1.jpg', 1, 0),
(3, 'Men', 'Sling Crossbody Bag', 'Compact sling bag with adjustable strap, perfect for keeping your phone, wallet, and essentials close while on the go.', 449.00, 'Black,Brown,Navy', 45, 'sling1.jpg', 1, 0),
(4, 'Men', 'Business Laptop Bag', 'Professional laptop bag with padded compartment fitting up to 15.6" laptops, plus organizer pockets for documents and accessories.', 1099.00, 'Black,Dark Gray', 20, 'laptop1.jpg', 1, 0),
(4, 'Men', 'Slim Laptop Sleeve Bag', 'Slim, lightweight laptop bag with water-resistant exterior, ideal for work or school.', 399.00, 'Black,Navy', 28, 'laptop2.jpg', 0, 1),

-- WOMEN
(1, 'Women', 'Mini Backpack', 'A compact mini backpack ideal for light essentials, perfect for short trips or as a stylish everyday accessory.', 599.00, 'Beige,Pink,Black', 25, 'backpack3.jpg', 0, 1),
(2, 'Women', 'Printed Canvas Tote', 'Trendy printed canvas tote bag with inner pocket, perfect for casual outings and shopping.', 399.00, 'White,Beige', 30, 'tote2.jpg', 0, 1),
(3, 'Women', 'Small Organizer Pouch', 'A small zip pouch/organizer for cables, cosmetics, or accessories. Fits easily inside any bag.', 199.00, 'Black,Gray,Pink', 60, 'sling2.jpg', 0, 0),
(4, 'Women', 'Women''s Laptop Tote Bag', 'A sleek laptop tote that transitions from work to weekend, with a padded sleeve fitting up to 14-inch laptops and a spacious main compartment.', 1199.00, 'Blush,Black,Taupe', 18, NULL, 0, 0),

-- CHILDREN
(1, 'Children', 'New Everyday School Backpack', 'Our newest kids'' school backpack style, featuring a bold structured silhouette, multiple zip compartments, and a sturdy carry handle on top. Comes with a matching keychain charm for a fun personal touch.', 949.00, 'Maroon,Black', 30, 'backpack4.jpg', 0, 1),
(2, 'Children', 'Kids Tote Bag', 'A fun, lightweight tote sized just right for kids to carry books, snacks, and small toys.', 279.00, 'Yellow,Sky Blue,Pink', 22, 'kids-tote.jpg', 0, 0),
(3, 'Children', 'Kids Sling Bag', 'A small, adjustable sling bag for kids to carry their essentials hands-free on school trips or outings.', 249.00, 'Red,Blue,Green', 24, NULL, 0, 0),
(5, 'Children', 'Kids Trolley Bag', 'A rolling trolley bag sized for children, with a retractable handle and smooth wheels — easy for kids to pull on their own. (Template placeholder — swap in real product photos and details once available.)', 1299.00, 'Blue,Pink', 15, NULL, 0, 0);
