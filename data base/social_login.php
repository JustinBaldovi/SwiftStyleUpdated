<?php
/**
 * Facebook / Instagram sign-in (DEMO).
 * A real integration needs a Facebook/Meta developer app (App ID + secret) and
 * an OAuth redirect. For the school project this page simulates the provider:
 * the visitor types the account details and we create/sign in a local user.
 */
$pageTitle = 'Social Sign In';
$bodyClass = 'auth-bg';
require_once __DIR__ . '/includes/header.php';

if (isLoggedIn()) {
    redirect('index.php');
}

$provider = strtolower($_GET['provider'] ?? $_POST['provider'] ?? '');
if (!in_array($provider, ['facebook', 'instagram'], true)) {
    redirect('login.php');
}
$label = ucfirst($provider);
$redirect = safeRedirectTarget($_GET['redirect'] ?? $_POST['redirect'] ?? 'index.php');

// Auto-add the "provider" column if the database was imported from an older .sql file.
$col = $pdo->query("SHOW COLUMNS FROM users LIKE 'provider'")->fetch();
if (!$col) {
    $pdo->exec("ALTER TABLE users ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'email'");
}

$error = '';
$old = ['name' => '', 'id' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $old['name'] = trim($_POST['name'] ?? '');
    $old['id'] = trim($_POST['id'] ?? '');

    if ($old['name'] === '' || $old['id'] === '') {
        $error = 'Please fill in all fields.';
    } elseif ($provider === 'facebook' && !filter_var($old['id'], FILTER_VALIDATE_EMAIL)) {
        $error = 'Please enter a valid email address.';
    } elseif ($provider === 'instagram' && !preg_match('/^@?[A-Za-z0-9._]{1,30}$/', $old['id'])) {
        $error = 'Please enter a valid Instagram username.';
    } else {
        $email = $provider === 'instagram' ? ltrim($old['id'], '@') . '@instagram.local' : $old['id'];

        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && $user['provider'] !== $provider) {
            // Never let a social sign-in take over an account made another way (e.g. the admin).
            $error = 'An account with this email already exists. Please sign in another way.';
        } else {
            if (!$user) {
                $ins = $pdo->prepare(
                    "INSERT INTO users (full_name, email, password, role, provider) VALUES (?, ?, ?, 'customer', ?)"
                );
                $ins->execute([$old['name'], $email, password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT), $provider]);
                $user = ['user_id' => $pdo->lastInsertId(), 'full_name' => $old['name'], 'role' => 'customer'];
            }
            session_regenerate_id(true);
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['full_name'] = $user['full_name'];
            $_SESSION['role'] = $user['role'];
            flash('success', 'Welcome, ' . $user['full_name'] . '!');
            redirect($redirect);
        }
    }
}
?>

<div class="auth-page">
<div class="form-box">
    <h2><?php echo e($label); ?> Sign In</h2>
    <p class="form-note" style="margin:0 0 16px;">Demo sign-in: enter the details for your <?php echo e($label); ?> account.</p>
    <?php if ($error): ?><p style="color:var(--danger); margin-bottom:16px; text-align:center;"><?php echo e($error); ?></p><?php endif; ?>

    <form method="post">
        <input type="hidden" name="provider" value="<?php echo e($provider); ?>">
        <input type="hidden" name="redirect" value="<?php echo e($redirect); ?>">
        <div class="form-group">
            <label for="name">Full Name</label>
            <input type="text" id="name" name="name" value="<?php echo e($old['name']); ?>" required>
        </div>
        <div class="form-group">
            <label for="id"><?php echo $provider === 'facebook' ? 'Email Address' : 'Instagram Username'; ?></label>
            <input type="<?php echo $provider === 'facebook' ? 'email' : 'text'; ?>" id="id" name="id" value="<?php echo e($old['id']); ?>" required>
        </div>
        <button type="submit" class="btn btn-block">Continue</button>
    </form>
    <p class="form-note"><a href="login.php">&larr; Back to Sign In</a></p>
</div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
