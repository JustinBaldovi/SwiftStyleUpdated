<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/../config/db.php';

/* ---------------------------------------------------------
 * AUTH HELPERS
 * --------------------------------------------------------- */
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function isAdmin() {
    return isLoggedIn() && $_SESSION['role'] === 'admin';
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: login.php?redirect=' . urlencode($_SERVER['REQUEST_URI']));
        exit;
    }
}

/* Only allow redirects back to a path on this same site (blocks open redirects). */
function safeRedirectTarget($target) {
    $target = (string)$target;
    if ($target !== '' && $target[0] === '/' && strpos($target, '//') !== 0 && strpos($target, '\\') === false) {
        return $target;
    }
    if (preg_match('/^[A-Za-z0-9_\-]+\.php(\?[^\s]*)?$/', $target)) {
        return $target;
    }
    return 'index.php';
}

/* LOGIN GATE: every page except the ones listed below needs a signed-in user. */
function enforceLoginGate() {
    $public = ['login.php', 'register.php', 'social_login.php', 'logout.php'];
    $script = basename($_SERVER['SCRIPT_NAME']);
    if (isLoggedIn() || in_array($script, $public, true)) {
        return;
    }
    $prefix = basename(dirname($_SERVER['SCRIPT_NAME'])) === 'admin' ? '../' : '';
    header('Location: ' . $prefix . 'login.php?redirect=' . urlencode($_SERVER['REQUEST_URI']));
    exit;
}

function currentUserId() {
    return $_SESSION['user_id'] ?? null;
}

/* ---------------------------------------------------------
 * GENERAL HELPERS
 * --------------------------------------------------------- */
function e($string) {
    return htmlspecialchars($string ?? '', ENT_QUOTES, 'UTF-8');
}

function formatPrice($amount) {
    return '₱' . number_format((float)$amount, 2);
}

function redirect($url) {
    header("Location: $url");
    exit;
}

function flash($key, $message = null) {
    if ($message !== null) {
        $_SESSION['flash'][$key] = $message;
        return;
    }
    if (!empty($_SESSION['flash'][$key])) {
        $msg = $_SESSION['flash'][$key];
        unset($_SESSION['flash'][$key]);
        return $msg;
    }
    return null;
}

/* ---------------------------------------------------------
 * CART HELPERS (DB-backed cart, tied to logged-in user)
 * --------------------------------------------------------- */
function getCartCount() {
    global $pdo;
    if (!isLoggedIn()) return 0;
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(quantity),0) AS total FROM cart WHERE user_id = ?");
    $stmt->execute([currentUserId()]);
    return (int)$stmt->fetch()['total'];
}

function getCartItems() {
    global $pdo;
    if (!isLoggedIn()) return [];
    $stmt = $pdo->prepare(
        "SELECT c.cart_id, c.product_id, c.color, c.quantity,
                p.product_name, p.price, p.image, p.stock
         FROM cart c
         JOIN products p ON p.product_id = c.product_id
         WHERE c.user_id = ?
         ORDER BY c.added_at DESC"
    );
    $stmt->execute([currentUserId()]);
    return $stmt->fetchAll();
}

function getCartTotal($items = null) {
    if ($items === null) {
        $items = getCartItems();
    }
    $total = 0;
    foreach ($items as $item) {
        $total += $item['price'] * $item['quantity'];
    }
    return $total;
}

/* ---------------------------------------------------------
 * PRODUCT / CATEGORY HELPERS
 * --------------------------------------------------------- */
function getAllCategories() {
    global $pdo;
    return $pdo->query("SELECT * FROM categories ORDER BY category_name")->fetchAll();
}

function getCategoryBySlug($slug) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM categories WHERE slug = ?");
    $stmt->execute([$slug]);
    return $stmt->fetch();
}

/**
 * Validates a gender value coming from the URL (e.g. ?gender=men)
 * and returns the properly-cased value used in the database, or null.
 */
function validGender($genderParam) {
    $map = ['men' => 'Men', 'women' => 'Women', 'children' => 'Children'];
    $key = strtolower((string)$genderParam);
    return $map[$key] ?? null;
}

/**
 * Returns the list of subcategories shown for a given gender.
 * Men and Women share the same four bag types; Children swaps
 * Laptop Bags out for Trolley Bags.
 */
function getSubcategoriesForGender($gender) {
    $common = [
        ['name' => 'Backpacks', 'slug' => 'backpacks'],
        ['name' => 'Tote Bags', 'slug' => 'tote-bags'],
        ['name' => 'Sling Bags', 'slug' => 'sling-bags'],
    ];
    if ($gender === 'Children') {
        $common[] = ['name' => 'Trolley Bags', 'slug' => 'trolley-bags'];
    } else {
        $common[] = ['name' => 'Laptop Bags', 'slug' => 'laptop-bags'];
    }
    return $common;
}

function getProduct($id) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM products WHERE product_id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

/* Photos listed here are shown whole (object-fit: contain) instead of cropped to a square. */
function productImgClass($image) {
    return in_array($image, ['kids-tote.jpg'], true) ? ' class="fit-contain"' : '';
}

function productImageUrl($image) {
    $path = __DIR__ . '/../assets/img/' . $image;
    if ($image && file_exists($path)) {
        return 'assets/img/' . $image;
    }
    return 'assets/img/placeholder.svg';
}

enforceLoginGate();
