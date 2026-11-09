<?php
$pageTitle = 'Your Cart';
require_once __DIR__ . '/includes/header.php';
requireLogin();

$items = getCartItems();
$total = getCartTotal($items);
?>

<section class="section container">
    <h1 class="section-title">Your <span>Cart</span></h1>

    <?php if (empty($items)): ?>
        <div class="empty-state">
            <p>Your cart is empty.</p>
            <br>
            <a href="shop.php" class="btn">Continue Shopping</a>
        </div>
    <?php else: ?>
        <table class="cart-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Color</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Subtotal</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($items as $item): ?>
                <tr>
                    <td>
                        <div class="cart-item-info">
                            <img src="<?php echo productImageUrl($item['image']); ?>"<?php echo productImgClass($item['image']); ?> alt="<?php echo e($item['product_name']); ?>">
                            <a href="product.php?id=<?php echo $item['product_id']; ?>"><?php echo e($item['product_name']); ?></a>
                        </div>
                    </td>
                    <td><?php echo e($item['color'] ?: '—'); ?></td>
                    <td><?php echo formatPrice($item['price']); ?></td>
                    <td>
                        <form action="cart_action.php" method="post" class="qty-form">
                            <input type="hidden" name="action" value="update">
                            <input type="hidden" name="cart_id" value="<?php echo $item['cart_id']; ?>">
                            <input type="number" name="quantity" value="<?php echo $item['quantity']; ?>" min="1" max="<?php echo (int)$item['stock']; ?>">
                            <button type="submit" class="btn-small btn-outline" style="color:var(--purple); border-color:var(--purple);">Update</button>
                        </form>
                    </td>
                    <td><?php echo formatPrice($item['price'] * $item['quantity']); ?></td>
                    <td>
                        <form action="cart_action.php" method="post">
                            <input type="hidden" name="action" value="remove">
                            <input type="hidden" name="cart_id" value="<?php echo $item['cart_id']; ?>">
                            <button type="submit" class="remove-btn">Remove</button>
                        </form>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>

        <div class="cart-summary">
            <div class="row"><span>Subtotal</span><span><?php echo formatPrice($total); ?></span></div>
            <div class="row"><span>Shipping</span><span>Calculated at checkout</span></div>
            <div class="row total"><span>Total</span><span><?php echo formatPrice($total); ?></span></div>
            <a href="checkout.php" class="btn btn-block" style="margin-top:16px; text-align:center;">Proceed to Checkout</a>
            <a href="shop.php" class="btn btn-secondary btn-block" style="margin-top:10px; text-align:center;">Continue Shopping</a>
        </div>
    <?php endif; ?>
</section>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
