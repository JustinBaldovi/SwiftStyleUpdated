<?php require_once __DIR__ . '/functions.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?php echo isset($pageTitle) ? e($pageTitle) . ' | Swift Style PH' : 'Swift Style PH'; ?></title>
<link rel="stylesheet" href="<?php echo isset($basePath) ? $basePath : ''; ?>assets/css/style.css">
</head>
<body<?php echo !empty($bodyClass) ? ' class="' . e($bodyClass) . '"' : ''; ?>>

<header class="site-header">
    <div class="container header-inner">
        <a href="<?php echo isset($basePath) ? $basePath : ''; ?>index.php" class="logo">
            Swift Style <span>PH</span>
        </a>

        <?php if (isLoggedIn()): ?>
        <nav class="main-nav">
            <a href="<?php echo isset($basePath) ? $basePath : ''; ?>index.php">Home</a>
            <a href="<?php echo isset($basePath) ? $basePath : ''; ?>shop.php">Shop</a>
            <div class="dropdown">
                <span>Categories ▾</span>
                <div class="dropdown-menu category-mega-menu">
                    <div class="gender-tabs">
                        <button type="button" class="gender-tab active" data-gender="men">Men</button>
                        <button type="button" class="gender-tab" data-gender="women">Women</button>
                        <button type="button" class="gender-tab" data-gender="children">Children</button>
                    </div>
                    <div class="gender-subcats" id="gender-subcats" data-base-path="<?php echo isset($basePath) ? $basePath : ''; ?>"></div>
                </div>
            </div>
            <a href="<?php echo isset($basePath) ? $basePath : ''; ?>about.php">About Us</a>
            <a href="<?php echo isset($basePath) ? $basePath : ''; ?>contact.php">Contact Us</a>
        </nav>
        <?php endif; ?>

        <div class="nav-actions">
            <?php if (isLoggedIn()): ?>
            <a href="<?php echo isset($basePath) ? $basePath : ''; ?>cart.php" class="cart-link">
                🛒 Cart
                <span class="cart-badge"><?php echo getCartCount(); ?></span>
            </a>
            <?php endif; ?>
            <?php if (isLoggedIn()): ?>
                <span class="hello-user">Hi, <?php echo e(explode(' ', $_SESSION['full_name'])[0]); ?></span>
                <?php if (isAdmin()): ?>
                    <a href="<?php echo isset($basePath) ? $basePath : ''; ?>admin/dashboard.php" class="btn-small">Admin</a>
                <?php endif; ?>
                <a href="<?php echo isset($basePath) ? $basePath : ''; ?>logout.php" class="btn-small btn-outline">Log Out</a>
            <?php else: ?>
                <a href="<?php echo isset($basePath) ? $basePath : ''; ?>login.php" class="btn-small btn-outline">Sign In</a>
                <a href="<?php echo isset($basePath) ? $basePath : ''; ?>register.php" class="btn-small">Sign Up</a>
            <?php endif; ?>
        </div>
    </div>
</header>

<script>
(function () {
    var container = document.getElementById('gender-subcats');
    if (!container) return;
    var base = container.dataset.basePath || '';

    var subcatsByGender = {
        men: [
            { name: 'Backpacks', slug: 'backpacks' },
            { name: 'Tote Bags', slug: 'tote-bags' },
            { name: 'Sling Bags', slug: 'sling-bags' },
            { name: 'Laptop Bags', slug: 'laptop-bags' }
        ],
        women: [
            { name: 'Backpacks', slug: 'backpacks' },
            { name: 'Tote Bags', slug: 'tote-bags' },
            { name: 'Sling Bags', slug: 'sling-bags' },
            { name: 'Laptop Bags', slug: 'laptop-bags' }
        ],
        children: [
            { name: 'Backpacks', slug: 'backpacks' },
            { name: 'Tote Bags', slug: 'tote-bags' },
            { name: 'Sling Bags', slug: 'sling-bags' },
            { name: 'Trolley Bags', slug: 'trolley-bags' }
        ]
    };

    function renderSubcats(gender) {
        container.innerHTML = subcatsByGender[gender].map(function (c) {
            return '<a href="' + base + 'category.php?gender=' + gender + '&slug=' + c.slug + '">' + c.name + '</a>';
        }).join('');
    }

    document.querySelectorAll('.gender-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.gender-tab').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            renderSubcats(btn.dataset.gender);
        });
    });

    renderSubcats('men');
})();
</script>

<?php if ($msg = flash('success')): ?>
    <div class="flash flash-success container"><?php echo e($msg); ?></div>
<?php endif; ?>
<?php if ($msg = flash('error')): ?>
    <div class="flash flash-error container"><?php echo e($msg); ?></div>
<?php endif; ?>

<main>
