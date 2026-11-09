<?php
require_once __DIR__ . '/admin_guard.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['order_id'])) {
    $orderId = (int)$_POST['order_id'];
    $status = $_POST['order_status'];
    $allowed = ['Pending','Processing','Shipped','Completed','Cancelled'];
    if (in_array($status, $allowed, true)) {
        $stmt = $pdo->prepare("UPDATE orders SET order_status = ? WHERE order_id = ?");
        $stmt->execute([$status, $orderId]);
        flash('success', 'Order #' . str_pad($orderId,6,'0',STR_PAD_LEFT) . ' status updated to ' . $status . '.');
    }
    redirect('orders.php');
}

$orders = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC")->fetchAll();

$viewOrder = null;
$viewItems = [];
if (isset($_GET['view'])) {
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE order_id = ?");
    $stmt->execute([(int)$_GET['view']]);
    $viewOrder = $stmt->fetch();
    if ($viewOrder) {
        $stmt2 = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
        $stmt2->execute([$viewOrder['order_id']]);
        $viewItems = $stmt2->fetchAll();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Manage Orders | Swift Style PH Admin</title>
<link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
<div class="admin-wrap">
    <aside class="admin-sidebar">
        <h3 style="padding:0 24px 20px; color:#fff;">Swift Style <span style="color:var(--teal);">Admin</span></h3>
        <a href="dashboard.php">Dashboard</a>
        <a href="products.php">Products</a>
        <a href="orders.php" class="active">Orders</a>
        <a href="../index.php">View Site</a>
        <a href="../logout.php">Log Out</a>
    </aside>
    <div class="admin-content">
        <h1 style="margin-bottom:24px;">Orders</h1>
        <?php if ($msg = flash('success')): ?><div class="flash flash-success" style="margin-bottom:20px;"><?php echo e($msg); ?></div><?php endif; ?>

        <?php if ($viewOrder): ?>
            <div class="order-summary-box" style="max-width:600px; margin-bottom:32px;">
                <h2 style="font-size:1.2rem; margin-bottom:14px;">
                    Order #<?php echo str_pad($viewOrder['order_id'],6,'0',STR_PAD_LEFT); ?>
                </h2>
                <p><strong>Customer:</strong> <?php echo e($viewOrder['full_name']); ?></p>
                <p><strong>Email:</strong> <?php echo e($viewOrder['email']); ?></p>
                <p><strong>Phone:</strong> <?php echo e($viewOrder['phone']); ?></p>
                <p><strong>Address:</strong> <?php echo e($viewOrder['address']); ?></p>
                <p><strong>Payment Method:</strong> <?php echo e($viewOrder['payment_method']); ?></p>
                <hr style="margin:14px 0; border-color:var(--border);">
                <?php foreach ($viewItems as $item): ?>
                    <div class="line">
                        <span><?php echo e($item['product_name']); ?> <?php echo $item['color'] ? '('.e($item['color']).')' : ''; ?> × <?php echo $item['quantity']; ?></span>
                        <span><?php echo formatPrice($item['subtotal']); ?></span>
                    </div>
                <?php endforeach; ?>
                <div class="line total" style="font-weight:800; margin-top:10px;">
                    <span>Total</span><span><?php echo formatPrice($viewOrder['total_amount']); ?></span>
                </div>
                <a href="orders.php" class="btn btn-secondary" style="margin-top:16px;">Back to Orders</a>
            </div>
        <?php endif; ?>

        <table class="admin-table">
            <thead>
                <tr><th>Order #</th><th>Customer</th><th>Payment</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
            <?php foreach ($orders as $o): ?>
                <tr>
                    <td>#<?php echo str_pad($o['order_id'], 6, '0', STR_PAD_LEFT); ?></td>
                    <td><?php echo e($o['full_name']); ?></td>
                    <td><?php echo e($o['payment_method']); ?></td>
                    <td><?php echo formatPrice($o['total_amount']); ?></td>
                    <td>
                        <form method="post" style="display:flex; gap:6px; align-items:center;">
                            <input type="hidden" name="order_id" value="<?php echo $o['order_id']; ?>">
                            <select name="order_status" onchange="this.form.submit()">
                                <?php foreach (['Pending','Processing','Shipped','Completed','Cancelled'] as $status): ?>
                                    <option value="<?php echo $status; ?>" <?php echo $o['order_status']===$status?'selected':''; ?>><?php echo $status; ?></option>
                                <?php endforeach; ?>
                            </select>
                        </form>
                    </td>
                    <td><?php echo date('M d, Y', strtotime($o['created_at'])); ?></td>
                    <td><a href="orders.php?view=<?php echo $o['order_id']; ?>">View</a></td>
                </tr>
            <?php endforeach; ?>
            <?php if (empty($orders)): ?>
                <tr><td colspan="7" style="text-align:center; color:var(--gray);">No orders yet.</td></tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>
</body>
</html>
