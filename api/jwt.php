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

function jwt_encode($payload, $secret = JWT_SECRET) {
    $header = array('typ' => 'JWT', 'alg' => 'HS256');
    if (!isset($payload['iat'])) {
        $payload['iat'] = time();
    }
    if (!isset($payload['exp'])) {
        $payload['exp'] = time() + (60 * 60 * 24 * 7); // 7 days
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
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    $header_b64 = $parts[0];
    $payload_b64 = $parts[1];
    $sig_b64 = $parts[2];

    $signing_input = $header_b64 . '.' . $payload_b64;
    $expected_sig = base64url_encode(hash_hmac('sha256', $signing_input, $secret, true));

    if ($sig_b64 !== $expected_sig) {
        return null;
    }

    $payload = json_decode(base64url_decode($payload_b64), true);
    if (!is_array($payload)) {
        return null;
    }
    if (isset($payload['exp']) && $payload['exp'] < time()) {
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
 * Returns decoded user payload or null if Guest
 */
function get_authenticated_user() {
    $token = get_bearer_token();
    if (!$token) {
        return null;
    }
    return jwt_decode($token);
}

/**
 * Require authentication and optionally specific roles
 */
function require_auth($allowed_roles = array()) {
    $user = get_authenticated_user();
    if (!$user) {
        send_json(array('error' => 'Authentication required. Please log in.'), 401);
    }
    if (!empty($allowed_roles) && !in_array($user['role'], $allowed_roles)) {
        send_json(array('error' => 'Forbidden: insufficient role permissions.'), 403);
    }
    return $user;
}
