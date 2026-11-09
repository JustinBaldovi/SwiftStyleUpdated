<?php
require_once __DIR__ . '/includes/functions.php';
requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect('cart.php');
}

$action = $_POST['action'] ?? '';
$userId = currentUserId();

if ($action === 'add') {
    $productId = (int)($_POST['product_id'] ?? 0);
    $color = trim($_POST['color'] ?? '');
    $quantity = max(1, (int)($_POST['quantity'] ?? 1));

    $product = getProduct($productId);
    if (!$product) {
        flash('error', 'Product not found.');
        redirect('shop.php');
    }

    $quantity = min($quantity, (int)$product['stock']);

    // Check if this product+color already in cart -> update quantity instead of duplicate row
    $stmt = $pdo->prepare("SELECT cart_id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND color <=> ?");
    $stmt->execute([$userId, $productId, $color !== '' ? $color : null]);
    $existing = $stmt->fetch();

    if ($existing) {
        $newQty = min($existing['quantity'] + $quantity, (int)$product['stock']);
        $upd = $pdo->prepare("UPDATE cart SET quantity = ? WHERE cart_id = ?");
        $upd->execute([$newQty, $existing['cart_id']]);
    } else {
        $ins = $pdo->prepare("INSERT INTO cart (user_id, product_id, color, quantity) VALUES (?, ?, ?, ?)");
        $ins->execute([$userId, $productId, $color !== '' ? $color : null, $quantity]);
    }

    flash('success', $product['product_name'] . ' added to your cart.');
    redirect('cart.php');

} elseif ($action === 'update') {
    $cartId = (int)($_POST['cart_id'] ?? 0);
    $quantity = max(1, (int)($_POST['quantity'] ?? 1));

    $stmt = $pdo->prepare(
        "SELECT c.cart_id, p.stock FROM cart c JOIN products p ON p.product_id = c.product_id
         WHERE c.cart_id = ? AND c.user_id = ?"
    );
    $stmt->execute([$cartId, $userId]);
    $row = $stmt->fetch();

    if ($row) {
        $quantity = min($quantity, (int)$row['stock']);
        $upd = $pdo->prepare("UPDATE cart SET quantity = ? WHERE cart_id = ?");
        $upd->execute([$quantity, $cartId]);
        flash('success', 'Cart updated.');
    }
    redirect('cart.php');

} elseif ($action === 'remove') {
    $cartId = (int)($_POST['cart_id'] ?? 0);
    $del = $pdo->prepare("DELETE FROM cart WHERE cart_id = ? AND user_id = ?");
    $del->execute([$cartId, $userId]);
    flash('success', 'Item removed from cart.');
    redirect('cart.php');
}

redirect('cart.php');
