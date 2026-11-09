<?php
/**
 * Database connection for Swift Style PH -> Supabase (PostgreSQL).
 * Replaces config/db.php (MySQL / XAMPP).
 *
 * Supabase Dashboard -> Connect -> "Session pooler" gives you these values.
 * Use the SESSION pooler (port 5432): it works over IPv4 (most home/school networks)
 * and supports normal prepared statements. The direct host db.<ref>.supabase.co is IPv6-only
 * on the free plan.
 *
 * Needs the pdo_pgsql extension: in XAMPP open php.ini and remove the ';' before
 *   extension=pdo_pgsql
 * then restart Apache.
 *
 * Keep the password OUT of Git: set the SUPABASE_DB_* environment variables
 * (see .env.example) or edit the fallbacks below on your own machine only.
 * NOTE: this connects as the database owner, which bypasses Row Level Security.
 * Your PHP code is therefore responsible for its own login/role checks - never
 * expose this file or these credentials to the browser.
 */

define('DB_HOST', getenv('SUPABASE_DB_HOST') ?: 'aws-0-YOUR-REGION.pooler.supabase.com');
define('DB_PORT', getenv('SUPABASE_DB_PORT') ?: '5432');
define('DB_NAME', getenv('SUPABASE_DB_NAME') ?: 'postgres');
define('DB_USER', getenv('SUPABASE_DB_USER') ?: 'postgres.YOUR-PROJECT-REF');   // pooler user = postgres.<project-ref>
define('DB_PASS', getenv('SUPABASE_DB_PASS') ?: 'YOUR-DATABASE-PASSWORD');

try {
    $pdo = new PDO(
        sprintf('pgsql:host=%s;port=%s;dbname=%s;sslmode=require', DB_HOST, DB_PORT, DB_NAME),
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // If you switch to the TRANSACTION pooler (port 6543) uncomment this line:
            // PDO::ATTR_EMULATE_PREPARES => true,
        ]
    );
    $pdo->exec("SET search_path TO public");
} catch (PDOException $e) {
    error_log('Database connection failed: ' . $e->getMessage());
    die('Database connection failed. Check config/db.php / environment variables.');
}
