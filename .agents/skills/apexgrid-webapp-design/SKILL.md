---
name: apexgrid-webapp-design
description: >-
  Use this skill when designing, extending, styling, or debugging the ApexGrid
  full-stack Vue 3 web application in D:\ApexGrid, or when applying its
  editorial automotive UI/UX design system, Dual-Mode PHP 5.4/MySQL + LocalDB
  architecture, Hybrid OAuth 2.0 + JWT auth, and zero-key external REST APIs.
---

# ApexGrid Web App Design & Full-Stack Architecture Skill

## 1. Visual & UI/UX Design System
- **Aesthetic Direction:** Editorial, community-first automotive platform paired with motorsport telemetry precision.
- **Typography (Google Fonts + Offline Workbox Cache):**
  - Headings & Display: `'Space Grotesk', system-ui, sans-serif` (bold `600`/`700`, tight tracking `-0.04em` to `-0.055em`).
  - Body Copy & Forms: `'Inter', system-ui, sans-serif` (high legibility, `line-height: 1.7–1.8`).
  - Telemetry, Coordinates, Timers & Prices: `'JetBrains Mono', monospace` with `font-variant-numeric: tabular-nums`.
- **Theme Tokens (`data-bs-theme="dark"` & `"light"`):**
  - Dark Palette: Carbon/Obsidian surfaces (`#101110`, `#171917`, `#181a19`, `#222523`), warm off-white text (`#f3f0e9` / `#f4f2eb`), muted stone (`#b3b5ac`), subtle borders (`#343731`), and terracotta/crimson accent (`#ed7059` / `#ff775f` / `#bb3827`).
  - Light Palette ("Daylight Paddock"): Warm alabaster surfaces (`#f4f1ea` / `#f7f6f2`), deep charcoal text (`#1c211d`), high-contrast rust accent (`#a52e20` / `#ae3d29`) meeting WCAG 2.1 AA/AAA contrast ratios.
- **Form & Accessibility Patterns (WCAG 2.1 AA):**
  - Place instructional hints (`class="auth-hint"` / `field-hint`) permanently *above* inputs and link them via `aria-describedby`.
  - Use CSS `:user-invalid` and `:user-valid` instead of premature red borders before user interaction.
  - Ensure all interactive buttons, links, and inputs maintain `min-height: 44px` (`48px` on auth/detail controls) and visible `:focus-visible` outlines (`outline: 3px solid var(--scene-accent); outline-offset: 4px`).
  - Respect `@media (prefers-reduced-motion: reduce)` across all transitions and carousels.

## 2. Database & Dual-Mode Backend Architecture
- **Database Compatibility (MySQL 5.7/8.0 & Swinburne FeeNIX MariaDB 5.5):**
  - Schema (`database/schema.sql`) and seed data (`database/seed.sql`) define 7 relational tables (`users`, `clubs`, `categories`, `events`, `rsvps`, `event_likes`, `comments`).
  - Unique indexed string columns use `VARCHAR(191)` (`CHARSET=utf8 COLLATE=utf8_general_ci`) to stay under MariaDB 5.5's 767-byte InnoDB index prefix limit.
  - Timestamps use explicit `DATETIME` columns instead of multiple `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` columns (avoids MariaDB 5.5 Error 1293).
- **PHP 5.4+ REST API (`api/config.php`, `api/jwt.php`, `api/index.php`):**
  - Uses query-parameter routing (`api/index.php?endpoint=/events`) so no `.htaccess` `RewriteBase` is needed on Swinburne Mercury (`feenix.swin.edu.au`).
  - Enforces `ini_set('memory_limit', '16M')` and avoids PHP 7+ syntax (no `??`, no scalar type hints) so it runs on PHP 5.4 through PHP 8.x.
- **Dual-Mode Client (`src/services/api.js` + `src/services/localDb.js`):**
  - Automatically targets `./api/index.php` on Mercury (`*.swin.edu.au`) or when `VITE_USE_PHP_API=true`, and transparently falls back to `localDb.js` (`localStorage` key `apexgrid_db_v1`) during local Vite development or offline sessions.
  - Whenever adding or modifying a database field or endpoint, update `database/schema.sql`, `database/seed.sql`, `src/data/seedData.js`, `api/index.php`, and `src/services/localDb.js` in lockstep.

## 3. Hybrid OAuth 2.0 + Stateless HMAC-SHA256 JWT Auth
- **Endpoints:** `POST /auth/login`, `POST /auth/register`, `POST /auth/oauth`, `GET /auth/me`, `PUT /auth/profile`.
- **OAuth Component (`src/components/OAuthSocialPanel.vue`):**
  - Provides Google, GitHub, and Discord OAuth 2.0 sign-in with an accessible Account Picker modal (`role="dialog"`, `aria-modal="true"`) that exchanges OAuth grants via `POST /auth/oauth` (`authStore.loginWithOAuth()`), linking `oauth_provider` and `oauth_id` in `users` and issuing an HMAC-SHA256 JWT.

## 4. Zero-Key External REST APIs (`src/services/externalApis.js`)
1. **Open-Meteo Weather Telemetry (`fetchCircuitWeather`):** Queries `https://api.open-meteo.com/v1/forecast` using event `latitude`/`longitude` for live ambient temp, estimated asphalt temp, rain probability, wind speed, and tire advice on `EventDetailView.vue`.
2. **OpenStreetMap Nominatim Geocoding (`searchVenueGeocode`, `reverseGeocodeCoords`):** Queries `https://nominatim.openstreetmap.org` for live venue search and map-pin reverse geocoding on `EventFormView.vue`.
3. **NHTSA vPIC Vehicle Lookup (`fetchVehicleModelsForMake`):** Queries `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/{make}?format=json` for verified car make/model selection on `ProfileView.vue` and `RegisterView.vue`.

## 5. Verification Workflow
1. Run `npm run test` in `D:\ApexGrid` to verify all 17 Vitest spec files (293 unit tests).
2. Run `npm run build` in `D:\ApexGrid` to verify Vite + Workbox PWA compilation (`dist/sw.js` and `dist/manifest.webmanifest`).
