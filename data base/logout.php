<?php
require_once __DIR__ . '/includes/functions.php';

$_SESSION = [];
session_unset();
session_destroy();

session_start();
flash('success', 'You have been logged out successfully.');
redirect('login.php');
