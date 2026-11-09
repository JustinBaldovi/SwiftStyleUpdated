<?php
require_once __DIR__ . '/includes/functions.php';

$id = (int)($_GET['id'] ?? 0);
$product = getProduct($id);

if (!$product) {
    redirect('shop.php');
}

$pageTitle = $product['product_name'];
require_once __DIR__ . '/includes/header.php';

$colors = array_filter(array_map('trim', explode(',', $product['colors'] ?? '')));

// related products (same category)
$stmt = $pdo->prepare("SELECT * FROM products WHERE category_id = ? AND product_id != ? LIMIT 4");
$stmt->execute([$product['category_id'], $product['product_id']]);
$related = $stmt->fetchAll();
?>

<section class="section container">
    <div class="product-detail">
        <div class="product-detail-img">
            <img src="<?php echo productImageUrl($product['image']); ?>"<?php echo productImgClass($product['image']); ?> alt="<?php echo e($product['product_name']); ?>">
        </div>
        <div>
            <?php if ($product['is_new']): ?><span class="product-badge">NEW</span><?php endif; ?>
            <h1><?php echo e($product['product_name']); ?></h1>
            <div class="price"><?php echo formatPrice($product['price']); ?></div>
            <p class="desc"><?php echo nl2br(e($product['description'])); ?></p>

            <?php if ($product['stock'] > 0): ?>
                <p class="stock-note">In stock: <?php echo (int)$product['stock']; ?> available</p>

                <form action="cart_action.php" method="post">
                    <input type="hidden" name="action" value="add">
                    <input type="hidden" name="product_id" value="<?php echo $product['product_id']; ?>">

                    <?php if (!empty($colors)): ?>
                    <div class="option-group">
                        <label>Available Colors</label>
                        <div class="color-options">
                            <?php foreach ($colors as $i => $color): ?>
                                <label>
                                    <input type="radio" name="color" value="<?php echo e($color); ?>" <?php echo $i===0?'checked':''; ?>>
                                    <span><?php echo e($color); ?></span>
                                </label>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <?php endif; ?>

                    <div class="option-group">
                        <label for="quantity">Quantity</label>
                        <input type="number" id="quantity" name="quantity" value="1" min="1" max="<?php echo (int)$product['stock']; ?>" class="qty-input">
                    </div>

                    <?php if (isLoggedIn()): ?>
                        <button type="submit" class="btn">Add to Cart</button>
                    <?php else: ?>
                        <a href="login.php?redirect=<?php echo urlencode('product.php?id='.$product['product_id']); ?>" class="btn">Sign In to Add to Cart</a>
                    <?php endif; ?>
                </form>
            <?php else: ?>
                <p class="stock-note" style="color:var(--danger); font-weight:700;">Out of Stock</p>
            <?php endif; ?>
        </div>
    </div>

    <?php if (!empty($related)): ?>
        <h2 class="section-title">You May Also <span>Like</span></h2>
        <div class="product-grid">
            <?php foreach ($related as $p): ?>
                <div class="product-card">
                    <a href="product.php?id=<?php echo $p['product_id']; ?>">
                        <div class="product-thumb">
                            <img src="<?php echo productImageUrl($p['image']); ?>"<?php echo productImgClass($p['image']); ?> alt="<?php echo e($p['product_name']); ?>">
                        </div>
                    </a>
                    <div class="product-info">
                        <h3><a href="product.php?id=<?php echo $p['product_id']; ?>"><?php echo e($p['product_name']); ?></a></h3>
                        <div class="product-price"><?php echo formatPrice($p['price']); ?></div>
                        <div class="product-actions">
                            <a href="product.php?id=<?php echo $p['product_id']; ?>" class="btn btn-secondary btn-block">View Product</a>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</section>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
