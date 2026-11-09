<?php
$pageTitle = 'Sign Up';
$bodyClass = 'auth-bg';
require_once __DIR__ . '/includes/header.php';

if (isLoggedIn()) {
    redirect('index.php');
}

$error = '';
$old = ['full_name' => '', 'email' => '', 'phone' => '', 'address' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $old['full_name'] = trim($_POST['full_name'] ?? '');
    $old['email'] = trim($_POST['email'] ?? '');
    $old['phone'] = trim($_POST['phone'] ?? '');
    $old['address'] = trim($_POST['address'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm_password'] ?? '';

    if ($old['full_name'] === '' || $old['email'] === '' || $password === '') {
        $error = 'Please fill in all required fields.';
    } elseif (!filter_var($old['email'], FILTER_VALIDATE_EMAIL)) {
        $error = 'Please enter a valid email address.';
    } elseif (strlen($password) < 6) {
        $error = 'Password must be at least 6 characters.';
    } elseif ($password !== $confirm) {
        $error = 'Passwords do not match.';
    } else {
        $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ?");
        $stmt->execute([$old['email']]);
        if ($stmt->fetch()) {
            $error = 'An account with this email already exists.';
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $ins = $pdo->prepare(
                "INSERT INTO users (full_name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, 'customer')"
            );
            $ins->execute([$old['full_name'], $old['email'], $hash, $old['phone'], $old['address']]);

            $_SESSION['user_id'] = $pdo->lastInsertId();
            $_SESSION['full_name'] = $old['full_name'];
            $_SESSION['role'] = 'customer';

            flash('success', 'Account created! Welcome to Swift Style PH, ' . $old['full_name'] . '.');
            redirect('index.php');
        }
    }
}
?>

<div class="auth-page">
<div class="form-box">
    <h2>Create an Account</h2>
    <?php if ($error): ?><p style="color:var(--danger); margin-bottom:16px; text-align:center;"><?php echo e($error); ?></p><?php endif; ?>

    <form method="post">
        <div class="form-group">
            <label for="full_name">Full Name</label>
            <input type="text" id="full_name" name="full_name" value="<?php echo e($old['full_name']); ?>" required>
        </div>
        <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" name="email" value="<?php echo e($old['email']); ?>" required>
        </div>
        <div class="form-group">
            <label for="phone">Phone Number</label>
            <input type="text" id="phone" name="phone" value="<?php echo e($old['phone']); ?>" placeholder="09XXXXXXXXX">
        </div>
        <div class="form-group">
            <label for="address">Address</label>
            <textarea id="address" name="address" rows="2"><?php echo e($old['address']); ?></textarea>
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
        </div>
        <div class="form-group">
            <label for="confirm_password">Confirm Password</label>
            <input type="password" id="confirm_password" name="confirm_password" required>
        </div>
        <button type="submit" class="btn btn-block">Sign Up</button>
    </form>
    <div class="social-divider"><span>or continue with</span></div>
    <a href="social_login.php?provider=facebook&amp;redirect=index.php" class="social-btn social-fb"><b>f</b> Continue with Facebook</a>
    <a href="social_login.php?provider=instagram&amp;redirect=index.php" class="social-btn social-ig"><b>◎</b> Continue with Instagram</a>
    <p class="form-note">Already have an account? <a href="login.php">Sign In</a></p>
</div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
