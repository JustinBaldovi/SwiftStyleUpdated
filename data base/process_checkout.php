<?php
require_once __DIR__ . '/includes/functions.php';
requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect('checkout.php');
}

$items = getCartItems();
if (empty($items)) {
    redirect('cart.php');
}

$fullName = trim($_POST['full_name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$address = trim($_POST['address'] ?? '');
$paymentMethod = $_POST['payment_method'] ?? 'COD';

$allowedPayments = ['COD', 'GCash', 'Credit/Debit Card', 'Bank Transfer'];
if (!in_array($paymentMethod, $allowedPayments, true)) {
    $paymentMethod = 'COD';
}

if ($fullName === '' || $email === '' || $phone === '' || $address === '') {
    flash('error', 'Please complete all shipping information fields.');
    redirect('checkout.php');
}

$total = getCartTotal($items);
$userId = currentUserId();

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        "INSERT INTO orders (user_id, full_name, email, phone, address, payment_method, total_amount, order_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')"
    );
    $stmt->execute([$userId, $fullName, $email, $phone, $address, $paymentMethod, $total]);
    $orderId = $pdo->lastInsertId();

    $itemStmt = $pdo->prepare(
        "INSERT INTO order_items (order_id, product_id, product_name, color, quantity, price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stockStmt = $pdo->prepare("UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE product_id = ?");

    foreach ($items as $item) {
        $subtotal = $item['price'] * $item['quantity'];
        $itemStmt->execute([
            $orderId,
            $item['product_id'],
            $item['product_name'],
            $item['color'],
            $item['quantity'],
            $item['price'],
            $subtotal
        ]);
        $stockStmt->execute([$item['quantity'], $item['product_id']]);
    }

    // Clear the user's cart
    $clearStmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ?");
    $clearStmt->execute([$userId]);

    $pdo->commit();

    redirect('order_success.php?order_id=' . $orderId);

} catch (Exception $e) {
    $pdo->rollBack();
    flash('error', 'There was a problem placing your order. Please try again.');
    redirect('checkout.php');
}
