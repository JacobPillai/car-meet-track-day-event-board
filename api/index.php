<?php
/**
 * ApexGrid — Main REST API Router & Controller (PHP 5.4 - 8.x Compatible)
 * Supports query-parameter routing (?endpoint=/events) so no custom .htaccess
 * RewriteBase is required on Swinburne's Mercury Web Server.
 */

require_once dirname(__FILE__) . '/config.php';
require_once dirname(__FILE__) . '/jwt.php';

$method = isset($_SERVER['REQUEST_METHOD']) ? strtoupper($_SERVER['REQUEST_METHOD']) : 'GET';

// Determine route path from ?endpoint=... or PATH_INFO
$endpoint = '';
if (isset($_GET['endpoint'])) {
    $endpoint = $_GET['endpoint'];
} elseif (isset($_SERVER['PATH_INFO'])) {
    $endpoint = $_SERVER['PATH_INFO'];
} else {
    $uri = isset($_SERVER['REQUEST_URI']) ? parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) : '/';
    $pos = strpos($uri, '/api');
    if ($pos !== false) {
        $endpoint = substr($uri, $pos + 4);
        $endpoint = str_replace('/index.php', '', $endpoint);
    }
}
$endpoint = '/' . trim($endpoint, '/');

$pdo = get_pdo();
$current_user = get_authenticated_user();
$input = get_json_input();

/**
 * Mask member-only fields (exact street address & organizer contact) for Guest users
 */
function format_event_row($row, $is_authenticated) {
    $row['id'] = (int)$row['id'];
    $row['category_id'] = (int)$row['category_id'];
    $row['club_id'] = $row['club_id'] ? (int)$row['club_id'] : null;
    $row['organizer_id'] = (int)$row['organizer_id'];
    $row['latitude'] = (float)$row['latitude'];
    $row['longitude'] = (float)$row['longitude'];
    $row['price'] = (float)$row['price'];
    $row['capacity'] = (int)$row['capacity'];
    $row['going_count'] = isset($row['going_count']) ? (int)$row['going_count'] : 0;
    $row['interested_count'] = isset($row['interested_count']) ? (int)$row['interested_count'] : 0;
    $row['likes_count'] = isset($row['likes_count']) ? (int)$row['likes_count'] : 0;
    $row['comments_count'] = isset($row['comments_count']) ? (int)$row['comments_count'] : 0;

    if (!$is_authenticated) {
        $row['address_locked'] = true;
        $row['address'] = 'Members Only — Log in to unlock exact paddock/street address';
        $row['organizer_contact'] = 'Members Only — Log in to view organizer contact details';
    } else {
        $row['address_locked'] = false;
    }
    return $row;
}

/**
 * Only the owner of a row (or an admin) may change or delete it.
 */
function require_owner_or_admin($auth, $owner_column_value) {
    if ($auth['role'] !== 'admin' && (int)$owner_column_value !== (int)$auth['id']) {
        send_json(array('error' => 'Forbidden: you can only change your own content.'), 403);
    }
}

function owner_of($pdo, $table, $column, $id) {
    $stmt = $pdo->prepare('SELECT ' . $column . ' FROM ' . $table . ' WHERE id = ?');
    $stmt->execute(array($id));
    $val = $stmt->fetchColumn();
    if ($val === false) {
        send_json(array('error' => 'Not found.'), 404);
    }
    return $val;
}

// ============================================================================
// 1. AUTH ENDPOINTS (/auth/register, /auth/login, /auth/me, /auth/profile)
// ============================================================================
if ($endpoint === '/auth/register' && $method === 'POST') {
    $name = isset($input['name']) ? trim($input['name']) : '';
    $email = isset($input['email']) ? strtolower(trim($input['email'])) : '';
    $password = isset($input['password']) ? $input['password'] : '';
    // Organizer access is granted by an admin unless ALLOW_ORGANIZER_SIGNUP is switched on.
    $role = 'member';
    if (isset($input['role']) && $input['role'] === 'organizer' && ALLOW_ORGANIZER_SIGNUP) {
        $role = 'organizer';
    }
    $region = isset($input['region']) ? trim($input['region']) : 'Australia';

    if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8 || strlen($password) > 72) {
        send_json(array('error' => 'Name, valid email, and password (8-72 chars) are required.'), 400);
    }
    if (strlen($name) > 120 || strlen($email) > 191) {
        send_json(array('error' => 'Name or email is too long.'), 400);
    }
    if (!in_array($region, array('Australia', 'Malaysia'), true)) {
        $region = 'Australia';
    }

    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute(array($email));
    if ($stmt->fetch()) {
        send_json(array('error' => 'An account with that email already exists.'), 409);
    }

    $hash = apex_hash_password($password);
    $now = date('Y-m-d H:i:s');
    $avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80';

    $ins = $pdo->prepare('INSERT INTO users (name, email, password_hash, role, avatar, region, bio, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    $ins->execute(array($name, $email, $hash, $role, $avatar, $region, 'Enthusiast member on ApexGrid.', $now));
    $user_id = (int)$pdo->lastInsertId();

    $user_data = array(
        'id' => $user_id,
        'name' => $name,
        'email' => $email,
        'role' => $role,
        'avatar' => $avatar,
        'region' => $region,
        'bio' => 'Enthusiast member on ApexGrid.'
    );
    $token = jwt_encode(array('id' => $user_id, 'email' => $email, 'role' => $role, 'name' => $name));
    send_json(array('token' => $token, 'user' => $user_data), 201);
}

