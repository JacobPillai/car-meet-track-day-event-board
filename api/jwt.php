
<?php

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    $remainder = strlen($data) % 4;

    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }

    return base64_decode(strtr($data, '-_', '+/'), true);
}

function jwt_encode($payload, $secret = JWT_SECRET) {
    $header = array(
        'typ' => 'JWT',
        'alg' => 'HS256'
    );

    if (!isset($payload['iat'])) {
        $payload['iat'] = time();
    }

    if (!isset($payload['exp'])) {
        $payload['exp'] = time() + (60 * 60 * 24 * 7);
    }

    $segments = array();
    $segments[] = base64url_encode(json_encode($header));
    $segments[] = base64url_encode(json_encode($payload));

    $signing_input = implode('.', $segments);

    $signature = hash_hmac(
        'sha256',
        $signing_input,
        $secret,
        true
    );

    $segments[] = base64url_encode($signature);

    return implode('.', $segments);
}

function jwt_decode($token, $secret = JWT_SECRET) {
    if (!is_string($token) || $token === '') {
        return null;
    }

    $parts = explode('.', $token);

    if (count($parts) !== 3) {
        return null;
    }

    $header_json = base64url_decode($parts[0]);
    $payload_json = base64url_decode($parts[1]);

    if ($header_json === false || $payload_json === false) {
        return null;
    }

    $header = json_decode($header_json, true);
    $payload = json_decode($payload_json, true);

    if (!is_array($header) ||
        !isset($header['alg']) ||
        $header['alg'] !== 'HS256') {
        return null;
    }

    if (!is_array($payload)) {
        return null;
    }

    $signing_input = $parts[0] . '.' . $parts[1];

    $expected_sig = base64url_encode(
        hash_hmac('sha256', $signing_input, $secret, true)
    );

    if (!function_exists('hash_equals') ||
        !hash_equals($expected_sig, $parts[2])) {
        return null;
    }

    if (!isset($payload['exp']) ||
        !is_numeric($payload['exp']) ||
        (int)$payload['exp'] <= time()) {
        return null;
    }

    if (!isset($payload['id']) ||
        !isset($payload['role'])) {
        return null;
    }

    return $payload;
}

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

    if (preg_match(
        '/^Bearer\s+(\S+)$/i',
        trim($auth_header),
        $matches
    )) {
        return $matches[1];
    }

    return null;
}

function get_authenticated_user() {
    $token = get_bearer_token();

    if (!$token) {
        return null;
    }

    return jwt_decode($token);
}

function require_auth($allowed_roles = array()) {
    $user = get_authenticated_user();

    if (!$user) {
        send_json(
            array('error' => 'Authentication required. Please log in.'),
            401
        );
    }

    if (!empty($allowed_roles) &&
        !in_array($user['role'], $allowed_roles, true)) {
        send_json(
            array('error' => 'Forbidden: insufficient role permissions.'),
            403
        );
    }

    return $user;
}
