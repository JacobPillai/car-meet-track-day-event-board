<?php
/**
 * ApexGrid — PHP 5.4 - 8.x Compatible Configuration & Database Helper
 * Engineered for Swinburne FeeNIX Mercury Web Server (PHP 5.4 + MariaDB 5.5)
 * as well as local XAMPP / WAMP environments.
 */

// 1. Mercury Memory Limit & Error Reporting Setup
ini_set('memory_limit', '16M');
error_reporting(E_ALL);
ini_set('display_errors', '0');

// 2. Private settings. Copy api/config.local.example.php to api/config.local.php
//    (git-ignored) and fill in your own DB login and a long random JWT secret.
if (file_exists(dirname(__FILE__) . '/config.local.php')) {
    require_once dirname(__FILE__) . '/config.local.php';
}
if (!defined('DB_HOST')) define('DB_HOST', getenv('APEX_DB_HOST') ? getenv('APEX_DB_HOST') : 'localhost');
if (!defined('DB_NAME')) define('DB_NAME', getenv('APEX_DB_NAME') ? getenv('APEX_DB_NAME') : '');
if (!defined('DB_USER')) define('DB_USER', getenv('APEX_DB_USER') ? getenv('APEX_DB_USER') : '');
if (!defined('DB_PASS')) define('DB_PASS', getenv('APEX_DB_PASS') ? getenv('APEX_DB_PASS') : '');
// No built-in secret: a guessable default would let anyone forge an admin token.
if (!defined('JWT_SECRET')) define('JWT_SECRET', getenv('APEX_JWT_SECRET') ? getenv('APEX_JWT_SECRET') : '');
// Comma separated browser origins allowed to call the API cross-site (same-origin needs none).
if (!defined('ALLOWED_ORIGINS')) define('ALLOWED_ORIGINS', getenv('APEX_ALLOWED_ORIGINS') ? getenv('APEX_ALLOWED_ORIGINS') : 'http://localhost:5173,http://127.0.0.1:5173');
// Login throttle: lock an email/IP pair after this many failures inside the window.
if (!defined('LOGIN_MAX_FAILURES')) define('LOGIN_MAX_FAILURES', 5);
if (!defined('LOGIN_WINDOW_SECONDS')) define('LOGIN_WINDOW_SECONDS', 900);

// 3. CORS & JSON Headers (echo the origin only when it is on the allow-list)
$apex_origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if ($apex_origin !== '' && in_array($apex_origin, array_map('trim', explode(',', ALLOWED_ORIGINS)), true)) {
    header('Access-Control-Allow-Origin: ' . $apex_origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_status(200);
    exit;
}

/**
 * PHP 5.4 compatible HTTP status helper
 */
function http_status($code) {
    if (function_exists('http_response_code')) {
        http_response_code($code);
    } else {
        header('X-PHP-Response-Code: ' . $code, true, $code);
    }
}

/**
 * Send JSON response and terminate
 */
function send_json($data, $status_code = 200) {
    http_status($status_code);
    echo json_encode($data);
    exit;
}

/**
 * Constant-time string compare (hash_equals needs PHP 5.6)
 */
function apex_safe_equals($a, $b) {
    if (function_exists('hash_equals')) {
        return hash_equals((string)$a, (string)$b);
    }
    $a = (string)$a;
    $b = (string)$b;
    if (strlen($a) !== strlen($b)) {
        return false;
    }
    $diff = 0;
    for ($i = 0; $i < strlen($a); $i++) {
        $diff |= ord($a[$i]) ^ ord($b[$i]);
    }
    return $diff === 0;
}

/**
 * Random bytes from the best source the server has
 */
function apex_random_bytes($length) {
    if (function_exists('random_bytes')) {
        return random_bytes($length);
    }
    if (function_exists('openssl_random_pseudo_bytes')) {
        $strong = false;
        $bytes = openssl_random_pseudo_bytes($length, $strong);
        if ($bytes !== false && $strong) {
            return $bytes;
        }
    }
    send_json(array('error' => 'Server has no secure random source.'), 500);
}

/**
 * Password hashing: bcrypt (salted, slow). password_hash() on PHP 5.5+,
 * crypt() with a $2y$ salt on PHP 5.4 (Mercury).
 */
function apex_hash_password($plain) {
    if (function_exists('password_hash')) {
        return password_hash($plain, PASSWORD_BCRYPT);
    }
    $alphabet = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    $salt = '';
    $bytes = apex_random_bytes(22);
    for ($i = 0; $i < 22; $i++) {
        $salt .= $alphabet[ord($bytes[$i]) % 64];
    }
    return crypt($plain, '$2y$10$' . $salt);
}

/**
 * Verify against a bcrypt hash, or the old sha256$apexgrid$ hash (upgraded on login).
 */
function apex_verify_password($plain, $stored_hash) {
    if (substr($stored_hash, 0, 4) === '$2y$' || substr($stored_hash, 0, 4) === '$2a$') {
        return apex_safe_equals(crypt($plain, $stored_hash), $stored_hash);
    }
    if (substr($stored_hash, 0, 15) === 'sha256$apexgrid') {
        $expected = 'sha256$apexgrid$' . hash('sha256', 'apexgrid_salt:' . $plain);
        return apex_safe_equals($expected, $stored_hash);
    }
    return false;
}

/**
 * True when a stored hash should be replaced by a fresh bcrypt hash
 */
function apex_password_needs_upgrade($stored_hash) {
    return substr($stored_hash, 0, 4) !== '$2y$';
}

/**
 * Connect to FeeNIX MariaDB / MySQL via PDO
 */
function get_pdo() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    try {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8';
        $options = array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        );
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (Exception $e) {
        send_json(array(
            'error' => 'Database connection unavailable',
            'hint' => 'Check DB_HOST, DB_NAME, DB_USER and DB_PASS in api/config.local.php'
        ), 503);
    }
    return null;
}

/**
 * Parse JSON request body safely in PHP 5.4+
 */
function get_json_input() {
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return array();
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : array();
}
