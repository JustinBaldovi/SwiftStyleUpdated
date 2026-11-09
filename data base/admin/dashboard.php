<?php
require_once __DIR__ . '/admin_guard.php';
$pageTitle = 'Admin Dashboard';

$totalProducts = $pdo->query("SELECT COUNT(*) c FROM products")->fetch()['c'];
$totalOrders = $pdo->query("SELECT COUNT(*) c FROM orders")->fetch()['c'];
$totalCustomers = $pdo->query("SELECT COUNT(*) c FROM users WHERE role='customer'")->fetch()['c'];
$totalRevenue = $pdo->query("SELECT COALESCE(SUM(total_amount),0) s FROM orders WHERE order_status != 'Cancelled'")->fetch()['s'];

$recentOrders = $pdo->query(
    "SELECT * FROM orders ORDER BY created_at DESC LIMIT 8"
)->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Admin Dashboard | Swift Style PH</title>
<link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
<div class="admin-wrap">
    <aside class="admin-sidebar">
        <h3 style="padding:0 24px 20px; color:#fff;">Swift Style <span style="color:var(--teal);">Admin</span></h3>
        <a href="dashboard.php" class="active">Dashboard</a>
        <a href="products.php">Products</a>
        <a href="orders.php">Orders</a>
        <a href="../index.php">View Site</a>
        <a href="../logout.php">Log Out</a>
    </aside>
    <div class="admin-content">
        <h1 style="margin-bottom:24px;">Dashboard</h1>

        <div class="admin-stats">
            <div class="stat-card"><div class="num"><?php echo $totalProducts; ?></div><div class="label">Total Products</div></div>
            <div class="stat-card"><div class="num"><?php echo $totalOrders; ?></div><div class="label">Total Orders</div></div>
            <div class="stat-card"><div class="num"><?php echo $totalCustomers; ?></div><div class="label">Customers</div></div>
            <div class="stat-card"><div class="num"><?php echo formatPrice($totalRevenue); ?></div><div class="label">Revenue</div></div>
        </div>

        <h2 style="margin-bottom:16px;">Recent Orders</h2>
        <table class="admin-table">
            <thead>
                <tr><th>Order #</th><th>Customer</th><th>Payment</th><th>Total</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
            <?php foreach ($recentOrders as $o): ?>
                <tr>
                    <td>#<?php echo str_pad($o['order_id'], 6, '0', STR_PAD_LEFT); ?></td>
                    <td><?php echo e($o['full_name']); ?></td>
                    <td><?php echo e($o['payment_method']); ?></td>
                    <td><?php echo formatPrice($o['total_amount']); ?></td>
                    <td><span class="status-badge status-<?php echo e($o['order_status']); ?>"><?php echo e($o['order_status']); ?></span></td>
                    <td><?php echo date('M d, Y', strtotime($o['created_at'])); ?></td>
                </tr>
            <?php endforeach; ?>
            <?php if (empty($recentOrders)): ?>
                <tr><td colspan="6" style="text-align:center; color:var(--gray);">No orders yet.</td></tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>
</body>
</html>
