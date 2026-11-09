<?php
$pageTitle = 'Checkout';
require_once __DIR__ . '/includes/header.php';
requireLogin();

$items = getCartItems();
if (empty($items)) {
    redirect('cart.php');
}
$total = getCartTotal($items);

// Pre-fill with user's saved info
$stmt = $pdo->prepare("SELECT full_name, email, phone, address FROM users WHERE user_id = ?");
$stmt->execute([currentUserId()]);
$user = $stmt->fetch();
?>

<section class="section container">
    <h1 class="section-title">Checkout</h1>

    <form action="process_checkout.php" method="post">
        <div class="checkout-layout">
            <div>
                <div class="form-box" style="margin:0 0 24px;">
                    <h2 style="text-align:left; font-size:1.3rem;">Shipping Information</h2>
                    <div class="form-group">
                        <label for="full_name">Full Name</label>
                        <input type="text" id="full_name" name="full_name" value="<?php echo e($user['full_name']); ?>" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email Address</label>
                        <input type="email" id="email" name="email" value="<?php echo e($user['email']); ?>" required>
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone Number</label>
                        <input type="text" id="phone" name="phone" value="<?php echo e($user['phone']); ?>" placeholder="09XXXXXXXXX" required>
                    </div>
                    <div class="form-group">
                        <label for="address">Complete Address</label>
                        <textarea id="address" name="address" rows="3" required><?php echo e($user['address']); ?></textarea>
                    </div>
                </div>

                <div class="form-box" style="margin:0;">
                    <h2 style="text-align:left; font-size:1.3rem;">Payment Method</h2>
                    <div class="payment-options">
                        <label>
                            <input type="radio" name="payment_method" value="COD" checked>
                            <span>💵 Cash on Delivery (COD)</span>
                        </label>
                        <label>
                            <input type="radio" name="payment_method" value="GCash">
                            <span>📱 GCash</span>
                        </label>
                        <label>
                            <input type="radio" name="payment_method" value="Credit/Debit Card">
                            <span>💳 Credit / Debit Card</span>
                        </label>
                        <label>
                            <input type="radio" name="payment_method" value="Bank Transfer">
                            <span>🏦 Bank Transfer</span>
                        </label>
                    </div>
                </div>
            </div>

            <div class="order-summary-box">
                <h2 style="font-size:1.3rem; margin-bottom:16px;">Order Summary</h2>
                <?php foreach ($items as $item): ?>
                    <div class="line">
                        <span><?php echo e($item['product_name']); ?> <?php echo $item['color'] ? '('.e($item['color']).')' : ''; ?> × <?php echo $item['quantity']; ?></span>
                        <span><?php echo formatPrice($item['price'] * $item['quantity']); ?></span>
                    </div>
                <?php endforeach; ?>
                <hr style="margin:14px 0; border-color:var(--border);">
                <div class="line"><span>Subtotal</span><span><?php echo formatPrice($total); ?></span></div>
                <div class="line"><span>Shipping Fee</span><span><?php echo formatPrice(0); ?></span></div>
                <div class="line total" style="font-weight:800; font-size:1.15rem; margin-top:10px;">
                    <span>Total</span><span><?php echo formatPrice($total); ?></span>
                </div>
                <button type="submit" class="btn btn-block" style="margin-top:20px;">Place Order</button>
            </div>
        </div>
    </form>
</section>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