if ($endpoint === '/auth/login' && $method === 'POST') {
    $email = isset($input['email']) ? strtolower(trim($input['email'])) : '';
    $password = isset($input['password']) ? $input['password'] : '';

    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';
    $window_start = date('Y-m-d H:i:s', time() - LOGIN_WINDOW_SECONDS);
    $pdo->prepare('DELETE FROM login_attempts WHERE attempted_at < ?')->execute(array($window_start));
    $count = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE email = ? AND ip = ? AND attempted_at >= ?');
    $count->execute(array($email, $ip, $window_start));
    if ((int)$count->fetchColumn() >= LOGIN_MAX_FAILURES) {
        send_json(array('error' => 'Too many failed sign-ins. Try again in a few minutes.'), 429);
    }

    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute(array($email));
    $user = $stmt->fetch();

    if (!$user || !apex_verify_password($password, $user['password_hash'])) {
        $pdo->prepare('INSERT INTO login_attempts (email, ip, attempted_at) VALUES (?, ?, ?)')
            ->execute(array($email, $ip, date('Y-m-d H:i:s')));
        send_json(array('error' => 'Invalid email or password.'), 401);
    }
    $pdo->prepare('DELETE FROM login_attempts WHERE email = ? AND ip = ?')->execute(array($email, $ip));

    if (apex_password_needs_upgrade($user['password_hash'])) {
        $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
            ->execute(array(apex_hash_password($password), $user['id']));
    }

    unset($user['password_hash']);
    $user['id'] = (int)$user['id'];
    $token = jwt_encode(array(
        'id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'name' => $user['name']
    ));
    send_json(array('token' => $token, 'user' => $user));
}

if ($endpoint === '/auth/me' && $method === 'GET') {
    $auth = require_auth();
    $stmt = $pdo->prepare('SELECT id, name, email, role, avatar, region, bio, created_at FROM users WHERE id = ?');
    $stmt->execute(array($auth['id']));
    $user = $stmt->fetch();
    if (!$user) {
        send_json(array('error' => 'User not found.'), 404);
    }
    $user['id'] = (int)$user['id'];
    send_json(array('user' => $user));
}

if ($endpoint === '/auth/profile' && $method === 'PUT') {
    $auth = require_auth();
    $name = isset($input['name']) ? trim($input['name']) : '';
    $region = isset($input['region']) ? trim($input['region']) : 'Australia';
    $bio = isset($input['bio']) ? trim($input['bio']) : '';
    $avatar = isset($input['avatar']) ? trim($input['avatar']) : '';

    if (!$name || strlen($name) > 120) {
        send_json(array('error' => 'Display name is required (max 120 chars).'), 400);
    }
    if (!in_array($region, array('Australia', 'Malaysia'), true)) {
        $region = 'Australia';
    }
    if ($avatar !== '' && (!preg_match('#^https?://#i', $avatar) || strlen($avatar) > 255)) {
        send_json(array('error' => 'Avatar must be an http(s) image URL (max 255 chars).'), 400);
    }

    $stmt = $pdo->prepare('UPDATE users SET name = ?, region = ?, bio = ?, avatar = ? WHERE id = ?');
    $stmt->execute(array($name, $region, $bio, $avatar, $auth['id']));

    $sel = $pdo->prepare('SELECT id, name, email, role, avatar, region, bio, created_at FROM users WHERE id = ?');
    $sel->execute(array($auth['id']));
    $updated = $sel->fetch();
    $updated['id'] = (int)$updated['id'];
    send_json(array('user' => $updated));
}

