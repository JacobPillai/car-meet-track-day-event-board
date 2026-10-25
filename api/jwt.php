<?php
/**
 * ApexGrid — Pure PHP 5.4+ HMAC-SHA256 JWT Implementation (Syed's Auth Module)
 * Zero external Composer dependencies required for Mercury deployment.
 */

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $padlen = 4 - $remainder;
        $data .= str_repeat('=', $padlen);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_require_secret($secret) {
    if (!is_string($secret) || strlen($secret) < 32) {
        send_json(array('error' => 'Server is not configured: set JWT_SECRET (32+ random characters) in api/config.local.php.'), 500);
    }
}

function jwt_encode($payload, $secret = JWT_SECRET) {
    jwt_require_secret($secret);
    $header = array('typ' => 'JWT', 'alg' => 'HS256');
    if (!isset($payload['iat'])) {
        $payload['iat'] = time();
    }
    if (!isset($payload['exp'])) {
        $payload['exp'] = time() + (60 * 60 * 24); // 1 day
    }
    $segments = array();
    $segments[] = base64url_encode(json_encode($header));
    $segments[] = base64url_encode(json_encode($payload));
    $signing_input = implode('.', $segments);
    $signature = hash_hmac('sha256', $signing_input, $secret, true);
    $segments[] = base64url_encode($signature);
    return implode('.', $segments);
}

function jwt_decode($token, $secret = JWT_SECRET) {
    jwt_require_secret($secret);
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    $header = json_decode(base64url_decode($parts[0]), true);
    if (!is_array($header) || !isset($header['alg']) || $header['alg'] !== 'HS256') {
        return null;
    }
    $header_b64 = $parts[0];
    $payload_b64 = $parts[1];
    $sig_b64 = $parts[2];

    $signing_input = $header_b64 . '.' . $payload_b64;
    $expected_sig = base64url_encode(hash_hmac('sha256', $signing_input, $secret, true));

    if (!apex_safe_equals($sig_b64, $expected_sig)) {
        return null;
    }

    $payload = json_decode(base64url_decode($payload_b64), true);
    if (!is_array($payload)) {
        return null;
    }
    if (!isset($payload['exp']) || $payload['exp'] < time()) {
        return null;
    }
    return $payload;
}

/**
 * Extract bearer token from Authorization header on Apache / Mercury
 */
function get_bearer_token() {
    $auth_header = '';
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $auth_header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['Authorization'])) {
            $auth_header = $headers['Authorization'];
        } elseif (isset($headers['authorization'])) {
            $auth_header = $headers['authorization'];
        }
    }
    if ($auth_header && preg_match('/Bearer\s+(\S+)/i', $auth_header, $matches)) {
        return $matches[1];
    }
    return null;
}

/**
 * Returns the signed-in user, or null for a Guest.
 * The token only proves identity; role and existence are read fresh from the
 * database, so a demoted or deleted account loses access straight away.
 */
function get_authenticated_user() {
    static $cached = false;
    if ($cached !== false) {
        return $cached;
    }
    $cached = null;
    $token = get_bearer_token();
    if (!$token) {
        return null;
    }
    $payload = jwt_decode($token);
    if (!$payload || !isset($payload['id'])) {
        return null;
    }
    $stmt = get_pdo()->prepare('SELECT id, name, email, role FROM users WHERE id = ?');
    $stmt->execute(array((int)$payload['id']));
    $row = $stmt->fetch();
    if (!$row) {
        return null;
    }
    $row['id'] = (int)$row['id'];
    $cached = $row;
    return $cached;
}

/**
 * Require authentication and optionally specific roles
 */
function require_auth($allowed_roles = array()) {
    $user = get_authenticated_user();
    if (!$user) {
        send_json(array('error' => 'Authentication required. Please log in.'), 401);
    }
    if (!empty($allowed_roles) && !in_array($user['role'], $allowed_roles, true)) {
        send_json(array('error' => 'Forbidden: insufficient role permissions.'), 403);
    }
    return $user;
}
