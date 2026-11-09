<?php
$pageTitle = 'Home';
require_once __DIR__ . '/includes/header.php';

$featured = $pdo->query("SELECT * FROM products WHERE is_featured = 1 ORDER BY created_at DESC LIMIT 8")->fetchAll();
$newArrivals = $pdo->query("SELECT * FROM products WHERE is_new = 1 ORDER BY created_at DESC LIMIT 8")->fetchAll();
?>

<section class="hero">
    <h1>Carry What Matters.</h1>
    <p>Quality backpacks, totes, and bags made for everyday Filipino life.</p>
    <a href="shop.php" class="btn">Shop Now</a>
</section>

<section class="section container">
    <h2 class="section-title">Featured <span>Bags</span></h2>
    <div class="product-grid">
        <?php foreach ($featured as $p): ?>
            <div class="product-card">
                <a href="product.php?id=<?php echo $p['product_id']; ?>">
                    <div class="product-thumb">
                        <img src="<?php echo productImageUrl($p['image']); ?>"<?php echo productImgClass($p['image']); ?> alt="<?php echo e($p['product_name']); ?>">
                    </div>
                </a>
                <div class="product-info">
                    <?php if ($p['is_new']): ?><span class="product-badge">NEW</span><?php endif; ?>
                    <h3><a href="product.php?id=<?php echo $p['product_id']; ?>"><?php echo e($p['product_name']); ?></a></h3>
                    <div class="product-price"><?php echo formatPrice($p['price']); ?></div>
                    <div class="product-actions">
                        <a href="product.php?id=<?php echo $p['product_id']; ?>" class="btn btn-secondary btn-block">View Product</a>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
</section>

<section class="section container" style="background:var(--light-bg); border-radius:16px;">
    <h2 class="section-title">New <span>Arrivals</span></h2>
    <div class="product-grid">
        <?php foreach ($newArrivals as $p): ?>
            <div class="product-card">
                <a href="product.php?id=<?php echo $p['product_id']; ?>">
                    <div class="product-thumb">
                        <img src="<?php echo productImageUrl($p['image']); ?>"<?php echo productImgClass($p['image']); ?> alt="<?php echo e($p['product_name']); ?>">
                    </div>
                </a>
                <div class="product-info">
                    <span class="product-badge">NEW</span>
                    <h3><a href="product.php?id=<?php echo $p['product_id']; ?>"><?php echo e($p['product_name']); ?></a></h3>
                    <div class="product-price"><?php echo formatPrice($p['price']); ?></div>
                    <div class="product-actions">
                        <a href="product.php?id=<?php echo $p['product_id']; ?>" class="btn btn-secondary btn-block">View Product</a>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
</section>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