// ============================================================================
// 2. CATEGORIES ENDPOINT (/categories)
// ============================================================================
if ($endpoint === '/categories' && $method === 'GET') {
    $stmt = $pdo->query('SELECT * FROM categories ORDER BY id ASC');
    $rows = $stmt->fetchAll();
    send_json(array('data' => $rows));
}

// ============================================================================
// 3. EVENTS COLLECTION & CRUD (/events, /events/:id)
// ============================================================================
if ($endpoint === '/events' && $method === 'GET') {
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $category = isset($_GET['category']) ? trim($_GET['category']) : '';
    $region = isset($_GET['region']) ? trim($_GET['region']) : '';
    $status = isset($_GET['status']) ? trim($_GET['status']) : '';
    $date_from = isset($_GET['date_from']) ? trim($_GET['date_from']) : '';
    $max_price = isset($_GET['max_price']) && $_GET['max_price'] !== '' ? (float)$_GET['max_price'] : null;
    $sort = isset($_GET['sort']) ? trim($_GET['sort']) : 'date';
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? max(1, min(50, (int)$_GET['limit'])) : 6;

    $where = array('1=1');
    $params = array();

    if ($search !== '') {
        $where[] = '(e.title LIKE ? OR e.venue LIKE ? OR e.description LIKE ?)';
        $like = '%' . $search . '%';
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }
    if ($category !== '') {
        $where[] = '(c.slug = ? OR e.category_id = ?)';
        $params[] = $category;
        $params[] = (int)$category;
    }
    if ($region !== '' && strtolower($region) !== 'all') {
        $where[] = 'e.region = ?';
        $params[] = $region;
    }
    if ($status !== '' && strtolower($status) !== 'all') {
        $where[] = 'e.status = ?';
        $params[] = $status;
    }
    if ($date_from !== '') {
        $where[] = 'e.start_datetime >= ?';
        $params[] = $date_from . ' 00:00:00';
    }
    if ($max_price !== null) {
        $where[] = 'e.price <= ?';
        $params[] = $max_price;
    }

    $where_sql = implode(' AND ', $where);

    $order_sql = 'e.start_datetime ASC';
    if ($sort === 'popularity') {
        $order_sql = 'going_count DESC, likes_count DESC, e.start_datetime ASC';
    } elseif ($sort === 'price_asc') {
        $order_sql = 'e.price ASC, e.start_datetime ASC';
    }

    $count_stmt = $pdo->prepare("SELECT COUNT(*) FROM events e LEFT JOIN categories c ON e.category_id = c.id WHERE $where_sql");
    $count_stmt->execute($params);
    $total = (int)$count_stmt->fetchColumn();
    $total_pages = max(1, (int)ceil($total / $limit));
    $offset = ($page - 1) * $limit;

    $sql = "SELECT e.*, c.name AS category_name, c.slug AS category_slug, c.badge_color, c.icon AS category_icon,
                   cl.name AS club_name, u.name AS organizer_name,
                   (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'going') AS going_count,
                   (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'interested') AS interested_count,
                   (SELECT COUNT(*) FROM event_likes l WHERE l.event_id = e.id) AS likes_count,
                   (SELECT COUNT(*) FROM comments cm WHERE cm.event_id = e.id) AS comments_count
            FROM events e
            LEFT JOIN categories c ON e.category_id = c.id
            LEFT JOIN clubs cl ON e.club_id = cl.id
            LEFT JOIN users u ON e.organizer_id = u.id
            WHERE $where_sql
            ORDER BY $order_sql
            LIMIT $limit OFFSET $offset";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $formatted = array();
    foreach ($rows as $row) {
        $formatted[] = format_event_row($row, $current_user !== null);
    }

    send_json(array(
        'data' => $formatted,
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'total_pages' => $total_pages
    ));
}

