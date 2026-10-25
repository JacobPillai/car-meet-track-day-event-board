<?php
/**
 * Copy this file to api/config.local.php (git-ignored) and fill in real values.
 * Never commit config.local.php.
 */
define('DB_HOST', 'localhost');            // Mercury: feenix-mariadb.swin.edu.au
define('DB_NAME', 'apexgrid');
define('DB_USER', 'root');
define('DB_PASS', '');
// 32+ random characters. Make one with: php -r "echo bin2hex(random_bytes(32));"
define('JWT_SECRET', '');
// Browser origins allowed to call the API cross-site (same-origin needs none)
define('ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173');
// true = Organizer can be chosen at sign-up. false = admin promotes (safer).
define('ALLOW_ORGANIZER_SIGNUP', false);
// Social sign-in: 'off' | 'google' (real, verified) | 'demo' (simulated buttons, never for admins)
define('OAUTH_MODE', 'off');
define('GOOGLE_CLIENT_ID', '');
