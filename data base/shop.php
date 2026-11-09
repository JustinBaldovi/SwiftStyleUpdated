<?php
$pageTitle = 'Shop';
require_once __DIR__ . '/includes/header.php';

$search = trim($_GET['search'] ?? '');
$sort = $_GET['sort'] ?? 'newest';

$sql = "SELECT * FROM products WHERE 1=1";
$params = [];

if ($search !== '') {
    $sql .= " AND product_name LIKE ?";
    $params[] = "%$search%";
}

switch ($sort) {
    case 'price_asc':  $sql .= " ORDER BY price ASC"; break;
    case 'price_desc': $sql .= " ORDER BY price DESC"; break;
    case 'name':       $sql .= " ORDER BY product_name ASC"; break;
    default:           $sql .= " ORDER BY created_at DESC";
}

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$products = $stmt->fetchAll();
$categories = getAllCategories();
?>

<section class="section container">
    <h1 class="section-title">All <span>Bags</span></h1>

    <form method="get" style="display:flex; gap:12px; margin-bottom:28px; flex-wrap:wrap;">
        <input type="text" name="search" placeholder="Search bags..." value="<?php echo e($search); ?>"
               style="flex:1; min-width:200px; padding:12px 14px; border:1px solid var(--border); border-radius:8px;">
        <select name="sort" onchange="this.form.submit()" style="padding:12px 14px; border:1px solid var(--border); border-radius:8px;">
            <option value="newest" <?php echo $sort==='newest'?'selected':''; ?>>Newest</option>
            <option value="price_asc" <?php echo $sort==='price_asc'?'selected':''; ?>>Price: Low to High</option>
            <option value="price_desc" <?php echo $sort==='price_desc'?'selected':''; ?>>Price: High to Low</option>
            <option value="name" <?php echo $sort==='name'?'selected':''; ?>>Name A-Z</option>
        </select>
        <button type="submit" class="btn">Filter</button>
    </form>

    <div class="shop-layout">
        <aside class="filter-box">
            <h4>Categories</h4>
            <a href="shop.php" class="active">All Bags</a>
            <?php foreach ($categories as $cat): ?>
                <a href="category.php?slug=<?php echo e($cat['slug']); ?>"><?php echo e($cat['category_name']); ?></a>
            <?php endforeach; ?>
        </aside>

        <div>
            <?php if (empty($products)): ?>
                <p class="empty-state">No bags found matching your search.</p>
            <?php else: ?>
                <div class="product-grid">
                    <?php foreach ($products as $p): ?>
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
            <?php endif; ?>
        </div>
    </div>
</section>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
