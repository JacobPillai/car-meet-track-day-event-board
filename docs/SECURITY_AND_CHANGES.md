# Security Hardening & Change Log (Oct 2026)

What changed after the first full review, why, and how to run it.

## 1. Setup (local MySQL and Mercury)

1. Copy `api/config.local.example.php` to `api/config.local.php` (git-ignored, never commit it).
2. Fill in `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`.
3. Set `JWT_SECRET` to 32+ random characters: `php -r "echo bin2hex(random_bytes(32));"`.
4. Import `database/schema.sql`, then `database/seed.sql` (re-import: the schema gained a table and the seed now holds bcrypt hashes).
5. Local dev with MySQL:
   ```bash
   php -S localhost:8000 -t .      # terminal 1, from the project root
   # .env.local:  VITE_USE_PHP_API=true
   npm run dev                     # terminal 2, Vite proxies /api to PHP
   ```
6. Mercury: upload `dist/` and `api/`, and create `api/config.local.php` on the server by hand (it is not in git).
   Mercury runs PHP 5.4, so the code uses `crypt()` with a `$2y$` bcrypt salt when `password_hash()` is missing.

If `JWT_SECRET` is missing or short the API answers `500 Server is not configured` on purpose.

## 2. Fixes

| # | Risk found | Fix | Files |
|---|---|---|---|
| 1 | One fast SHA-256 for passwords | bcrypt. Old `sha256$apexgrid$` hashes still verify and upgrade to bcrypt on login | `api/config.php`, `database/seed.sql` |
| 2 | Backdoor passwords (`Password123!` / `password` for any seeded hash; any account in local mode) | Removed | `api/config.php`, `src/services/localDb.js` |
| 3 | Hardcoded JWT secret and student ID in the repo | Settings come from git-ignored `config.local.php` or env vars. No default secret | `api/config.php`, `.gitignore` |
| 4 | Weak JWT checks | Only `HS256`, constant-time signature compare, `exp` required, 1 day lifetime, secret length check | `api/jwt.php` |
| 5 | Role trusted from the token for 7 days | User and role are re-read from the database on every request, so demoted or deleted users lose access at once | `api/jwt.php` |
| 6 | Any organizer could edit or delete any event or club; any user could delete any comment | Owner or admin only (`require_owner_or_admin`) | `api/index.php` |
| 7 | Admin could demote or delete self, and set any role string | Role must be member, organizer or admin. Self demote and self delete blocked | `api/index.php` |
| 8 | No brute-force protection | 5 failed logins per email + IP in 15 minutes gives `429`. Uses new `login_attempts` table | `api/index.php`, `database/schema.sql` |
| 9 | `Access-Control-Allow-Origin: *` | Allow-list (`ALLOWED_ORIGINS`), plus `nosniff` | `api/config.php` |
| 10 | Thin input checks | Email format, name length, region list, avatar must be http(s), password 8-72 chars. DB error text no longer sent to browsers | `api/index.php`, `api/config.php` |
| 11 | Anyone could sign up as Organizer | Off by default: everyone starts as Member and an admin promotes them (`ALLOW_ORGANIZER_SIGNUP`). The form shows a notice | `api/config.php`, `api/index.php`, `RegisterView.vue` |
| 12 | App silently used localStorage when PHP failed, so data never reached MySQL | In PHP mode (Mercury or `VITE_USE_PHP_API=true`) errors are shown. Only offline GETs read the local copy. 4 new tests | `src/services/api.js`, `tests/unit/api.spec.js` |
| 13 | Password minimum 6 on server but 8 in the form | Server and local engine now require 8 | `api/index.php`, `localDb.js` |
| 14 | **Teammate's `/auth/oauth` endpoint (merged from main) let anyone sign in as any account**, including admin, by posting that email (no provider check) | Off by default (`OAUTH_MODE`). `google` mode checks the id_token with Google and your `GOOGLE_CLIENT_ID`. `demo` mode (the simulated buttons) never signs into admins, only creates Members, and social accounts get an unguessable password | `api/index.php`, `api/config.php` |

## 3. Social sign-in (OAuth) settings

Set in `api/config.local.php`:

| `OAUTH_MODE` | Meaning |
|---|---|
| `'off'` (default) | `/auth/oauth` answers 501. The social buttons will show an error against PHP. |
| `'demo'` | The simulated Google/GitHub/Discord buttons work for the classroom demo. Admin accounts are refused. Use only for the demo. |
| `'google'` | Real Google sign-in. Needs `GOOGLE_CLIENT_ID`. The server verifies the id_token with Google. |

For the Mercury demo video use `'demo'`, and switch back to `'off'` afterwards.
With plain `npm run dev` (no PHP) the browser-only engine simulates it, same as before.

## 4. Known limits (accepted)

- **Local mode is a demo stand-in.** With plain `npm run dev` (no PHP) the "database" and tokens live in the browser's `localStorage`. Tokens there are not signed. It is for UI work only and never runs on Mercury.
- **Login throttle is per email + IP**, so a shared school network can share a lockout. The window is short (15 minutes).
- **Login page still accepts 6+ chars** so old accounts can sign in. New passwords need 8.
- **Seed accounts all share `Password123!`.** Change them before any public deployment.
- Rotate any key you pasted into a screenshot or chat (EmailJS private key, testmail key).

## 5. Responsive check

Loaded at 375, 768 and 1366 px (public pages plus logged-in admin, dashboard, event form): no horizontal scroll. Phone layout uses the hamburger menu and a bottom nav bar, and the footer stacks into one column.

## 6. Tests

`npm test` runs 297 tests (including 4 for the strict API client).
