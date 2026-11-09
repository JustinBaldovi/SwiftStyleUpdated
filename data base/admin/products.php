<?php
require_once __DIR__ . '/admin_guard.php';

$editProduct = null;
$error = '';

// Handle Add / Edit submit
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['form_action'] ?? '') === 'save') {
    $productId = (int)($_POST['product_id'] ?? 0);
    $categoryId = (int)$_POST['category_id'];
    $gender = in_array($_POST['gender'] ?? '', ['Men','Women','Children'], true) ? $_POST['gender'] : 'Men';
    $name = trim($_POST['product_name']);
    $description = trim($_POST['description']);
    $price = (float)$_POST['price'];
    $colors = trim($_POST['colors']);
    $stock = (int)$_POST['stock'];
    $isFeatured = isset($_POST['is_featured']) ? 1 : 0;
    $isNew = isset($_POST['is_new']) ? 1 : 0;
    $image = trim($_POST['image']); // filename only; upload manually to assets/img

    if ($name === '' || $price <= 0) {
        $error = 'Please provide a valid product name and price.';
    } elseif ($productId > 0) {
        $stmt = $pdo->prepare(
            "UPDATE products SET category_id=?, gender=?, product_name=?, description=?, price=?, colors=?, stock=?, image=?, is_featured=?, is_new=?
             WHERE product_id=?"
        );
        $stmt->execute([$categoryId, $gender, $name, $description, $price, $colors, $stock, $image, $isFeatured, $isNew, $productId]);
        flash('success', 'Product updated successfully.');
        redirect('products.php');
    } else {
        $stmt = $pdo->prepare(
            "INSERT INTO products (category_id, gender, product_name, description, price, colors, stock, image, is_featured, is_new)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([$categoryId, $gender, $name, $description, $price, $colors, $stock, $image, $isFeatured, $isNew]);
        flash('success', 'Product added successfully.');
        redirect('products.php');
    }
}

// Handle delete
if (isset($_GET['delete'])) {
    $stmt = $pdo->prepare("DELETE FROM products WHERE product_id = ?");
    $stmt->execute([(int)$_GET['delete']]);
    flash('success', 'Product deleted.');
    redirect('products.php');
}

// Handle edit load
if (isset($_GET['edit'])) {
    $stmt = $pdo->prepare("SELECT * FROM products WHERE product_id = ?");
    $stmt->execute([(int)$_GET['edit']]);
    $editProduct = $stmt->fetch();
}

$products = $pdo->query(
    "SELECT p.*, c.category_name FROM products p JOIN categories c ON c.category_id = p.category_id ORDER BY p.created_at DESC"
)->fetchAll();
$categories = getAllCategories();
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Manage Products | Swift Style PH Admin</title>
<link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
<div class="admin-wrap">
    <aside class="admin-sidebar">
        <h3 style="padding:0 24px 20px; color:#fff;">Swift Style <span style="color:var(--teal);">Admin</span></h3>
        <a href="dashboard.php">Dashboard</a>
        <a href="products.php" class="active">Products</a>
        <a href="orders.php">Orders</a>
        <a href="../index.php">View Site</a>
        <a href="../logout.php">Log Out</a>
    </aside>
    <div class="admin-content">
        <h1 style="margin-bottom:24px;"><?php echo $editProduct ? 'Edit Product' : 'Add New Product'; ?></h1>

        <?php if ($msg = flash('success')): ?><div class="flash flash-success" style="margin-bottom:20px;"><?php echo e($msg); ?></div><?php endif; ?>
        <?php if ($error): ?><div class="flash flash-error" style="margin-bottom:20px;"><?php echo e($error); ?></div><?php endif; ?>

        <form method="post" class="form-box" style="margin:0 0 40px; max-width:100%;">
            <input type="hidden" name="form_action" value="save">
            <input type="hidden" name="product_id" value="<?php echo $editProduct['product_id'] ?? 0; ?>">

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div class="form-group">
                    <label>Product Name</label>
                    <input type="text" name="product_name" value="<?php echo e($editProduct['product_name'] ?? ''); ?>" required>
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <select name="category_id" required>
                        <?php foreach ($categories as $cat): ?>
                            <option value="<?php echo $cat['category_id']; ?>" <?php echo (isset($editProduct) && $editProduct['category_id']==$cat['category_id']) ? 'selected' : ''; ?>>
                                <?php echo e($cat['category_name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label>Gender</label>
                    <select name="gender" required>
                        <?php foreach (['Men','Women','Children'] as $g): ?>
                            <option value="<?php echo $g; ?>" <?php echo (isset($editProduct) && $editProduct['gender']===$g) ? 'selected' : ''; ?>>
                                <?php echo $g; ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label>Price (₱)</label>
                    <input type="number" step="0.01" name="price" value="<?php echo e($editProduct['price'] ?? ''); ?>" required>
                </div>
                <div class="form-group">
                    <label>Stock Quantity</label>
                    <input type="number" name="stock" value="<?php echo e($editProduct['stock'] ?? 0); ?>" required>
                </div>
                <div class="form-group">
                    <label>Colors (comma-separated)</label>
                    <input type="text" name="colors" value="<?php echo e($editProduct['colors'] ?? ''); ?>" placeholder="Black,Navy,Beige">
                </div>
                <div class="form-group">
                    <label>Image Filename</label>
                    <input type="text" name="image" value="<?php echo e($editProduct['image'] ?? ''); ?>" placeholder="e.g. backpack1.jpg">
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description" rows="3"><?php echo e($editProduct['description'] ?? ''); ?></textarea>
            </div>
            <div style="display:flex; gap:24px; margin-bottom:20px;">
                <label><input type="checkbox" name="is_featured" <?php echo (!empty($editProduct['is_featured'])) ? 'checked' : ''; ?>> Featured</label>
                <label><input type="checkbox" name="is_new" <?php echo (!empty($editProduct['is_new'])) ? 'checked' : ''; ?>> New Arrival</label>
            </div>
            <button type="submit" class="btn"><?php echo $editProduct ? 'Update Product' : 'Add Product'; ?></button>
            <?php if ($editProduct): ?><a href="products.php" class="btn btn-secondary">Cancel</a><?php endif; ?>
        </form>

        <h2 style="margin-bottom:16px;">All Products</h2>
        <table class="admin-table">
            <thead>
                <tr><th>Image</th><th>Name</th><th>Category</th><th>Gender</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
            </thead>
            <tbody>
            <?php foreach ($products as $p): ?>
                <tr>
                    <td><img src="<?php echo productImageUrl($p['image']); ?>"<?php echo productImgClass($p['image']); ?> alt=""></td>
                    <td><?php echo e($p['product_name']); ?></td>
                    <td><?php echo e($p['category_name']); ?></td>
                    <td><?php echo e($p['gender']); ?></td>
                    <td><?php echo formatPrice($p['price']); ?></td>
                    <td><?php echo (int)$p['stock']; ?></td>
                    <td>
                        <a href="products.php?edit=<?php echo $p['product_id']; ?>">Edit</a> |
                        <a href="products.php?delete=<?php echo $p['product_id']; ?>" style="color:var(--danger);"
                           onclick="return confirm('Delete this product?');">Delete</a>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>
</body>
</html>