if ($endpoint === '/events' && $method === 'POST') {
    $auth = require_auth(array('organizer', 'admin'));
    $now = date('Y-m-d H:i:s');

    $stmt = $pdo->prepare('INSERT INTO events (title, description, category_id, club_id, organizer_id, region, venue, address, organizer_contact, latitude, longitude, start_datetime, end_datetime, price, capacity, image, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute(array(
        isset($input['title']) ? $input['title'] : '',
        isset($input['description']) ? $input['description'] : '',
        isset($input['category_id']) ? (int)$input['category_id'] : 1,
        !empty($input['club_id']) ? (int)$input['club_id'] : null,
        $auth['id'],
        isset($input['region']) ? $input['region'] : 'Australia',
        isset($input['venue']) ? $input['venue'] : '',
        isset($input['address']) ? $input['address'] : '',
        isset($input['organizer_contact']) ? $input['organizer_contact'] : '',
        isset($input['latitude']) ? (float)$input['latitude'] : -37.8136,
        isset($input['longitude']) ? (float)$input['longitude'] : 144.9631,
        isset($input['start_datetime']) ? $input['start_datetime'] : $now,
        isset($input['end_datetime']) ? $input['end_datetime'] : $now,
        isset($input['price']) ? (float)$input['price'] : 0,
        isset($input['capacity']) ? (int)$input['capacity'] : 50,
        isset($input['image']) ? $input['image'] : '',
        isset($input['status']) ? $input['status'] : 'upcoming',
        $now
    ));
    $id = (int)$pdo->lastInsertId();
    send_json(array('id' => $id, 'message' => 'Event created successfully.'), 201);
}

// Match /events/:id
if (preg_match('#^/events/(\d+)$#', $endpoint, $m)) {
    $event_id = (int)$m[1];

    if ($method === 'GET') {
        $sql = "SELECT e.*, c.name AS category_name, c.slug AS category_slug, c.badge_color, c.icon AS category_icon,
                       cl.name AS club_name, u.name AS organizer_name,
                       (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'going') AS going_count,
                       (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'interested') AS interested_count,
                       (SELECT COUNT(*) FROM event_likes l WHERE l.event_id = e.id) AS likes_count,
                       (SELECT COUNT(*) FROM comments cm WHERE cm.event_id = e.id) AS comments_count
                FROM events e
                LEFT JOIN categories c ON e.category_id = c.id
                LEFT JOIN clubs cl ON e.club_id = cl.id
                LEFT JOIN users u ON e.organizer_id = u.id
                WHERE e.id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array($event_id));
        $row = $stmt->fetch();
        if (!$row) {
            send_json(array('error' => 'Event not found.'), 404);
        }
        send_json(array('data' => format_event_row($row, $current_user !== null)));
    }

    if ($method === 'PUT') {
        $auth = require_auth(array('organizer', 'admin'));
        require_owner_or_admin($auth, owner_of($pdo, 'events', 'organizer_id', $event_id));
        $stmt = $pdo->prepare('UPDATE events SET title=?, description=?, category_id=?, club_id=?, region=?, venue=?, address=?, organizer_contact=?, latitude=?, longitude=?, start_datetime=?, end_datetime=?, price=?, capacity=?, image=?, status=? WHERE id=?');
        $stmt->execute(array(
            $input['title'],
            $input['description'],
            (int)$input['category_id'],
            !empty($input['club_id']) ? (int)$input['club_id'] : null,
            $input['region'],
            $input['venue'],
            $input['address'],
            $input['organizer_contact'],
            (float)$input['latitude'],
            (float)$input['longitude'],
            $input['start_datetime'],
            $input['end_datetime'],
            (float)$input['price'],
            (int)$input['capacity'],
            $input['image'],
            $input['status'],
            $event_id
        ));
        send_json(array('message' => 'Event updated successfully.'));
    }

    if ($method === 'DELETE') {
        $auth = require_auth(array('organizer', 'admin'));
        require_owner_or_admin($auth, owner_of($pdo, 'events', 'organizer_id', $event_id));
        $stmt = $pdo->prepare('DELETE FROM events WHERE id = ?');
        $stmt->execute(array($event_id));
        send_json(array('message' => 'Event deleted successfully.'));
    }
}

// ============================================================================
// 4. RSVP, LIKE & COMMENTS ENDPOINTS
// ============================================================================
if (preg_match('#^/events/(\d+)/rsvp$#', $endpoint, $m)) {
    $auth = require_auth();
    $event_id = (int)$m[1];

    if ($method === 'POST') {
        $status = isset($input['status']) && $input['status'] === 'interested' ? 'interested' : 'going';
        $now = date('Y-m-d H:i:s');
        $del = $pdo->prepare('DELETE FROM rsvps WHERE event_id = ? AND user_id = ?');
        $del->execute(array($event_id, $auth['id']));
        $ins = $pdo->prepare('INSERT INTO rsvps (event_id, user_id, status, created_at) VALUES (?, ?, ?, ?)');
        $ins->execute(array($event_id, $auth['id'], $status, $now));
        send_json(array('status' => $status, 'message' => 'RSVP updated.'));
    }
    if ($method === 'DELETE') {
        $del = $pdo->prepare('DELETE FROM rsvps WHERE event_id = ? AND user_id = ?');
        $del->execute(array($event_id, $auth['id']));
        send_json(array('status' => null, 'message' => 'RSVP removed.'));
    }
}

