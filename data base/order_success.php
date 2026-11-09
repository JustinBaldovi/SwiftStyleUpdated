<?php
$pageTitle = 'Order Confirmed';
require_once __DIR__ . '/includes/header.php';
requireLogin();

$orderId = (int)($_GET['order_id'] ?? 0);

$stmt = $pdo->prepare("SELECT * FROM orders WHERE order_id = ? AND user_id = ?");
$stmt->execute([$orderId, currentUserId()]);
$order = $stmt->fetch();

if (!$order) {
    redirect('index.php');
}

$stmt = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
$stmt->execute([$orderId]);
$orderItems = $stmt->fetchAll();
?>

<section class="section container">
    <div style="text-align:center; margin-bottom:36px;">
        <h1 class="section-title">🎉 Thank You for Your Order!</h1>
        <p>Your order <strong>#<?php echo str_pad($order['order_id'], 6, '0', STR_PAD_LEFT); ?></strong> has been placed successfully.</p>
    </div>

    <div class="order-summary-box" style="max-width:600px; margin:0 auto;">
        <h2 style="font-size:1.2rem; margin-bottom:14px;">Order Details</h2>
        <?php foreach ($orderItems as $item): ?>
            <div class="line">
                <span><?php echo e($item['product_name']); ?> <?php echo $item['color'] ? '('.e($item['color']).')' : ''; ?> × <?php echo $item['quantity']; ?></span>
                <span><?php echo formatPrice($item['subtotal']); ?></span>
            </div>
        <?php endforeach; ?>
        <hr style="margin:14px 0; border-color:var(--border);">
        <div class="line"><span>Payment Method</span><span><?php echo e($order['payment_method']); ?></span></div>
        <div class="line"><span>Shipping Address</span><span style="text-align:right; max-width:60%;"><?php echo e($order['address']); ?></span></div>
        <div class="line total" style="font-weight:800; font-size:1.15rem; margin-top:10px;">
            <span>Total</span><span><?php echo formatPrice($order['total_amount']); ?></span>
        </div>
    </div>

    <div style="text-align:center; margin-top:30px;">
        <a href="shop.php" class="btn">Continue Shopping</a>
    </div>
</section>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
