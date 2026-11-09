<?php
require_once __DIR__ . '/../includes/functions.php';

if (!isLoggedIn()) {
    redirect('../login.php');
}
if (!isAdmin()) {
    flash('error', 'You do not have permission to access the admin area.');
    redirect('../index.php');
}

$basePath = '../';
