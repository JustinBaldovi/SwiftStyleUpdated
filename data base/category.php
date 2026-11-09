<?php
require_once __DIR__ . '/includes/functions.php';

$slug = $_GET['slug'] ?? '';
$category = getCategoryBySlug($slug);

if (!$category) {
    redirect('shop.php');
}

$gender = validGender($_GET['gender'] ?? null); // 'Men' | 'Women' | 'Children' | null
$sort = $_GET['sort'] ?? 'newest';

$pageTitle = ($gender ? $gender . "'s " : '') . $category['category_name'];
require_once __DIR__ . '/includes/header.php';

$sql = "SELECT * FROM products WHERE category_id = ?";
$params = [$category['category_id']];

if ($gender) {
    $sql .= " AND gender = ?";
    $params[] = $gender;
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
$subcats = $gender ? getSubcategoriesForGender($gender) : null;

// Build a query-string helper that preserves gender + sort when switching category
function catLink($catSlug, $gender, $sort = 'newest') {
    $q = ['slug' => $catSlug];
    if ($gender) $q['gender'] = strtolower($gender);
    if ($sort && $sort !== 'newest') $q['sort'] = $sort;
    return 'category.php?' . http_build_query($q);
}
?>

<section class="section container">
    <h1 class="section-title">
        <?php if ($gender): ?><?php echo e($gender); ?>'s <span><?php echo e($category['category_name']); ?></span>
        <?php else: ?><?php echo e($category['category_name']); ?><?php endif; ?>
    </h1>

    <?php if ($gender): ?>
        <p style="text-align:center; margin-top:-16px; margin-bottom:28px;">
            <a href="index.php" style="color:var(--purple); font-weight:600;">&larr; Back to Home</a>
            &nbsp;|&nbsp;
            Browsing: <strong><?php echo e($gender); ?></strong>
        </p>
    <?php endif; ?>

    <form method="get" style="display:flex; gap:12px; margin-bottom:28px; flex-wrap:wrap; justify-content:flex-end;">
        <input type="hidden" name="slug" value="<?php echo e($slug); ?>">
        <?php if ($gender): ?><input type="hidden" name="gender" value="<?php echo e(strtolower($gender)); ?>"><?php endif; ?>
        <select name="sort" onchange="this.form.submit()" style="padding:12px 14px; border:1px solid var(--border); border-radius:8px;">
            <option value="newest" <?php echo $sort==='newest'?'selected':''; ?>>Newest</option>
            <option value="price_asc" <?php echo $sort==='price_asc'?'selected':''; ?>>Price: Low to High</option>
            <option value="price_desc" <?php echo $sort==='price_desc'?'selected':''; ?>>Price: High to Low</option>
            <option value="name" <?php echo $sort==='name'?'selected':''; ?>>Name A-Z</option>
        </select>
    </form>

    <div class="shop-layout">
        <aside class="filter-box">
            <?php if ($subcats): ?>
                <h4><?php echo e($gender); ?>'s Categories</h4>
                <?php foreach ($subcats as $sc): ?>
                    <a href="<?php echo catLink($sc['slug'], $gender, $sort); ?>"
                       class="<?php echo $sc['slug'] === $slug ? 'active' : ''; ?>">
                        <?php echo e($sc['name']); ?>
                    </a>
                <?php endforeach; ?>
            <?php else: ?>
                <h4>Categories</h4>
                <a href="shop.php">All Bags</a>
                <?php foreach ($categories as $cat): ?>
                    <a href="category.php?slug=<?php echo e($cat['slug']); ?>"
                       class="<?php echo $cat['category_id'] === $category['category_id'] ? 'active' : ''; ?>">
                        <?php echo e($cat['category_name']); ?>
                    </a>
                <?php endforeach; ?>
            <?php endif; ?>
        </aside>

        <div>
            <?php if (empty($products)): ?>
                <p class="empty-state">
                    No <?php echo $gender ? e(strtolower($gender)) . "'s " : ''; ?>bags available in this category yet.
                </p>
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