if ($endpoint === '/users/me/rsvps' && $method === 'GET') {
    $auth = require_auth();
    $stmt = $pdo->prepare('SELECT event_id, status, created_at FROM rsvps WHERE user_id = ?');
    $stmt->execute(array($auth['id']));
    $rsvps = $stmt->fetchAll();

    $l_stmt = $pdo->prepare('SELECT event_id FROM event_likes WHERE user_id = ?');
    $l_stmt->execute(array($auth['id']));
    $likes = $l_stmt->fetchAll();

    send_json(array('rsvps' => $rsvps, 'likes' => $likes));
}

if (preg_match('#^/events/(\d+)/like$#', $endpoint, $m)) {
    $auth = require_auth();
    $event_id = (int)$m[1];

    if ($method === 'POST') {
        $now = date('Y-m-d H:i:s');
        $del = $pdo->prepare('DELETE FROM event_likes WHERE event_id = ? AND user_id = ?');
        $del->execute(array($event_id, $auth['id']));
        $ins = $pdo->prepare('INSERT INTO event_likes (event_id, user_id, created_at) VALUES (?, ?, ?)');
        $ins->execute(array($event_id, $auth['id'], $now));
        send_json(array('liked' => true));
    }
    if ($method === 'DELETE') {
        $del = $pdo->prepare('DELETE FROM event_likes WHERE event_id = ? AND user_id = ?');
        $del->execute(array($event_id, $auth['id']));
        send_json(array('liked' => false));
    }
}

if (preg_match('#^/events/(\d+)/comments$#', $endpoint, $m)) {
    $event_id = (int)$m[1];

    if ($method === 'GET') {
        $stmt = $pdo->prepare('SELECT cm.*, u.name AS user_name, u.avatar AS user_avatar, u.role AS user_role FROM comments cm LEFT JOIN users u ON cm.user_id = u.id WHERE cm.event_id = ? ORDER BY cm.created_at DESC');
        $stmt->execute(array($event_id));
        send_json(array('data' => $stmt->fetchAll()));
    }
    if ($method === 'POST') {
        $auth = require_auth();
        $body = isset($input['body']) ? trim($input['body']) : '';
        $rating = isset($input['rating']) && $input['rating'] ? (int)$input['rating'] : null;
        if (!$body) {
            send_json(array('error' => 'Comment body is required.'), 400);
        }
        $now = date('Y-m-d H:i:s');
        $ins = $pdo->prepare('INSERT INTO comments (event_id, user_id, body, rating, created_at) VALUES (?, ?, ?, ?, ?)');
        $ins->execute(array($event_id, $auth['id'], $body, $rating, $now));
        send_json(array('id' => (int)$pdo->lastInsertId(), 'message' => 'Comment posted.'), 201);
    }
}

if (preg_match('#^/comments/(\d+)$#', $endpoint, $m) && $method === 'DELETE') {
    $auth = require_auth();
    $comment_id = (int)$m[1];
    require_owner_or_admin($auth, owner_of($pdo, 'comments', 'user_id', $comment_id));
    $stmt = $pdo->prepare('DELETE FROM comments WHERE id = ?');
    $stmt->execute(array($comment_id));
    send_json(array('message' => 'Comment deleted.'));
}

// ============================================================================
// 5. CLUBS ENDPOINTS (/clubs, /clubs/:id)
// ============================================================================
if ($endpoint === '/clubs' && $method === 'GET') {
    $sql = "SELECT cl.*, u.name AS owner_name,
                   (SELECT COUNT(*) FROM events e WHERE e.club_id = cl.id) AS events_count
            FROM clubs cl
            LEFT JOIN users u ON cl.owner_id = u.id
            ORDER BY cl.id ASC";
    $stmt = $pdo->query($sql);
    send_json(array('data' => $stmt->fetchAll()));
}

