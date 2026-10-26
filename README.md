# ApexGrid — Car Meet & Track-Day Event Board (`COS30043`)

Full-stack **Car Meet, Drift, Drag & Track-Day Event Board** built with **Vue 3 (`<script setup>`), Vite, Vue Router 4, Pinia, Bootstrap 5.3, Leaflet, FullCalendar, Chart.js, Vite PWA, Vitest, and PHP + MySQL/MariaDB** for Swinburne University's **COS30043 (Interface Design and Development)** group project.

---

## Table of Contents

1. [Project Overview & COS30043 Rubric Alignment](#1-project-overview--cos30043-rubric-alignment)
2. [Quick Start & Commands](#2-quick-start--commands)
3. [Seeded Accounts & Role-Isolated Portals](#3-seeded-accounts--role-isolated-portals)
4. [Complete 13 Pages & Route Architecture](#4-complete-13-pages--route-architecture)
5. [4-Member Team Split & Week 12 Interview Guide](#5-4-member-team-split--week-12-interview-guide)
6. [Database Schema (7 Tables) & REST API Specification](#6-database-schema-7-tables--rest-api-specification)
7. [Unexpected Errors, Technical Challenges & Troubleshooting Log](#7-unexpected-errors-technical-challenges--troubleshooting-log)
8. [Key Lessons Learned (Project Report Takeaways)](#8-key-lessons-learned-project-report-takeaways)
9. [Swinburne Mercury Deployment Guide (`mercury.swin.edu.au`)](#9-swinburne-mercury-deployment-guide-mercuryswineduau)

---

## 1. Project Overview & COS30043 Rubric Alignment

**ApexGrid** connects motorsport enthusiasts, car clubs, and track-day organizers across **Australia (Melbourne / Victoria)** and **Malaysia (Sepang / Kuching / Klang Valley)**.

| COS30043 Requirement | How ApexGrid Implements It |
| :--- | :--- |
| **Collection + Detail Pages** | Paginated Events Board (`/events`), Event Telemetry & Detail (`/events/:id`), Verified Clubs Directory (`/clubs`), and Club Profile (`/clubs/:id`). |
| **Search, Filter & Sort** | Search by keyword/venue/club; filter by discipline (`Track Day`, `Drift`, `Meet`, `Drag`, `Cruise`, `Show`), region (`Australia`, `Malaysia`, `All`), status (`upcoming`, `completed`), start date, and max price; sort by **date**, **popularity** (RSVPs + likes), **price**, or **GPS distance** (Haversine formula). |
| **Authentication & Role Visibility** | Guests browse public event summaries. Logged-in **Members** unlock exact paddock/street addresses and direct organizer phone/email contacts, RSVP, like, and post comments/ratings. |
| **Authorised CRUD** | **Organizers** create, edit, cancel, and delete events (`/events/new`, `/events/:id/edit`, `/dashboard`) and manage clubs. **Admins** moderate all users, roles, events, and comments (`/admin`). |
| **Social Interaction** | `Going` and `Interested` RSVPs with live capacity progress bars, event likes (`♥`), discussion comments, and 1–5 star ratings on completed past events. |
| **Pagination & Validated Forms** | Server/engine-backed `{ data, page, limit, total, total_pages }` pagination (`PaginationBar.vue`) and accessible post-interaction HTML5 + `:user-invalid`/`:user-valid` forms (`LoginView`, `RegisterView`, `EventFormView`, `ClubsListView`, `ProfileView`). |
| **WCAG 2.1 AA Accessibility** | Skip-to-main-content link, persistent **Dark Carbon / Light Mode** toggle (`data-bs-theme`), semantic landmarks, explicit `<label>` + `aria-describedby` + `aria-errormessage` bindings, and automatic `aria-invalid` synchronization. |

---

## 2. Quick Start & Commands

```powershell
cd D:\ApexGrid

# 1. Install dependencies
npm install

# 2. Start local development server (http://localhost:5173/)
npm run dev

# 3. Run automated Vitest unit & component tests
npm run test

# 4. Build static production bundle + PWA Service Worker for Swinburne Mercury
npm run build

# 5. Preview the production PWA + Service Worker locally (http://127.0.0.1:4173/)
npx vite preview --port 4173 --host 127.0.0.1
```

> **PWA & D/HD Interview Guide:** See **[`docs/PWA_AND_DHD_INTERVIEW_GUIDE.md`](docs/PWA_AND_DHD_INTERVIEW_GUIDE.md)** for the full walkthrough of the PWA Service Worker, Offline Saved Events Vault, D/HD Interest Registration text (`docs/ApexGrid_DHD_Interest_Registration.docx`), and live demonstration script.

---

> **Security update:** passwords are bcrypt, secrets live in `api/config.local.php`, and PHP mode never falls back to localStorage. Setup steps and the full list of fixes: [`docs/SECURITY_AND_CHANGES.md`](docs/SECURITY_AND_CHANGES.md).

## 3. Seeded Accounts & Role-Isolated Portals

Password for all seeded accounts: **`Password123!`**

| Role | Email | Dedicated Landing Portal | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Guest** | *(Unauthenticated)* | `/login` & `/register` | Browse public pages; exact gate address & organizer contact on `/events/:id` are masked behind a lock banner. |
| **Member (AU)** | `member@apexgrid.com` | `/my-events` & `/profile` | Unlocks exact gate addresses & contacts; RSVP (`going`/`interested`), like, comment/rate, & pin events into the **Offline PWA Vault**. |
| **Member (MY)** | `amirul@apexgrid.com` | `/my-events` & `/profile` | Malaysian member account defaulted to Malaysia region hub. |
| **Organizer (AU)** | `organizer@apexgrid.com` | `/dashboard` & `/events/new` | Host/edit/cancel events, manage Australian clubs (`VicTimeAttack`, `Docklands JDM`, `Calder Drift`), and view **Chart.js Analytics**. |
| **Organizer (MY)** | `naveed@apexgrid.com` | `/dashboard` & `/events/new` | Host/edit/cancel events and manage Malaysian clubs (`Sepang Night Attack`, `Borneo Touge`, `Klang Valley Midnight Runners`). |
| **Admin** | `admin@apexgrid.com` | `/admin` | Promote/demote user roles (`member` / `organizer` / `admin`), delete accounts, override any event status, and delete policy-violating reviews. |

---

## 4. Complete 13 Pages & Route Architecture

| # | Page | Route (`#/path`) | Component | Access Guard |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Home (Hero search, stats, featured AU/MY events) | `/` | `src/views/HomeView.vue` | Public |
| 2 | Events Board (Search, filter, sort, pagination) | `/events` | `src/views/EventsListView.vue` | Public |
| 3 | Event Detail (Map, RSVP, comments, member lock) | `/events/:id` | `src/views/EventDetailView.vue` | Public *(Address/Contact gated)* |
| 4 | Interactive Map & Calendar Explorer | `/explore` | `src/views/ExploreView.vue` | Public |
| 5 | Verified Clubs & Organizers List | `/clubs` | `src/views/ClubsListView.vue` | Public |
| 6 | Club Detail & Hosted Events | `/clubs/:id` | `src/views/ClubDetailView.vue` | Public |
| 7 | Sign In | `/login` | `src/views/LoginView.vue` | `meta.guestOnly` |
| 8 | Register Account (`Member` or `Organizer`) | `/register` | `src/views/RegisterView.vue` | `meta.guestOnly` |
| 9 | Driver Profile & Regional Settings | `/profile` | `src/views/ProfileView.vue` | `meta.requiresAuth` |
| 10 | My RSVPs, Likes & Offline PWA Vault | `/my-events` | `src/views/MyEventsView.vue` | `meta.requiresAuth` |
| 11 | Create / Edit Event (with Map Coordinate Picker) | `/events/new`, `/events/:id/edit` | `src/views/EventFormView.vue` | `roles: ['organizer', 'admin']` |
| 12 | Organizer Analytics Dashboard (Chart.js) | `/dashboard` | `src/views/OrganizerDashboardView.vue` | `roles: ['organizer', 'admin']` |
| 13 | Admin Moderation & Role Control Panel | `/admin` | `src/views/AdminPanelView.vue` | `roles: ['admin']` |

---

## 5. 4-Member Team Split & Week 12 Interview Guide

Each team member owns a distinct core layer and a **Vue-integrated advanced feature** not taught in standard lectures:

| Member | Role | Interview Content & Advanced Features | Files to Demonstrate in Interview |
| :--- | :--- | :--- | :--- |
| **Jacob (You)** | Full-Stack Lead | • **Vite PWA & Workbox runtime** (`vite-plugin-pwa`, Web Manifest, Service Worker caching OSM tiles & Google Fonts)<br>• **Offline saved events** (`useOfflineEvents.js`, Offline Vault tab, live `navigator.onLine` status)<br>• **Dual-mode REST API client** (`api.js` + `localDb.js` with automatic PHP/MySQL vs localStorage routing)<br>• **Design decision** (finalized and discussed with everyone — both initial F1 Telemetry HUD and Community-First Automotive Editorial UI)<br>• **Setup basics files for database MySQL configuration** (`api/config.php`, `api/config.local.example.php`, PDO connection helpers)<br>• **API and Namespace Keys for service** (`.env.local`, `.env.test`, EmailJS & testmail.app integration in `emailService.js`)<br>• **Images for the app** (`public/meet-hero.jpg`, SVG icons, curated Unsplash automotive photography across `seedData.js`) | `vite.config.js`, `src/composables/useOfflineEvents.js`, `src/services/api.js`, `src/services/emailService.js`, `api/config.php`, `DESIGN_BRIEF.md`, `CREDITS.md` |
| **Syed** | Backend & State Lead | • **PHP 5.4+ PDO REST API & 23 Endpoints** (`api/index.php` zero-mod_rewrite query dispatcher)<br>• **MySQL / MariaDB 5.5 8-Table Relational Schema** (`database/schema.sql` & `seed.sql` with `VARCHAR(191)` 767-byte index compatibility)<br>• **Pure-PHP HMAC-SHA256 JWT Authentication & Bcrypt Security** (`api/jwt.php`, constant-time signature check, database role re-verification, `login_attempts` brute-force rate limiting)<br>• **Pinia Persisted Global State Stores** (`authStore.js`, `eventStore.js`, `themeStore.js`)<br>• **Vue Router Role-Based Navigation Guards** (`router.beforeEach` enforcing `requiresAuth`, `guestOnly`, and role hierarchy + server-side Guest vs Member address/contact masking) | `src/stores/authStore.js`, `src/stores/eventStore.js`, `src/router/index.js`, `api/jwt.php`, `api/index.php`, `database/schema.sql` |
| **Naveed** | Frontend & Geospatial | • **Interactive Leaflet.js 1.9 Map Engine** (`EventMap.vue` with OpenStreetMap raster tiles and custom discipline-colored HTML/SVG `L.divIcon` markers solving Vite asset bundling issues)<br>• **Cross-Border APAC Regional Switcher** (Quick-jump `map.flyTo()` controls for `All`, `Australia / VIC`, `Malaysia / Sepang & Sarawak`, `Kuching`, and `Sepang` with reduced-motion support)<br>• **Interactive Map Coordinate Picker & Nominatim Geocoding** (`@pick-coordinates` click-to-pick in `EventFormView.vue` paired with OpenStreetMap Nominatim forward/reverse geocoding in `externalApis.js`)<br>• **FullCalendar v6 Schedule Explorer** (`EventCalendar.vue` toggling between `dayGridMonth` Month Grid and `listMonth` Chronological Track Schedule with direct event routing)<br>• **Haversine Great-Circle GPS Distance Calculator** (Client & API distance sorting in km from user browser Geolocation or Melbourne/Sepang hubs) | `src/views/ExploreView.vue`, `src/components/EventMap.vue`, `src/components/EventCalendar.vue`, `src/views/EventFormView.vue`, `src/services/externalApis.js` |
| **Gibson** | QA & Analytics Lead | • **Organizer Analytics Dashboard (`vue-chartjs` + `Chart.js 4`)** (`OrganizerDashboardView.vue` connected to `GET /dashboard/stats`)<br>• **3 Reactive Telemetry Visualizations:** (1) Cumulative RSVPs Over Time Line Chart, (2) Going vs Interested & Likes Grouped Bar Chart, and (3) Event Discipline Distribution Doughnut Chart<br>• **KPI Summary & Capacity Utilization Tracking** (Live attendance progress bars, capacity thresholds, and organizer event management table)<br>• **Comprehensive Vitest & Vue Test Utils Automated QA Suite** (297 passing unit & component tests across 17 spec files covering stores, API client, offline vault, map, calendar, navbar, forms, and views)<br>• **WCAG 2.1 AA Accessibility & Usability Verification** (Post-interaction `:user-invalid`/`:user-valid` form validation, `aria-describedby`/`aria-invalid` bindings, keyboard roving tabindex, and `prefers-reduced-motion` compliance) | `src/views/OrganizerDashboardView.vue`, `tests/unit/AboutView.spec.js`, `tests/unit/EventCard.spec.js`, `tests/unit/Navbar.spec.js`, `tests/unit/authStore.spec.js`, `tests/unit/api.spec.js` |

---

## 6. Database Schema (8 Tables) & REST API Specification

### MySQL / MariaDB Tables (`database/schema.sql`)
1. `users` (`id`, `name`, `email` UNIQUE, `password_hash`, `role` ENUM('member','organizer','admin'), `avatar`, `region`, `bio`, `created_at`)
2. `clubs` (`id`, `name`, `description`, `logo`, `region`, `city`, `founded_year`, `owner_id` FK $\rightarrow$ `users.id`, `created_at`)
3. `categories` (`id`, `name`, `slug` UNIQUE, `badge_color`, `icon`)
4. `events` (`id`, `title`, `description`, `category_id` FK, `club_id` FK, `organizer_id` FK, `region`, `venue`, `address`, `organizer_contact`, `latitude`, `longitude`, `start_datetime`, `end_datetime`, `price`, `capacity`, `image`, `status`, `created_at`)
5. `rsvps` (`id`, `event_id` FK, `user_id` FK, `status` ENUM('going','interested'), `created_at`, `UNIQUE(event_id, user_id)`)
6. `event_likes` (`id`, `event_id` FK, `user_id` FK, `created_at`, `UNIQUE(event_id, user_id)`)
7. `comments` (`id`, `event_id` FK, `user_id` FK, `body`, `rating` TINYINT NULL, `created_at`)
8. `login_attempts` (`id`, `email`, `ip`, `attempted_at`) — failed-login throttle

### REST API Endpoints (`api/index.php` & `src/services/localDb.js`)
- **Auth:** `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/profile`
- **Categories:** `GET /categories`
- **Events:** `GET /events?search=&category=&region=&status=&date_from=&max_price=&sort=&page=&limit=`, `GET /events/:id`, `POST /events`, `PUT /events/:id`, `DELETE /events/:id`
- **RSVPs & Likes:** `POST /events/:id/rsvp`, `DELETE /events/:id/rsvp`, `GET /users/me/rsvps`, `POST /events/:id/like`, `DELETE /events/:id/like`
- **Comments & Ratings:** `GET /events/:id/comments`, `POST /events/:id/comments`, `DELETE /comments/:id`
- **Clubs:** `GET /clubs`, `GET /clubs/:id`, `POST /clubs`, `PUT /clubs/:id`, `DELETE /clubs/:id`
- **Analytics & Admin:** `GET /dashboard/stats`, `GET /admin/users`, `PUT /admin/users/:id/role`, `DELETE /admin/users/:id`, `GET /admin/moderation`

---

## 7. Unexpected Errors, Technical Challenges & Troubleshooting Log

This section documents real issues encountered during development and testing, their root causes, and how they were resolved (useful for the **COS30043 Project Report & QA Bug Log**):

### Issue #1: Local Dev Server `HTTP 404` on `http://localhost:5173/`
- **Symptom:** Opening `http://localhost:5173/` in Chrome displayed `This localhost page can't be found (HTTP ERROR 404)`, and the Vite terminal logged:
  `(!) Could not auto-determine entry point from rollupOptions or html files and there are no explicit optimizeDeps.include patterns.`
- **Root Cause (Two-fold):**
  1. Running `npm run dev -- --port 5173` in Windows PowerShell caused `npm`/PowerShell argument parsing to strip `--port` and execute `vite 5173`. Because Vite's CLI signature is `vite [root]`, Vite treated `5173` as a subfolder path (`D:\ApexGrid\5173\index.html`), which did not exist.
  2. Setting `base: './'` statically in `vite.config.js` is intended for production subfolder builds (like Swinburne Mercury), but in Vite's dev server it can prevent root `/` URL matching.
- **Resolution:**
  - Updated `vite.config.js` to use a conditional function configuration:
    ```js
    export default defineConfig(({ command }) => ({
      base: command === 'build' ? './' : '/',
      server: { port: 5173, host: true },
      // ...
    }))
    ```
  - Started the server cleanly via `npm run dev` (with no positional arguments), immediately restoring `HTTP 200 OK` on `http://localhost:5173/`.

### Issue #2: Swinburne Mercury Web Server Legacy PHP 5.4 Constraints
- **Symptom / Discovery:** Reviewing the official [FeeNIX Mercury Web Server documentation](https://feenix.swin.edu.au/help/?page=Mercury%20Web%20Server) revealed that Mercury runs **PHP 5.4** with a strict memory cap (`memory_limit`) and no support for Node.js/Python daemons.
- **Root Cause:** Modern PHP 7/8 syntax—such as the null-coalescing operator (`$a ?? $b`), scalar/return type hints (`function foo(string $x): array`), `random_bytes()`, and even `password_hash()` (which was introduced in PHP 5.5)—throws immediate **Fatal Parse / Undefined Function Errors** on PHP 5.4.
- **Resolution:**
  - Engineered `api/config.php`, `api/jwt.php`, and `api/index.php` using strict **PHP 5.4–8.x cross-compatible syntax** (`isset($x) ? $x : $default`, `array(...)`).
  - Added `ini_set('memory_limit', '16M');` at the top of `api/config.php` as recommended by FeeNIX.
  - Implemented portable password helpers (`apex_hash_password()` / `apex_verify_password()`: bcrypt via `crypt()` with a `$2y$` salt when `password_hash()` is missing) and a pure-PHP HMAC-SHA256 JWT encoder/decoder (`jwt.php`) with zero Composer dependencies. See `docs/SECURITY_AND_CHANGES.md`.

### Issue #3: Swinburne FeeNIX MariaDB 5.5 Schema Limitations (`feenix-mariadb.swin.edu.au`)
- **Symptom / Discovery:** FeeNIX runs **MariaDB 5.5**, which enforces two strict legacy limits compared to modern MySQL 8:
  1. `Specified key was too long; max key length is 767 bytes` when indexing `VARCHAR(255)` columns with `UNIQUE` constraints.
  2. `Error 1293: Incorrect table definition; there can be only one TIMESTAMP column with CURRENT_TIMESTAMP` if multiple timestamp columns use automatic defaults.
- **Resolution:**
  - Used `VARCHAR(191)` on all `UNIQUE` indexed string columns (`users.email`, `categories.slug`) with `CHARSET=utf8 COLLATE=utf8_general_ci`.
  - Used explicit `DATETIME` columns populated by the API (`date('Y-m-d H:i:s')`) so `database/schema.sql` and `database/seed.sql` import into `feenix-mariadb-web.swin.edu.au` (phpMyAdmin) with zero errors.

### Issue #4: Apache Alias, `.htaccess` `403 Forbidden`, and `RewriteBase` on Mercury
- **Symptom / Discovery:** On Mercury, student directories are mounted via an Apache Alias (`/cos30043/s[StudentID]/`) and rely on an auto-generated root `.htaccess` containing `SSLRequireSSL` and `require ldap-user`. Overwriting `.htaccess` for Vue Router HTML5 history mode or REST API URL rewriting often causes `403 Forbidden` or `500 Internal Server Error`.
- **Resolution:**
  - Configured Vue Router with `createWebHashHistory()` (`#/events`, `#/dashboard`) so browser refreshes never hit Apache for virtual paths.
  - Designed `api/index.php` to accept query-parameter routing (`api/index.php?endpoint=/events`), eliminating the need for custom `mod_rewrite` `RewriteBase` rules.

### Issue #5: Local Team Development Without Local XAMPP / MySQL Installed
- **Symptom:** Team machines had Node.js (`v22.11.0`) installed for Vite, but did not have `php` or `mysql` installed in `PATH`—which would normally block frontend/QA teammates from testing API-driven pages locally.
- **Resolution:**
  - Built a **Dual-Mode API Architecture** (`src/services/api.js` + `src/services/localDb.js`). When running on Mercury (`mercury.swin.edu.au`) or when `VITE_USE_PHP_API=true` is set, requests hit `api/index.php`. During plain local `npm run dev` (no `VITE_USE_PHP_API`), `api.js` executes the exact same REST endpoints, JWT checks, Guest/Member masking, Haversine distance math, and pagination against a `localStorage`-backed relational database pre-loaded from `src/data/seedData.js`.

### Issue #6: Leaflet Marker Icon Broken Images in Bundled Builds
- **Symptom:** Standard Leaflet `L.marker()` default PNG icons often break after `vite build` when deployed to a subdirectory like Mercury because Vite rewrites asset paths.
- **Resolution:**
  - Built custom `L.divIcon` HTML/CSS circular badges in `src/components/EventMap.vue` color-coded by motorsport discipline (`Track Day`, `Drift`, `Meet`, `Drag`, `Cruise`, `Show`) and tagged with `AU`/`MY`, ensuring 100% reliable rendering online and offline.

### Issue #7: Installed PWA Serving Cached Bundles After Source Edits & Offline Event Emulation
- **Symptom:** After updating team member attributions in `src/views/AboutView.vue`, opening the installed PWA or a localhost port with a previously registered Service Worker continued rendering the older cached `AboutView.vue` bundle. Additionally, synthetic `window.dispatchEvent(new Event('offline'))` checks did not flip `isOnline` when `navigator.onLine` remained `true`.
- **Root Cause:**
  1. Workbox's navigation route (`createHandlerBoundToURL("index.html")`) serves the precached `dist/index.html` and hashed JS bundle first while checking for updates in the background, and any lingering Service Worker on `localhost:5173` intercepted `npm run dev` requests.
  2. `updateOnlineStatus()` in `useOfflineEvents.js` previously read `navigator.onLine` without inspecting the dispatched `Event.type`.
- **Resolution:**
  - Updated `src/main.js` to automatically unregister stale Service Workers when `import.meta.env.DEV` is true, and added a `controllerchange` listener + `reg.update()` check in production builds so updated bundles reload automatically once the new Service Worker activates.
  - Updated `updateOnlineStatus(event)` in `src/composables/useOfflineEvents.js` to handle `event?.type === 'offline'` and `event?.type === 'online'` alongside `navigator.onLine`.

---

## 8. Key Lessons Learned (Project Report Takeaways)

1. **Design for the Target Deployment Environment Early:** Investigating Swinburne's FeeNIX Mercury specifications (PHP 5.4, MariaDB 5.5, Apache Alias directory structure, and static `dist/` hosting) before writing backend code prevented major last-minute deployment rewrites.
2. **Decouple Frontend Progress from Backend Infrastructure:** Providing a stateful local API engine (`localDb.js`) mirroring the exact REST contract (`{ data, page, total_pages }`) allowed Frontend, QA, and Full-Stack tasks to proceed in parallel without waiting on VPN or database provisioning.
3. **Progressive Enhancement & Offline Resilience:** Using `vite-plugin-pwa` with runtime caching for OpenStreetMap tiles plus an explicit "Offline Saved Events Vault" (`useOfflineEvents.js`) solves a genuine real-world problem for drivers attending remote circuits (such as Winton or Phillip Island) where mobile reception is weak.
4. **Accessible Form Validation UX:** Applying modern CSS `:user-invalid` and `:user-valid` selectors alongside hints placed *above* inputs and synchronized `aria-invalid` attributes avoids overwhelming users with red errors before they finish typing while maintaining full screen-reader accessibility.
5. **Role-Isolated UX Improves Security & Clarity:** Enforcing role permissions at three levels—(a) UI navigation visibility (`Navbar.vue`), (b) Vue Router navigation guards (`router/index.js`), and (c) backend JWT/role verification (`api/jwt.php` & `api/index.php`)—ensures Guest, Member, Organizer, and Admin boundaries are never bypassed.

---

## 9. Swinburne Mercury Deployment Guide (`mercury.swin.edu.au`)

1. **Import the Database (`feenix-mariadb-web.swin.edu.au`):**
   - Connect to Swinburne VPN (if off-campus) and open `http://feenix-mariadb-web.swin.edu.au`.
   - Select your database (e.g., `s[StudentID]_db`) and import `database/schema.sql`, then `database/seed.sql`.
   - Create `api/config.local.php` on the server (copy `api/config.local.example.php`) with your FeeNIX credentials and a random `JWT_SECRET`. It is git-ignored, so create it by hand.
2. **Build the Production Bundle:**
   - Run `npm run build` in `D:\ApexGrid`.
3. **Upload via WinSCP / SFTP:**
   - Connect to `mercury.swin.edu.au` and navigate to `/home/students/accounts/s[StudentID]/cos30043/www/htdocs/`.
   - Upload **all files inside `dist/`** (`index.html`, `manifest.webmanifest`, `sw.js`, `registerSW.js`, `assets/`, etc.) and the **`api/` directory**.
   - **Never upload `node_modules/`.**
4. **Verify File Permissions (`chmod`):**
   - Ensure `.htaccess` and static files are readable by Apache:
     ```bash
     chmod o+r /home/students/accounts/s[StudentID]/cos30043/www/htdocs/.htaccess
     chmod -R 755 /home/students/accounts/s[StudentID]/cos30043/www/htdocs/api
     ```
5. **Access Your Live Application:**
   - Visit `https://mercury.swin.edu.au/cos30043/s[StudentID]/`

---

## 10. v2.0 UI/UX Redesign — "F1 Telemetry HUD & Night-Run Carbon"

To transform **ApexGrid** from a standard Bootstrap layout into a realistic **Motorsport Telemetry & Event Platform**, a full visual and interaction redesign was executed with zero server-side dependencies:

1. **Custom Motorsport Typography & Tabular Telemetry (`index.html` & `src/style.css`):**
   - Paired **`Space Grotesk`** (display headings), **`Inter`** (body copy), and **`JetBrains Mono`** (`font-variant-numeric: tabular-nums`) so countdowns, prices (`A$245.00` / `RM 180.00`), GPS coordinates, and RSVP capacities align like a race timing board.
   - Added Workbox runtime caching in `vite.config.js` (`google-fonts-stylesheets` & `google-fonts-webfonts`) so custom typography renders offline inside the PWA.
2. **Glassmorphic Sticky Header, Racing Kerb Strip & Mobile Bottom App Dock (`Navbar.vue`):**
   - Added a signature red-and-white racing kerb top border (`.apex-kerb-strip`), translucent backdrop blur (`backdrop-filter: blur(16px)`), a live pulsing PWA status dot (`.live-dot`), a **`Ctrl+K` Command Search Palette** (`CommandSearchModal.vue`), and a **Mobile Bottom Navigation Dock** (`d-lg-none fixed-bottom`) for native-app ergonomics on smartphones.
3. **Interactive Hero Spotlight Carousel & Live Lights-Out Countdown (`HomeView.vue`):**
   - Replaced the static hero card with an interactive **Featured Event Spotlight Carousel** featuring a live ticking `DD : HH : MM : SS` countdown timer, accessible Prev/Next & Pause/Play controls, Cross-Border Motorsport Hub cards (Victoria AU vs Sepang/Sarawak MY), and all **6 Verified Clubs**.
4. **High-Craft Event Cards, Shimmer Skeletons & Run-Sheet Timeline (`EventCard.vue`, `SkeletonCard.vue`, `EventDetailView.vue`):**
   - Added floating calendar ticket badges (`OCT 24`), image zoom on hover, `Selling Fast` urgency indicators when capacity exceeds 75%, shimmer skeleton loaders (`SkeletonCard.vue`), a structured **Official Run-Sheet & Session Schedule** timeline on event detail pages, and 1-click clipboard copy buttons for unlocked member gate addresses and GPS coordinates.
5. **Split-Screen Auth Portals & Reactive Toast Stack (`LoginView.vue`, `RegisterView.vue`, `ToastContainer.vue`):**
   - Redesigned `/login` and `/register` into a split-screen motorsport telemetry layout with 1-click test credential fill pills and a global floating glassmorphic toast notification system (`useToast.js`).

---

## 11. Sources, Media Credits & Open-Source Attributions

For full academic documentation—including every npm library version and license, Google Fonts SIL OFL credits, UI/UX design inspirations (Formula 1® Timing App, MotorsportReg, Porsche Track Precision, Luma), **every direct Unsplash photography URL and ID**, and Swinburne FeeNIX references—see **[`CREDITS.md`](./CREDITS.md)** or click the **"Sources & Credits"** button in the application footer.

