<?php
$pageTitle = 'Sign In';
$bodyClass = 'auth-bg';
require_once __DIR__ . '/includes/header.php';

if (isLoggedIn()) {
    redirect('index.php');
}

$redirect = safeRedirectTarget($_GET['redirect'] ?? 'index.php');
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $redirect = safeRedirectTarget($_POST['redirect'] ?? 'index.php');

    if ($email === '' || $password === '') {
        $error = 'Please enter both email and password.';
    } else {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['full_name'] = $user['full_name'];
            $_SESSION['role'] = $user['role'];
            flash('success', 'Welcome back, ' . $user['full_name'] . '!');
            redirect($redirect);
        } else {
            $error = 'Invalid email or password.';
        }
    }
}
?>

<div class="auth-page">
<div class="form-box">
    <h2>Sign In</h2>
    <?php if ($error): ?><p style="color:var(--danger); margin-bottom:16px; text-align:center;"><?php echo e($error); ?></p><?php endif; ?>

    <form method="post">
        <input type="hidden" name="redirect" value="<?php echo e($redirect); ?>">
        <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" name="email" required>
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
        </div>
        <button type="submit" class="btn btn-block">Sign In</button>
    </form>
    <div class="social-divider"><span>or continue with</span></div>
    <a href="social_login.php?provider=facebook&amp;redirect=<?php echo urlencode($redirect); ?>" class="social-btn social-fb"><b>f</b> Continue with Facebook</a>
    <a href="social_login.php?provider=instagram&amp;redirect=<?php echo urlencode($redirect); ?>" class="social-btn social-ig"><b>◎</b> Continue with Instagram</a>
    <p class="form-note">Don't have an account? <a href="register.php">Sign Up</a></p>
    <p class="form-note" style="font-size:.8rem;">Admin demo login: admin@swiftstyleph.com / admin123</p>
</div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