if ($endpoint === '/clubs' && $method === 'POST') {
    $auth = require_auth(array('organizer', 'admin'));
    $now = date('Y-m-d H:i:s');
    $ins = $pdo->prepare('INSERT INTO clubs (name, description, logo, region, city, founded_year, owner_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    $ins->execute(array(
        $input['name'],
        $input['description'],
        isset($input['logo']) ? $input['logo'] : '',
        isset($input['region']) ? $input['region'] : 'Australia',
        isset($input['city']) ? $input['city'] : 'Melbourne, VIC',
        isset($input['founded_year']) ? (int)$input['founded_year'] : 2024,
        $auth['id'],
        $now
    ));
    send_json(array('id' => (int)$pdo->lastInsertId(), 'message' => 'Club created.'), 201);
}

if (preg_match('#^/clubs/(\d+)$#', $endpoint, $m)) {
    $club_id = (int)$m[1];
    if ($method === 'GET') {
        $stmt = $pdo->prepare('SELECT cl.*, u.name AS owner_name FROM clubs cl LEFT JOIN users u ON cl.owner_id = u.id WHERE cl.id = ?');
        $stmt->execute(array($club_id));
        $club = $stmt->fetch();
        if (!$club) {
            send_json(array('error' => 'Club not found.'), 404);
        }
        send_json(array('data' => $club));
    }
    if ($method === 'PUT') {
        $auth = require_auth(array('organizer', 'admin'));
        require_owner_or_admin($auth, owner_of($pdo, 'clubs', 'owner_id', $club_id));
        $stmt = $pdo->prepare('UPDATE clubs SET name=?, description=?, logo=?, region=?, city=?, founded_year=? WHERE id=?');
        $stmt->execute(array(
            $input['name'],
            $input['description'],
            $input['logo'],
            $input['region'],
            $input['city'],
            (int)$input['founded_year'],
            $club_id
        ));
        send_json(array('message' => 'Club updated.'));
    }
    if ($method === 'DELETE') {
        $auth = require_auth(array('organizer', 'admin'));
        require_owner_or_admin($auth, owner_of($pdo, 'clubs', 'owner_id', $club_id));
        $stmt = $pdo->prepare('DELETE FROM clubs WHERE id = ?');
        $stmt->execute(array($club_id));
        send_json(array('message' => 'Club deleted.'));
    }
}

// ============================================================================
// 6. ORGANIZER ANALYTICS DASHBOARD (/dashboard/stats) & ADMIN (/admin/users)
// ============================================================================
if ($endpoint === '/dashboard/stats' && $method === 'GET') {
    $auth = require_auth(array('organizer', 'admin'));
    $stmt = $pdo->query("SELECT e.id, e.title, e.start_datetime, e.capacity, e.status, c.name AS category_name,
                                (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'going') AS going_count,
                                (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'interested') AS interested_count,
                                (SELECT COUNT(*) FROM event_likes l WHERE l.event_id = e.id) AS likes_count
                         FROM events e
                         LEFT JOIN categories c ON e.category_id = c.id
                         ORDER BY e.start_datetime ASC");
    send_json(array('events' => $stmt->fetchAll()));
}

if ($endpoint === '/admin/users' && $method === 'GET') {
    $auth = require_auth(array('admin'));
    $stmt = $pdo->query('SELECT id, name, email, role, avatar, region, bio, created_at FROM users ORDER BY id ASC');
    send_json(array('data' => $stmt->fetchAll()));
}

if (preg_match('#^/admin/users/(\d+)/role$#', $endpoint, $m) && $method === 'PUT') {
    $auth = require_auth(array('admin'));
    $user_id = (int)$m[1];
    $role = isset($input['role']) ? $input['role'] : '';
    if (!in_array($role, array('member', 'organizer', 'admin'), true)) {
        send_json(array('error' => 'Role must be member, organizer or admin.'), 400);
    }
    if ($user_id === (int)$auth['id'] && $role !== 'admin') {
        send_json(array('error' => 'You cannot remove your own admin role.'), 400);
    }
    $stmt = $pdo->prepare('UPDATE users SET role = ? WHERE id = ?');
    $stmt->execute(array($role, $user_id));
    send_json(array('message' => 'User role updated.'));
}

if (preg_match('#^/admin/users/(\d+)$#', $endpoint, $m) && $method === 'DELETE') {
    $auth = require_auth(array('admin'));
    $user_id = (int)$m[1];
    if ($user_id === (int)$auth['id']) {
        send_json(array('error' => 'You cannot delete your own account here.'), 400);
    }
    $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute(array($user_id));
    send_json(array('message' => 'User deleted.'));
}

send_json(array('error' => 'Endpoint not found: ' . $endpoint), 404);
