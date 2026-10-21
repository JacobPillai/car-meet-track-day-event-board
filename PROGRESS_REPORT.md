# ApexGrid — COS30043 Requirement Fulfillment & Project Progress Report

**Project:** **ApexGrid** — Car Meet, Drift, Drag & Track-Day Event Board (`D:\ApexGrid`)  
**Unit:** COS30043 — Interface Design and Development (Swinburne University of Technology)  
**Team Members (4-Person Group):**
- **Jacob Pillai (You — Full-Stack Lead):** API integration, Social interactions (RSVP / Likes / Comments & Ratings), PWA (`vite-plugin-pwa`, offline saved events vault, service worker caching), v2.0 Telemetry UI Redesign
- **Syed (Backend & State/Auth Lead):** MySQL/MariaDB 7-table schema, PHP 5.4+ REST API + JWT HMAC-SHA256 authentication, Pinia persisted stores (`authStore`, `eventStore`, `themeStore`), Vue Router RBAC navigation guards
- **Naveed (Frontend & Geo/Time Lead):** Responsive Bootstrap 5 layout, reusable components, Interactive Map (`Leaflet` + OpenStreetMap tiles) & Schedule Calendar (`FullCalendar`) on `/explore`, Haversine distance sorting
- **Gibson (QA & Analytics Lead):** Organizer Analytics Dashboard (`Chart.js` + `vue-chartjs`) on `/dashboard`, Automated Unit/Component Test Suite (`Vitest` + `@vue/test-utils`)

**Report Generated:** 19 October 2026  
**Last Updated:** 21 October 2026

**Current Verified Status:** **14 view components; 194/194 automated tests passing across 12 spec files; production build and PWA generation passing.** Homepage/shared-card, Browse Events, Event Detail, Explore, and navbar redesigns implemented. Desktop dark-theme homepage/listing approval and guest detail/Explore screenshot reviews are recorded; responsive/light-theme and interactive QA remain open, including the new navbar. Footer was not changed in the navbar slice. Deployment and end-to-end PHP/MariaDB behavior have not been verified in this continuation.

The previous **96% complete**, **13 views**, and **7/7 tests** headline is superseded by this checkpoint. No new completion percentage is assigned: passing unit tests and a build do not establish deployment readiness, accessibility conformance, or complete browser workflow coverage.

---

## 1. Executive Summary: What Is Completed vs. What Is Still Needed

The core application is largely implemented. The latest automated suite and production build pass, but live deployment, browser workflows, and accessibility still need their own verification. Earlier feature-matrix entries describe implementation status, not a fresh end-to-end audit or a guarantee of academic marks. Remaining work falls into three categories:

1. **Design Continuation & Browser QA:**
   - **Completed baseline polish:** Club deletion UI, the About route, custom `v-focus` directive, and expanded testing were already recorded as completed in Phase A; they are no longer pending tasks.
   - **Homepage + shared cards:** Implemented before this continuation; the user reports homepage implementation/testing complete. Existing work was preserved.
   - **Browse Events:** Redesigned to match the community-first direction in `DESIGN_BRIEF.md`. Eight new regression tests pass. Desktop/mobile, both themes, and keyboard/native-control visual review remain pending.
   - **Event Detail:** Implemented at the user's request to continue to the next page. Twenty-eight regression tests pass; RSVP, likes, comments/ratings, protected details, map, management, and offline saving retained. See Section 4.4. Listing review was not performed or assumed complete.
   - **Explore:** Redesigned at the user's explicit request; map/calendar/combined modes, regional/category filters, marker/list preview, and calendar/detail links retained. Added 45 tests across Explore, map, and calendar. See Section 4.6.
   - **Navbar:** Redesigned separately at the user's explicit approval, using the supplied pill-navigation references. Forty-five new tests cover routing, role visibility, menus/focus, search, theme, and connectivity. Footer remains untouched. See Section 4.7.
   - **Next action:** Review navbar desktop/mobile, both themes, role-specific menu and dock behavior. Confirm footer as the next separate slice afterward. Keep earlier page QA open. Operational monitoring remains unscoped and must not be confused with organizer engagement analytics.
   - **Asset/accessibility evidence:** Verify homepage image licensing/attribution and complete rendered accessibility checks; these were not established by the latest test/build run.

2. **Infrastructure & Live Deployment Tasks (Manual Action Required):**
   - **Repository synchronization (`JacobPillai/car-meet-track-day-event-board`):** The working tree contains modified and untracked redesign files. Remote synchronization and authentication status were not verified. Review changes before any commit or push; neither was performed in this continuation.
   - **Live Swinburne Mercury & FeeNIX MariaDB Deployment:** Importing `database/schema.sql` and `database/seed.sql` into `feenix-mariadb-web.swin.edu.au`, updating `api/config.php` with your Swinburne `s[StudentID]` database credentials, and uploading `dist/` + `api/` to `/home/students/accounts/s[StudentID]/cos30043/www/htdocs/`.

3. **Academic Submission & Week 12 Interview Deliverables (Non-Code Tasks):**
   - **Single-Take 5–10 Minute Group Demo Video** (with equal speaking time across Jacob, Syed, Naveed, and Gibson).
   - **COS30043 Written Group Report** (incorporating `README.md`, `CREDITS.md`, Gibson's QA test/bug log, WCAG 2.1 AA audit screenshots, and future scalability section).

---

## 2. Detailed Rubric-by-Rubric Requirement Matrix

### 2.1 Functional Requirements Audit

| Rubric Requirement | Spec Details | Implementation Status | Key Files | What Is Still Needed? |
| :--- | :--- | :--- | :--- | :--- |
| **Collection + Detail Pages** | Events list, Event detail, Organizer/Club list, Club detail | ✅ **100% Done** | `EventsListView.vue`, `EventDetailView.vue`, `ClubsListView.vue`, `ClubDetailView.vue` | Club deletion UI, Browse Events, and Event Detail redesigns are implemented; listing/detail rendered review pending. |
| **Search, Filter & Sort** | Search by keyword/location; filter by type (`Meet`, `Drift`, `Track Day`, `Drag`, `Cruise`, `Show`), region (`AU`/`MY`), date, and max price; sort by `date`, `popularity`, or `distance` (Haversine GPS) | ✅ **100% Done** | `EventsListView.vue`, `CommandSearchModal.vue` (`Ctrl+K`), `api/index.php`, `localDb.js` | Fully implemented. |
| **Auth with Different Visibility** | Guests browse public info. Members RSVP, comment, and unlock exact paddock gate address & direct organizer contact info | ✅ **100% Done** | `EventDetailView.vue`, `api/index.php`, `localDb.js` | Fully implemented (includes both UI lock card for Guests and backend JSON masking + 1-click clipboard copy for Members). |
| **CRUD for Authorised Users** | Organizers create, edit, and cancel events (`upcoming`, `completed`, `cancelled`) and create/edit clubs. Admin moderates users, roles, events, and comments | ✅ **Implemented; live verification pending** | `EventFormView.vue`, `OrganizerDashboardView.vue`, `ClubsListView.vue`, `ClubDetailView.vue`, `AdminPanelView.vue` | Club deletion UI includes confirmation, API call, and toast feedback. Recheck authorized/unauthorized CRUD against the deployed backend. |
| **Social Interaction** | Like/unlike events, RSVP (`going` / `interested` / cancel), live capacity progress bar, comments, and 1–5 star ratings on past events | ✅ **100% Done** | `EventCard.vue`, `EventDetailView.vue`, `MyEventsView.vue` | Fully implemented. |
| **Pagination & Validated Forms** | Server/API-paginated event list (`{ data, page, total_pages }`), validated event submission form, validated registration & login forms | ✅ **100% Done** | `PaginationBar.vue`, `EventFormView.vue`, `RegisterView.vue`, `LoginView.vue` | Fully implemented using WCAG-compliant hints above inputs and CSS `:user-invalid` / `:user-valid`. |
| **10+ Pages** | Public discovery, account, event/club, organizer, admin, and About pages | ✅ **14 view components / 15 named routes** | `src/router/index.js`, `src/views/` | `/about` is implemented. Create/Edit Event share one view; route and component counts are intentionally different. |

---

### 2.2 Advanced Features Audit (4-Person Team Split — Week 12 Interview)

Each team member is required to demonstrate and explain an advanced Vue-related feature using techniques beyond basic classroom labs:

| Team Member | Assigned Advanced Feature | Status | Implemented Capabilities | Any Remaining Work? |
| :--- | :--- | :--- | :--- | :--- |
| **1. Jacob (You)** | **Progressive Web App (PWA) & Offline Vault** (`vite-plugin-pwa` + `useOfflineEvents.js`) | ✅ **100% Done** | • Auto-updating Service Worker (`sw.js`) & `manifest.webmanifest`<br>• Workbox runtime caching for OpenStreetMap tiles & Google Fonts<br>• Explicit **"Save for Offline"** pin toggle on every Event Card & Detail page<br>• Dedicated **Offline Saved Vault** tab in `/my-events` that works with zero internet<br>• Live Online/Offline telemetry indicator in Navbar | Practice demonstrating DevTools $\rightarrow$ Network $\rightarrow$ **Offline** mode for the video & interview. |
| **2. Syed** | **Pinia Persisted State + JWT Auth & Vue Router Navigation Guards** | ✅ **100% Done** | • 3 Pinia stores (`authStore`, `eventStore`, `themeStore`) with persisted state; `eventStore` uses localStorage loading and a watcher, not `pinia-plugin-persistedstate`<br>• Pure-PHP HMAC-SHA256 JWT (`api/jwt.php`) + `Authorization: Bearer` interceptor<br>• Global `router.beforeEach` guard enforcing `requiresAuth`, `guestOnly`, and `roles` (`member`, `organizer`, `admin`) | Update `JWT_SECRET` and MariaDB credentials in `api/config.php` when deploying to Swinburne Mercury. |
| **3. Naveed** | **Interactive Leaflet Map & FullCalendar Schedule Explorer (`/explore`)** | ✅ **100% Done** | • Interactive `Leaflet.js` map with OpenStreetMap tiles (no API key needed)<br>• Custom discipline-colored HTML/SVG pins tagged with `AU`/`MY`<br>• Region quick-jump buttons (`All`, `Australia`, `Malaysia`, `Kuching`, `Sepang`)<br>• Interactive click-to-pick GPS coordinates on Create/Edit Event map<br>• `FullCalendar` v6 Month Grid (`dayGridMonth`) & Track Schedule List (`listMonth`) | Ready for demo. |
| **4. Gibson** | **Organizer Analytics Dashboard (`vue-chartjs`) + Automated Unit Testing (`Vitest`)** | ✅ **194/194 tests passing; browser QA pending** | • Organizer engagement charts are implemented; not operational-health monitoring.<br>• Twelve spec files cover cards, home, listings, detail, Explore/map/calendar, navbar/search integration, pagination, auth/events stores, and offline saving. | See Sections 4–5 for verified results and debugging log. Review charts and workflows in-browser and against the real backend. |

---

### 2.3 Database & REST API Endpoints Audit

#### Database Tables (`database/schema.sql` & `database/seed.sql`)
All **7 required MySQL/MariaDB tables** are implemented and compatible with Swinburne's FeeNIX MariaDB 5.5 (`VARCHAR(191)` index keys, explicit `DATETIME` columns):
- [x] `users` (`id`, `name`, `email`, `password_hash`, `role`, `avatar`, `region`, `bio`, `created_at`) — 6 seeded users
- [x] `clubs` (`id`, `name`, `description`, `logo`, `region`, `city`, `founded_year`, `owner_id`, `created_at`) — 6 seeded clubs (3 AU, 3 MY)
- [x] `categories` (`id`, `name`, `slug`, `badge_color`, `icon`) — 6 seeded categories (`Track Day`, `Drift`, `Meet`, `Drag`, `Cruise`, `Show`)
- [x] `events` (`id`, `title`, `description`, `category_id`, `club_id`, `organizer_id`, `region`, `venue`, `address`, `organizer_contact`, `latitude`, `longitude`, `start_datetime`, `end_datetime`, `price`, `capacity`, `image`, `status`, `created_at`) — 12 seeded events (10 upcoming, 2 completed past events)
- [x] `rsvps` (`id`, `event_id`, `user_id`, `status` [`going`/`interested`], `created_at`, `UNIQUE(event_id, user_id)`) — 15 seeded RSVPs
- [x] `event_likes` (`id`, `event_id`, `user_id`, `created_at`, `UNIQUE(event_id, user_id)`) — 11 seeded likes
- [x] `comments` (`id`, `event_id`, `user_id`, `body`, `rating` [1–5 nullable], `created_at`) — 5 seeded comments/reviews

#### REST API Endpoints (`api/index.php` & `src/services/localDb.js`)
- [x] **Auth:** `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/profile`
- [x] **Events:** `GET /events` (with `search`, `category`, `region`, `date_from`, `max_price`, `status`, `sort`, `lat`, `lng`, `page`, `limit`), `GET /events/:id`, `POST /events`, `PUT /events/:id`, `DELETE /events/:id`
- [x] **RSVP:** `POST /events/:id/rsvp`, `DELETE /events/:id/rsvp`, `GET /users/me/rsvps`
- [x] **Likes:** `POST /events/:id/like`, `DELETE /events/:id/like`
- [x] **Comments:** `GET /events/:id/comments`, `POST /events/:id/comments`, `DELETE /comments/:id`
- [x] **Clubs:** `GET /clubs`, `GET /clubs/:id`, `POST /clubs`, `PUT /clubs/:id`, `DELETE /clubs/:id` *(Full UI & API support complete with Delete Club button in `ClubDetailView.vue`)*
- [x] **Categories:** `GET /categories`
- [x] **Dashboard:** `GET /dashboard/stats`
- [x] **Admin:** `GET /admin/users`, `PUT /admin/users/:id/role`, `DELETE /admin/users/:id`, `GET /admin/moderation`

---

## 3. Actionable To-Do List & Completion Status

### Phase A: Codebase Polish & Enhancement (✅ 100% Completed)
- [x] **1. Add "Delete Club" Button in `ClubDetailView.vue`:** Implemented for club owner (`organizer`) and `admin` with confirmation prompt, API deletion call, and toast feedback.
- [x] **2. Add `/about` (`AboutView.vue`) Page & Future Scalability Roadmap:** Created the 14th view (`/about`) with tabs for System Architecture & Team Allocation, WCAG 2.1 AA Accessibility Standards, and the **Phase 2 Future Scalability Roadmap** (Workshop Locator & Used Parts Swap Board). Linked in both `Navbar.vue` and `Footer.vue`.
- [x] **3. Add Custom Vue Directive (`v-focus`) & Expand Vitest Suite (`eventStore.spec.js`, `useOfflineEvents.spec.js`):** Built custom `v-focus` directive in `src/directives/focus.js` and registered in `main.js`. The earlier milestone was **5 spec files / 13 passing tests**. The verified 21 October checkpoint is **7 spec files / 76 passing tests**, including homepage and listing coverage (see Section 4).

### Phase B: Deployment & Repository Tasks (Manual Steps by You/Team)
- [ ] **4. Review & Synchronize Repository:** Inspect modified/untracked redesign files, then commit/push only when explicitly approved. Current remote synchronization and login requirements are unverified.
- [ ] **5. Deploy to Swinburne Mercury (`mercury.swin.edu.au`):**
  1. Connect to Swinburne VPN (`vpn.swin.edu.au`).
  2. Log in to `http://feenix-mariadb-web.swin.edu.au` (phpMyAdmin) and import `database/schema.sql` and `database/seed.sql`.
  3. Configure database credentials and a production JWT secret securely in `api/config.php`. Verify actual PHP/MariaDB responses and persistence; a working frontend/local fallback is not proof of a working remote database.
  4. Run `npm run build` and upload the contents of `dist/` + `api/` via SFTP to `/home/students/accounts/s[StudentID]/cos30043/www/htdocs/`.
- [ ] **6. Record the 5–10 Minute Single-Take Group Video & Finalize Report:** `FINAL_REPORT.md` exists but needs reconciliation with current tests/design and submission requirements. Consult the team/interview guidance in `README.md` and attribution tables in `CREDITS.md`; recording/submission status is unverified.

### Phase C: Community-First Design Continuation (21 October 2026)
- [x] Preserve completed homepage/shared-card work and existing navbar/config/test changes.
- [x] Redesign Browse Events using the agreed homepage direction.
- [x] Add listing regression tests; verify the full suite and production/PWA build.
- [x] Record reproducible debugging notes and current limitations below.
- [ ] Review Browse Events at `/#/events`: small phone, tablet, desktop, both themes, keyboard focus, long text, native date/select controls, and loading/error/empty states.
- [ ] Verify homepage image licensing/attribution.
- [x] Continue to Event Detail at the user's request, preserving RSVP, guest/member visibility, comments, ratings, likes, map, management, and offline saving; add 28 regression tests.
- [ ] Review Event Detail in-browser: responsive layout, both themes, focus order, long content, images, map, role-specific actions, and real-device offline behavior.
- [x] Redesign Explore at the user's explicit request; preserve all three layouts, map/calendar behavior, categories, regions, selection, and detail links. Add 45 regression tests; verify 149-test full suite and production/PWA build.
- [ ] Review Explore on small phone/tablet/desktop, both themes, keyboard, actual map controls/tiles/selection, and calendar month/list/Today/detail navigation.
- [x] Review supplied desktop dark-theme Explore screenshots: new layout/map/month calendar visible without obvious overlap. Interaction/mobile/light-theme checks remain open.
- [x] Redesign navbar only from the user's pill-navigation references; preserve public/role routes, auth actions, search shortcut, theme and connectivity semantics. Add 45 tests; full 194-test suite and production/PWA build pass.
- [x] Review latest supplied desktop dark-theme Clubs/About screenshots of the navbar: correct active segments and no obvious crowding. Mobile/light/signed-in review remains open.
- [ ] Review new navbar mobile/light-theme/signed-in states, short-screen menu scrolling, long names, all role menus, keyboard/search, dock clearance and device safe area.
- [x] Redesign footer, Clubs directory and About at the user's explicit request. Preserve links, install/offline/credits/local-reset controls, club filters/creation and all three About sections. Add 57 tests; full 251-test suite and production/PWA build pass.
- [x] Review supplied desktop dark-theme Clubs/footer/About frames: readable hierarchy and no obvious overlap. First Clubs frame shows 80% browser zoom. Footer spacing band visible; no requested adjustment.
- [ ] Remaining footer/Clubs/About QA: tablet/320px, light theme, keyboard/focus, dock clearance, credits/install/reset, organizer creation and About tabs. Club Detail remains unchanged.
- [x] Redesign sign-in and Join ApexGrid at the user's request; preserve credentials/rules, demo accounts, role choices, payloads and login redirect/role-home routing. Add 41 tests; full **292-test suite** and production/PWA build pass.
- [ ] Review sign-in/registration rendered desktop/mobile in both themes, autofill/native validation, keyboard/error focus, pending/failure/mismatch states and real-backend account/redirect behavior.
- [ ] Audit the same scoped `:global()` theme-selector pattern in earlier homepage/listing/detail work (DBG-08). Navbar's old rule was replaced in this navbar slice; other pages are untouched.
- [ ] Clarify operational dashboard scope, measurements, and access before implementation.

---

## 4. Verified Design & QA Checkpoint — 21 October 2026

### 4.1 Scope and files

| File | Work / evidence |
| :--- | :--- |
| `src/views/HomeView.vue`, `src/components/EventCard.vue` | Existing community-first redesign inspected and preserved; homepage completion/testing reported by the user. Their automated tests pass in the latest full run. No new rendered homepage audit was performed. |
| `src/views/EventsListView.vue` | Added editorial heading, scoped warm charcoal/off-white/vermilion palette, flat filter section, responsive spacing, and larger controls. Preserved seven filters (keyword, type, region, date, price, status, sort), pagination, organizer actions, and shared card/offline controls. |
| `src/views/EventsListView.vue` | Added loading/error/retry/empty states, category failure/retry without blocking event loading, explicit local-currency explanation, clearer geolocation fallback, guarded duplicate in-flight likes, and failed-like feedback. |
| `tests/unit/EventsListView.spec.js` | Eight new tests cover incoming filters/role actions, filter controls/resetting page, pagination, loading/error/empty states, category failure/retry, guest redirect, failed-like retry, and denied-location fallback. |
| `src/views/EventDetailView.vue` | Photographic/editorial redesign, responsive RSVP summary, protected details, comments, map, management, and offline saving; resilient loading/actions and stale-response guards. Details in Section 4.4. |
| `tests/unit/EventDetailView.spec.js` | 28 new regression tests for preserved interactions, failure/retry states, permissions, offline snapshots, images/capacity, and navigation races. |
| `src/views/ExploreView.vue` | Editorial heading, flat controls, synchronized filters/preview, image fallback, currency/date formatting, independent loading/errors/retries, complete paginated collection, unmount guards, and responsive scoped theme styles. |
| `src/components/EventMap.vue` | Watches externally controlled region changes; built-in quick jumps still emit once; reduced-motion users receive nonanimated region changes. Other consumers retain their controls. |
| `src/components/EventCalendar.vue` | Flat scoped styling in both themes, responsive toolbar, plain labels, actual current-date initialization/Today behavior; month/list/detail navigation retained. |
| `tests/unit/ExploreView.spec.js`, `EventMap.spec.js`, `EventCalendar.spec.js` | 17 + 18 + 10 new regression tests. |
| `src/components/Navbar.vue` | Reference-inspired public-link pill, grouped role-aware account disclosure, search/theme controls, floating mobile dock, Vue-managed dismissal/focus and safe theme selectors. |
| `src/components/CommandSearchModal.vue` | Removed duplicate Ctrl/Cmd+K ownership; retains Escape dismissal. Search UI/data behavior otherwise unchanged. |
| `tests/unit/Navbar.spec.js` | 45 tests, including real-router and actual-modal shortcut integration; both-theme CSS compilation and dock reserve checks. |
| `src/components/Footer.vue`, `src/views/ClubsListView.vue`, `src/views/AboutView.vue` | Footer/Clubs/About redesign and 57 tests, detailed in Section 4.8. |
| `src/views/LoginView.vue`, `src/views/RegisterView.vue` | Editorial auth layouts, preserved inputs/account destinations, pending/error/focus/unmount handling and safe scoped themes. Section 4.9. |
| `tests/unit/LoginView.spec.js`, `RegisterView.spec.js` | 20 + 21 tests for preserved flows, validation, errors, duplicate actions, stale completions and theme compilation. |
| `DESIGN_BRIEF.md` | Updated implementation checkpoint, validation evidence, unresolved assumptions, and next page-by-page action. |

No framework, dependency, schema, or API changes were made in this design slice. Generated `dist/` files were produced by the build, not edited manually. No commit, push, or deployment was performed.

### 4.2 Full-suite results

| Spec file (`tests/unit/`) | Passing tests |
| :--- | ---: |
| `EventCard.spec.js` | 32 |
| `HomeView.spec.js` | 26 |
| `EventsListView.spec.js` | 8 |
| `EventDetailView.spec.js` | 28 |
| `authStore.spec.js` | 2 |
| `eventStore.spec.js` | 3 |
| `PaginationBar.spec.js` | 2 |
| `useOfflineEvents.spec.js` | 3 |
| `ExploreView.spec.js` | 17 |
| `EventMap.spec.js` | 18 |
| `EventCalendar.spec.js` | 10 |
| `Navbar.spec.js` | 45 |
| `Footer.spec.js` | 12 |
| `ClubsListView.spec.js` | 19 |
| `AboutView.spec.js` | 26 |
| `LoginView.spec.js` | 20 |
| `RegisterView.spec.js` | 21 |
| **Total** | **292 / 292 across 17 files** |

Latest full-suite run: Vitest **2.1.9**, **15.38 seconds** as reported by the runner. Previous footer/Clubs/About checkpoint: 251 tests across 15 files in 14.70 seconds. Previous navbar checkpoint: 194 tests across 12 files in 11.15 seconds. Earlier checkpoints: Explore 149 tests across 11 files in 10.24 seconds; Event Detail 104 tests across eight files in 8.99 seconds; listing 76 tests across seven files in 9.53 seconds. These are automated unit/component checks, not proof of browser visual quality, PHP/database integration, WCAG conformance, or real-device offline behavior.

### 4.3 Commands and observed results

Run from `D:\ApexGrid` in PowerShell or Command Prompt:

```powershell
# Focused listing regression tests
node node_modules/vitest/vitest.mjs run tests/unit/EventsListView.spec.js

# Focused Event Detail regression tests
node node_modules/vitest/vitest.mjs run tests/unit/EventDetailView.spec.js

# Focused Explore / map / calendar regression tests
node node_modules/vitest/vitest.mjs run tests/unit/ExploreView.spec.js tests/unit/EventMap.spec.js tests/unit/EventCalendar.spec.js

# Focused navbar and search-shortcut integration tests
node node_modules/vitest/vitest.mjs run tests/unit/Navbar.spec.js

# Focused footer / Clubs directory / About regression tests
node node_modules/vitest/vitest.mjs run tests/unit/Footer.spec.js tests/unit/ClubsListView.spec.js tests/unit/AboutView.spec.js

# Focused sign-in / registration regression tests
node node_modules/vitest/vitest.mjs run tests/unit/LoginView.spec.js tests/unit/RegisterView.spec.js

# Full automated suite
node node_modules/vitest/vitest.mjs run

# Production build, including PWA generation
node node_modules/vite/bin/vite.js build

git --no-pager diff --check
```

In the agent's failing `sh` environment, prefixing the direct Node/Git commands with the shell builtin `exec` allowed them to complete despite startup fork warnings. Do **not** add `exec` to these PowerShell commands.

- **Full suite:** 17 files passed; **292 tests passed**. New Login 20 and Register 21 tests pass. Initial focused run passed 40/41; an unsupported test matcher was corrected (DBG-11). Windows shell fork warnings recurred, but final tests/build exited successfully.
- **Production build:** Vite **5.4.21**, 100 modules transformed, completed in **22.29 seconds**. PWA **0.21.2** generated `dist/sw.js` and `dist/workbox-835c8c05.js`; 12 precache entries, approximately **1886.67 KiB**.
- **Bundle warning:** Main JavaScript **981.24 kB** minified / **312.97 kB** gzip; CSS **413.36 kB** / **65.92 kB** gzip. Large-chunk warning remains non-blocking. No code-splitting change was made in this slice.
- **Editor diagnostics:** LoginView, RegisterView and their two new specs checked with no errors/warnings. Previous page/widget checks were also clean at their checkpoints.
- **Whitespace check:** `git diff --check` completed without whitespace errors; Git emitted LF-to-CRLF notices.
- **Pending:** Rendered visual/accessibility review, deployed API/database verification, and real-device/offline checks. The user's earlier screenshot confirms a preceding successful build, not validation of subsequent edits.

### 4.4 Event Detail continuation — 21 October 2026

**Scope:** `src/views/EventDetailView.vue` and `tests/unit/EventDetailView.spec.js`; checkpoints updated in this report and `DESIGN_BRIEF.md`. No shared styles, backend, schema, dependencies, or new image assets were changed.

- Larger event photography and an editorial heading; separate, readable metadata rather than text over a photograph. Missing/broken images have a fallback.
- Scoped warm charcoal/off-white palette and restrained vermilion in both themes; flat content sections, visible focus, named icon buttons, and 48px action controls.
- Practical details and RSVP precede long content on small screens; the summary sits to the right on desktop. Currency remains region-specific (RM / A$ / Free), with capacity progress and attendance kept distinct from likes and offline saves.
- Retained guest sign-in return URLs, protected address/contact, copying, Leaflet map, owner/admin management, RSVP/cancellation, likes, comments/deletion, optional ratings, and offline saving. No new spectator/parking/registration fields were invented.
- Removed unsupported “Sanctioned” and “Official Run-Sheet” claims. The previous schedule invented inspections, briefings, and timed sessions from start/end dates. Only organizer-supplied times and description are shown now.
- Event-load errors offer retry; comment-load failures stay local and offer their own retry. Mutation failures leave event content and failed comment drafts visible. Pending controls prevent duplicate actions and release on failure.
- Saved fallback is explicitly a snapshot, not live data. Its composer is hidden because comments are not cached. Explicit 403/404 responses are not replaced by stale saves. API/local-fallback behavior itself was not changed.
- Route/request generations prevent stale event/comments responses and old actions from overwriting a newer visit or clearing its draft; leaving the page invalidates pending UI completions.

**Coverage:** 28 Event Detail tests cover the above, including A→B→A navigation, completion after unmount, failed post-action refresh recovery, clipboard unavailability, image fallback, capacity, and free entry. The full 104-test suite and production/PWA build passed after the final code changes.

**Still unverified:** Responsive/light-theme appearance beyond the screenshots recorded below, tab order, measured contrast across photographs/native widgets, live PHP/MariaDB permission/persistence behavior, map interaction, and real-device offline behavior. Tests mock API/auth/offline services and stub the map. Offline save writes remain subject to existing composable/storage behavior; no stronger persistence guarantee is implied.

### 4.5 User-supplied screenshot checkpoint — 21 October 2026

- **Homepage / Browse Events:** User supplied desktop dark-theme screenshots and said “yes its good.” Record visual approval only for the displayed states; mobile/light-theme and interactive checks remain open.
- **Event Detail (`/#/events/1`, guest):** Two desktop dark-theme screenshots show the title/photo, guest address/contact gate, venue map tiles/marker, public discussion, and right-hand price/date/venue/attendance/RSVP/offline panel. No obvious overlap is visible in those frames. This confirms the map rendered in that local browser session, not map interaction or backend behavior. Browser zoom appears different from the earlier captures; do not infer a CSS sizing defect from cross-screenshot scale alone.
- **Explore (`/#/explore`):** Screenshot shows the existing region/category controls, map markers, selected-event preview, and quick-select list. The older telemetry wording, bright accents, and nested panels remain; this page has not yet received the community-first redesign. Calendar mode was not shown.
- **Limits:** Screenshots do not validate focus/tab order, contrast ratios, real sticky scrolling, signed-in actions, form submissions, offline persistence, or mobile/light-theme layouts. No application defect was established by these images. No application code changed and no test/build rerun was needed for this documentation-only checkpoint.

**Historical next action:** Explore was proposed following these screenshots. The user subsequently approved it; implementation is recorded below.

### 4.6 Explore continuation — 21 October 2026

**Authorization:** User said “Alright redesign that page next.” Scope: Explore plus its map/calendar support and regression tests; no backend/schema/dependency changes or new photography assets.

- Editorial “Find your next gathering” heading; warm charcoal/off-white and restrained vermilion, flat filtering, 48px primary controls, visible focus, responsive workspace, photographic event preview and missing/broken-photo fallback.
- Preserved map/calendar/combined modes, all category choices, regional controls, marker/list selection, detail links, calendar month/list/previous/next/Today controls. Preview/list are now available in calendar-only mode too; calendar clicks still navigate directly to details rather than silently changing their meaning.
- Region control moved to the shared filter area, so it remains usable without the map. Map watches external region changes. Existing Kuching venue-name matching and Sepang's Malaysia-wide results are retained and explained instead of implying city-precise filtering.
- Filter changes keep the selected event only if it remains in the visible results; otherwise select the first result or clear the preview. Formatted dates and RM/A$ prices replace raw timestamps; cancelled/completed status is shown without new unsupported claims.
- Independent event/category loading, error/retry, collection-empty/filter-empty states. All API pages are fetched before publishing a complete collection; later-page failure does not masquerade as complete results. Duplicate pending retries and post-unmount completions are guarded.
- Removed hard-coded calendar date and misleading “Oct/Nov 2026” Today label. Calendar now starts at the actual current date. This is an intentional behavior correction, not a new event-date assumption.
- OpenStreetMap remains the existing external tile provider; no new external service or key. Uncached tiles need a connection; existing API/local-data fallback and PWA caching are unchanged. Explore adds no auth mutations or new offline-save semantics.

**Validation:** 17 Explore + 18 map + 10 calendar tests added; final full suite **149/149 across 11 files**. Production/PWA build passed; diagnostics clean for the checked files and whitespace check passed. See Section 4.3 for exact commands/sizes/timings. Tests use API/Leaflet/FullCalendar stubs and a Vue CSS compilation assertion; they are not rendered interaction/contrast proof.

**Screenshot follow-up:** User supplied two desktop dark-theme Explore frames showing the new heading/filters, 12-event count, rendered map/markers, preview/list and month calendar with Today/Month/List controls. No obvious overlap in supplied frames. Calendar labels are clipped in narrow month cells; list view is present, but not shown or interactively verified. About/Clubs screenshots still show older styling and unsupported platform-level “official/verified” language; no changes to those pages were authorized in this slice.

**Remaining Explore QA:** Mobile/light theme, keyboard, map zoom/regions/markers, filter resets, preview/detail links, and calendar month/list/Today interaction. Navbar became the next explicitly approved slice below; earlier page QA remains open.

### 4.7 Navbar continuation — 21 October 2026

**Authorization / references:** User approved “just the navbar” and supplied one desktop navigation pill and two mobile-dock examples (dark and light). Adapted their three-part hierarchy, rounded forms and active capsule rather than copying branding/assets, bright gradient background, oversized protruding item or heavy glass/neumorphic effects. Footer explicitly left untouched; no dependency/schema/API/assets/route-guard changes.

**Files:** `src/components/Navbar.vue`, minimal shortcut ownership change in `src/components/CommandSearchModal.vue`, new `tests/unit/Navbar.spec.js`, and both checkpoint documents.

- Quieter CSS-drawn brand mark and wordmark; centred five-link desktop pill with one active segment; separate search, theme and guest account actions. Removed badge/status clutter and repeated account links from the desktop row.
- Grouped profile, My RSVPs & saved events (explicit saved-for-offline count), organizer dashboard/host actions, admin moderation and sign-out inside one role-aware account disclosure. Existing store role hierarchy and route guards unchanged; admin retains organizer actions.
- Rounded five-item mobile dock keeps Home/Events/Explore/Clubs plus the existing guest sign-in or authenticated role-home destination. The top menu provides About and account/role actions. Dock remains labelled, not icon-only.
- Desktop controls switch to the compact header/dock below 1200px to avoid crowding. Navbar-owned CSS reserves bottom dock/safe-area clearance; menu is height-bounded and scrollable. No edits to `Footer.vue`, `App.vue`, or global `style.css`.
- Vue-managed disclosure replaces Bootstrap collapse/dropdown hooks; state/ARIA remain in sync. Escape returns focus, outside click/focus closes, route/auth changes close, listeners clean up. Search opener focus returns on dismissal; route navigation does not force focus back to an old search trigger.
- Ctrl/Cmd+K is owned only by Navbar; removed the modal's second shortcut handler while retaining Escape. Keyboard repeat does not repeatedly toggle search. Actual-modal regression verifies open/close for both shortcuts.
- Browser-online status moved quietly into the menu; offline remains visible when the menu is closed. No pulsing live dot or PWA/API-health implication. Both-theme selectors compile safely; the old Navbar `:global()` descendant issue is removed. Home/Browse/Detail selector follow-up remains open.

**Validation:** Focused Navbar **45/45**; full suite **194/194 across 12 files**, Vitest 2.1.9, 11.15s; production/PWA build passed with the existing large-chunk warning (Section 4.3). All three changed/new code files have clean editor diagnostics. Tests use reactive store mocks and a real memory router; actual command-modal shortcut integration is included, but this is not live-backend or visual QA.

**Historical next action:** Footer was proposed after navbar review. User subsequently supplied desktop dark-theme Clubs/About screenshots with the new navbar: correct active segments, aligned logo/pill/actions and no obvious crowding in the shown frames. Mobile/light/signed-in checks remain open. The user then explicitly authorized footer, Clubs and About below; monitoring dashboards remain unscoped.

### 4.8 Footer, Clubs directory & About continuation — 21 October 2026

**Authorization:** “tackle footer next, and clubs and about page UI as well.” Scope: `src/components/Footer.vue`, `src/views/ClubsListView.vue`, `src/views/AboutView.vue`, three corresponding new unit specs, and both checkpoint documents. `ClubDetailView.vue`, global styles, navbar, router/guards, auth stores, API/backend, schema, dependencies and assets unchanged in this slice.

- **Footer:** quiet slanted-bar brand, community-first copy, flat discovery/account columns and responsive credits/resources area. Preserved every existing destination and role-guarded portal, reactive saved-for-offline count, conditional PWA installation, source/academic/team information, and confirmed local seed reset with reload. Reset confirmation now explains replacement of local accounts/events/RSVPs/likes/comments, not the server DB or separate offline saves. Install button is pending-guarded with failure feedback. Credits is an in-flow disclosure (not a modal), with ARIA state, Escape/close and focus return. Removed fabricated club verification/count, telemetry and deployment-ready labels. Versions refer to package files rather than stale hard-coded numbers; homepage photo licence remains explicitly unresolved.
- **Clubs directory:** editorial heading, photographic grid and flat controls; preserved live name/city/interest search, Australia/Malaysia filters, profile links, actual event/RSVP counts and organizer/admin creation fields. Added loading/error/retry/empty states, broken/missing-photo fallback, clear filters, create-error separation, duplicate-submit protection, form focus, stale-response/unmount guards. No automatic platform verification claim.
- **About:** editorial introduction, understated academic context, flat team/architecture/practices columns and roadmap rows. Preserved team responsibilities and all three sections; roadmap explicitly proposed, accessibility and Mercury compatibility framed as goals rather than guarantees. Tabs use linked IDs, roving tabindex and Arrow Left/Right/Home/End navigation. No operational monitoring added.
- **Themes/accessibility:** component-scoped variables, safe light-theme ancestor selectors verified through Vue CSS compilation, visible focus, quiet interactions and responsive small-screen rules. No new media/service/dependency. Existing remote club-image sources remain unchanged.

**Validation:** Added **12 Footer + 19 Clubs + 26 About tests**; final full run **251/251 across 15 files**, 14.70s. Production/PWA build passed with existing chunk warning; exact metrics/commands in Section 4.3. All six code/spec diagnostics clean. Tests cover preserved destinations/data/actions, asynchronous states/races, credits/focus/install/reset, About content/keyboard/ARIA and scoped theme compilation. These are not direct browser, live PHP/database, screen-reader or real-device offline checks.

**Next action / remaining QA:** Review footer, `/#/clubs` and `/#/about` on desktop/tablet/320px and both themes, especially footer/mobile-dock clearance, long club content, photo crop/fallback, filters, club-create success/failure, credits focus, installation and About tabs. Reset is destructive to local demo data: verify cancellation or use disposable demo data for an acceptance test. Club Detail remains the earlier UI. Keep earlier page/theme-selector/photo-licensing follow-ups open.

**Screenshot follow-up:** User supplied new desktop dark-theme Clubs/footer/About screenshots. Clubs shows the editorial heading, search/region controls, six-result count and three-column photography. Footer shows all three columns, offline count, credits/reset controls and academic/team attribution. About shows heading, academic context, tabs and team row. No obvious overlap in the supplied frames. First Clubs capture is at 80% browser zoom, while other captures differ in scale; do not infer sizing defects from that alone. A contrasting empty band between the page and footer is visible; this review did not establish a functional defect or authorize a spacing change. Mobile/light and interactions remain unverified. User then requested auth pages below.

### 4.9 Sign-in & Join ApexGrid continuation — 21 October 2026

**Authorization:** “let's fix the sign in and join apexgrid (register) page as well,” with an older sign-in screenshot. Scope: `src/views/LoginView.vue`, `src/views/RegisterView.vue`, two new specs and both checkpoint documents. No auth-store/API/schema/router-guard/dependency/global-style/asset changes, commits or deployment.

- Matching flat split layouts, short community-first introduction, warm charcoal/off-white palette, restrained vermilion controls, visible focus and scoped responsive/light-theme rules. Removed telemetry, licence/sanctioning, fake live status and unsupported form-compliance language. No extra photography or network service added.
- **Sign-in:** preserved email/password fields, 6-character login minimum, browser autocomplete/native constraints, protected-route notice, requested redirect or role-home routing after authentication. Role descriptions remain plain-language supporting content. All four seeded accounts retain names/emails/default destinations/password and fill-only behavior, in a labelled disclosure now closed by default. Quick-fill returns focus to the email field. Demo credentials are explicitly demonstration-only and require matching active database seeds.
- **Registration:** preserved full name, region, email, password/confirmation, optional bio, member/organizer choices (no admin option), defaults, exact registration payload and role-home routing. Existing 8-character uppercase/lowercase/number rules retained. Confirmation mismatch is inline, associated with the field, announced and focused; correcting it clears the invalid state.
- Both views isolate submission feedback from stale shared-store errors, focus API failure summaries, preserve failed inputs, prevent duplicate pending requests and ignore late UI feedback/navigation after unmount. Existing store authentication persistence still occurs if its request completes after leaving the view; UI guards do not cancel it.

**Validation:** **20 Login + 21 Register tests**; full suite **292/292 across 17 files**, 15.38s. Production/PWA build passed; exact commands/metrics in Section 4.3. All four code/spec diagnostics clean. Initial Login matcher correction documented in DBG-11. Tests exercise mock auth with a real memory router, payloads, role destinations, protected-event return, pending/errors, mismatch focus, unmount and compiled theme selectors; no live backend or rendered-browser claim.

**Next action:** Review `/#/login` and `/#/register` at desktop/tablet/320px in both themes, browser autofill/native validation, keyboard/error focus, demo disclosure/quick-fill, registration mismatch and pending/failure states. Verify real sign-in return to a protected event and member/organizer account creation against the intended backend using disposable test accounts. Keep earlier page QA and theme-selector/photography follow-ups open. Dashboard monitoring remains unscoped.

---

## 5. Debugging Log & Reuse Notes

### DBG-01 — Windows `sh` process/fork failures

**Observed symptoms:**

```text
bash: fork: retry: Resource temporarily unavailable
dofork: child ... died unexpectedly ... exit code 0xC0000142
child_copy: dll data read copy failed ... Win32 error 299
exit code 0xC0000005
```

**Impact:** The initial `npm test -- tests/unit/EventsListView.spec.js` attempt failed with exit code 127 before test execution. A combined Git diff command timed out. Similar failures affected earlier status/log attempts. These messages alone do not indicate an application defect.

**Diagnosis:** The failure occurred in the Windows bash process-launch path. Its underlying resource/runtime cause was **not established**; do not assume an app memory leak, bad dependency, or broken test from this output alone.

**Successful workaround used in the agent's `sh`:**

```sh
exec node node_modules/vitest/vitest.mjs run
exec node node_modules/vite/bin/vite.js build
exec git --no-pager diff --check
```

Each command was a separate tool invocation. `exec` replaces the shell with the requested process; do not chain subsequent commands after it expecting the original shell to continue. Startup warnings still appeared, but the final runner/build output confirmed completion.

**If it recurs:** Try the direct Node commands in PowerShell/Command Prompt; inspect the final process result, not only the startup warnings. If process launching still fails, investigate/restart the affected terminal/editor and Windows shell runtime before changing application code. No runtime reinstall or environment reset was performed here.

### DBG-02 — Incorrect filter-count assertion in a new test (resolved)

**Failure:**

```text
EventsListView.spec.js > keeps every filter and resets pagination when a filter changes
AssertionError: expected ... to have a length of 8 but got 7
```

**Cause:** The new test incorrectly expected eight input/select controls. The existing listing has **seven** filters; no filter had been lost.

**Fix:** Replace the raw count with an exact ID-list assertion: `filter-search`, `filter-category`, `filter-region`, `filter-date`, `filter-price`, `filter-status`, `filter-sort`.

**Verification:** Initial focused run: 7 passed / 1 failed. After correction: the full suite passed, including all eight listing tests. For similar failures, compare the test expectation with the actual required controls before adding UI merely to satisfy a mistaken assertion.

### DBG-03 — Oversized production chunk (open, non-blocking)

**Warning:** `Some chunks are larger than 500 kB after minification.`

**Evidence:** The production build succeeded, with the main JS chunk approximately 985.24 kB. The router currently imports views eagerly; this is one candidate for investigation, not a measured bundle breakdown.

**Follow-up:** Profile bundle contents and consider route-level lazy loading or deliberate Rollup chunking in a separate performance slice. Recheck route loading, production/PWA caching, and actual loading performance afterward. Raising `chunkSizeWarningLimit` only hides the warning; it does not reduce payload size.

### DBG-04 — Git LF/CRLF notices (informational)

**Warning:** `LF will be replaced by CRLF the next time Git touches it`.

**Meaning:** Git reported line-ending conversion settings for working-copy files; the completed whitespace check reported no whitespace errors. This is separate from the shell fork failure and is not a Vue/build error.

**Follow-up:** If mixed endings become a team problem, inspect repository attributes and Git configuration before agreeing a normalization policy. Do not rewrite unrelated files or change global Git settings merely to suppress the notice. No normalization was performed.

### DBG-05 — Listing failure paths improved during redesign

| Previous behavior found in source | Change | Regression evidence |
| :--- | :--- | :--- |
| Awaited category loading before fetching events; a category rejection could prevent initial event loading. | Start category/event loads independently and expose a category retry message. | Category-failure test confirms event loading still runs. |
| Failed event fetch had no dedicated listing error/retry UI; stale results or misleading states were possible. | Handle the store rejection and render a distinct error state before empty/results; retain filters for retry and hide pagination while unavailable. | Loading/error/retry/empty test passes. |
| Like action had no local failure feedback or in-flight guard; success copy read mutable event state after awaiting the request. | Capture prior like state, guard repeated in-flight requests per event, show failure feedback, and release the guard in `finally`. | Guest redirect and failed-member-like/retry tests pass. Duplicate in-flight behavior has not been separately asserted. |
| Geolocation fallback and technical GPS copy could obscure whose location distances represented. | Explicitly label denied/unavailable location fallback as Sepang or Melbourne, **not the user's location**. | Denied-location test verifies Malaysian fallback coordinates and copy. |

These findings came from source inspection and component tests, not a reproduced production incident. No claim is made that all network races, geolocation edge cases, or browser permission states are covered.

### DBG-06 — Event Detail loading/action isolation and request races (resolved in this slice)

| Symptom / reproduction | Cause found | Fix and regression evidence |
| :--- | :--- | :--- |
| Reject `GET /events/:id/comments` after a successful event request. Previously the page could show a fatal error or fall back to an older snapshot. | Event and comments shared one `try/catch`. | Separate error/loading state and retry for comments. Test confirms the event remains visible and comments retry does not refetch it. |
| Reject a like, RSVP, comment deletion, or event deletion. Previously some failures escaped locally; others hid the whole event. | Missing catches or mutation failures written to the fatal page error. | Guarded actions with inline feedback, toast, and `finally` cleanup. Tests cover failure, retry, duplicate pending requests, and retained drafts. |
| Start a request for event A, navigate to B, then resolve A. Also test A→B→A with an old pending comment. | Event ID alone cannot distinguish two visits to A; old responses/submissions could overwrite state or clear a new draft. | Separate request/page generations; invalidate on route reset/unmount. Tests cover stale event/comments, cross-event drafts, A→B→A, and completion after leaving. This ignores stale UI completions; it does not cancel a server-side mutation already sent. |
| Complete a mutation while an earlier comments fetch is pending, then fail the event refresh. | Invalidating the old request without clearing its loading flag could leave “Loading comments…” stuck. | Clear obsolete comments loading when beginning a new event load. Regression verifies the refresh warning and later comment recovery. |
| Fail offline-save toggle, then retry successfully. | Previous action error could remain after success. | Clear prior feedback/error before toggling; test verifies the successful retry removes the stale error. |
| Clipboard API absent, e.g. unsupported/insecure browser context. | Previous implementation silently did nothing when `writeText` was missing. | Warning toast explains manual copying; test covers unavailable clipboard and successful address/coordinate copying. |
| Inspect generated “official” track schedule. | Category plus start/end timestamps generated unsupported operational details. | Remove invented sessions/requirements; regression checks supplied start/end and absence of inspection/briefing claims. |

**Test-development notes:** The first redesigned-view run passed 15/18 tests. Two assertions were incorrect: a recoverable error may legitimately have an `h1`, and isolating comments failures does not require fetching comments before the event request resolves. Tests were corrected without changing these valid behaviors. The third failure exposed the offline snapshot still showing a comments composer; it is now hidden because saved events do not include comments. Expanded coverage passed 28/28 in the final full run.

**Environment recurrence:** One final full-suite launch exited **3221225794 (`0xC0000142`)** with no Vitest output. The same direct Node command passed on the next separate invocation. This is consistent with DBG-01's process-launch symptoms; its underlying cause remains unknown. Do not report that launch as 104 failing application tests.

**Build at the Event Detail checkpoint:** The >500 kB warning remained open (DBG-03). Main JS: 981.82 kB minified / 310.45 kB gzip; the build and service-worker generation completed successfully. Current Explore build figures are in Section 4.3.

### DBG-07 — Explore loading, filtering, and test stubs (resolved)

| Reproduction | Source-observed cause | Fix / verification |
| :--- | :--- | :--- |
| Reject `/categories` while `/events` succeeds, or vice versa. | Previous `Promise.all` coupled the resources; there was no catch or retry UI. | Independent loads and retries; slow/failed categories no longer block map/calendar. Tests cover both failure directions and category retry without an event refetch. |
| Select an Australian event, then filter to Malaysia or an unmatched category. | Selection did not follow filtered results. | Preserve a selection only while still visible; otherwise first visible event or no preview. Marker/list selection rejects stale IDs. |
| Return `total_pages: 2`, then resolve or reject page 2. | Previous page requested only page 1 with limit 50. | Fetch all reported pages before publishing; later-page failure is an error, not a misleading partial count. Unmount stops further page requests. |
| Change region through Explore's shared select. | `EventMap.initialRegion` initialized the map but was not watched. | Watch external changes, preserve built-in region emission, avoid echo animations, honor reduced motion. 18 map tests cover this and existing marker/picker/teardown behavior. |
| Initial new-view test run: 10 failures, 33 passes across the three new specs. | Stub objects had no explicit component names; name-based `findComponent` returned empty wrappers. | Name the stubs explicitly. No UI workaround; the corrected focused run passed all then-current 43 tests. Expanded final coverage adds two Explore checks, for 45 new tests. |

### DBG-08 — Vue scoped light-theme selectors (Explore fixed; earlier pages need follow-up)

**Reproduction:** With the installed `@vue/compiler-sfc`, call `compileStyle({ source: ':global([data-bs-theme=light]) .explore-page { color: red; }', id: 'data-v-check', scoped: true })`.

**Observed output:** `[data-bs-theme=light] { color: red; }` — the intended descendant is dropped. Local dark variables then win on the page. This is a compiler-confirmed selector defect, not a rendered light-theme audit.

**Explore fix:** Use the ordinary scoped ancestor selector `[data-bs-theme='light'] .explore-page` (and the corresponding select rule). It compiles with the scope attribute on the descendant. Calendar already uses this safe pattern. Added a compilation regression asserting both Explore selectors.

**Test-harness correction:** First compilation-test full run: 148 passed / 1 failed, `TypeError: The URL must be of scheme file`. Vitest/jsdom did not provide a file URL suitable for `readFileSync(new URL(..., import.meta.url))`. Read the SFC through Vite's `?raw` import instead. Final full run: 149/149 passed.

**Follow-up status:** Source search found the same `:global([data-bs-theme='light']) .…` form in `HomeView.vue`, `EventsListView.vue`, `EventDetailView.vue`, and `Navbar.vue`. None was changed in the Explore-only slice. Navbar's old selector is now replaced by safe ordinary scoped ancestor selectors in the subsequent navbar slice, covered by compilation assertions. Home/Browse/Detail remain open; do not claim older theme behavior is verified by passing component tests.

### DBG-09 — Navbar search ownership, disclosure state, and mobile reserve (resolved in navbar slice)

| Reproduction / constraint | Source-observed cause | Fix / verification |
| :--- | :--- | :--- |
| Open search then press Ctrl/Cmd+K again with Navbar and actual modal mounted. | Both components registered a global shortcut handler. The modal could emit close before Navbar toggled, reopening search. | Navbar is sole shortcut owner; modal retains Escape. Actual-modal tests verify both Ctrl+K and Cmd+K open/close correctly. |
| Open navigation and dismiss with Escape, focus outside, click outside, or route navigation. | Previous Bootstrap data attributes delegated DOM state independently of Vue; no component-owned dismissal/focus logic. | One Vue disclosure state drives rendering/ARIA; Escape restores the trigger, outside/route/auth events dismiss, unmount removes listeners. Tests cover all paths without Bootstrap JS. |
| Follow event/club detail routes. | Relying only on RouterLink record matching can leave a parent section inactive for sibling route definitions. | Explicit path-boundary active matching marks Events/Clubs on their detail/edit pages without making Home or similar prefixes falsely active. Memory-router tests verify nested paths and false-prefix cases. |
| Use floating dock between tablet and desktop widths, or with a device bottom inset. | Existing global 68px body reserve applied only below 992px; new dock is visible below 1200px and floats above the edge. | Navbar-owned media rule reserves 100px plus `safe-area-inset-bottom` below 1200px. Compiled CSS asserts reserve and breakpoint; real-device clearance/landscape QA still pending. |
| Switch Navbar to light theme. | Old `:global()` descendant rule had the compiler issue in DBG-08. | Safe scoped ancestor selectors for header and dock; compilation tests verify both. No claim of measured rendered contrast. |

**Validation:** All 45 new Navbar tests passed on their first focused run; final full suite 194/194 and build passed. Existing Windows shell resource warnings recurred before successful commands, not an application failure. No unrelated page, footer, auth store, or router guard was changed.

### DBG-11 — Auth test matcher and asynchronous UI boundaries (resolved)

- **Reproduce:** `node node_modules/vitest/vitest.mjs run tests/unit/LoginView.spec.js tests/unit/RegisterView.spec.js`; initial combined run passed 40/41. The failing Login assertion reported `Invalid Chai property: toHaveBeenCalledExactlyOnceWith`.
- **Cause / fix:** The installed Vitest 2.1.9 does not support that matcher. Replace it with `toHaveBeenCalledOnce()` plus `toHaveBeenCalledWith(...)`; do not upgrade dependencies for a test assertion. Final full suite passes 292/292.
- **Auth state:** Store loading/error are shared across pages. Each auth view now uses its own pending/completed guards and submission error, so repeated handlers cannot send another request and stale errors from a previous page do not appear on initial render. Native browser validation remains enabled. Registration confirmation mismatch has explicit ARIA/error focus.
- **Async boundary:** Unmount guards prevent late feedback/navigation but do not cancel login/register, undo persisted authentication or suppress an already-sent server mutation. Tests use mocked auth methods and a real memory router; they do not prove PHP/MariaDB authentication, route-guard enforcement or browser-native validation rendering.

### DBG-10 — Footer browser-action tests and directory request ordering (resolved)

- **Reproduce:** Run `node node_modules/vitest/vitest.mjs run tests/unit/Footer.spec.js tests/unit/ClubsListView.spec.js tests/unit/AboutView.spec.js`. The initial run passed 55/57; two new reset tests failed with `TypeError: SupportedEventInterface is not a constructor` before invoking the application handler.
- **Cause:** Tests stubbed `window` with only confirmation/location to observe reload without jsdom navigation. Vue Test Utils' `.trigger()` constructs events through `window`, whose event constructors were absent in the test stub. This was a test-harness defect, not a reset failure.
- **Fix:** Dispatch the browser-native element `.click()` in those two tests instead. Keep assertions that cancellation does nothing, confirmation calls local reset before reload, and confirmation copy explains local/server/offline impact. Focused Footer run passed 12/12; final full suite passed 251/251.
- **Clubs resilience:** Live search can finish out of order. A request generation plus unmount flag ensures only the latest directory response updates results/loading/error. Tests cover stale success/failure, unmount, retries, create failure and duplicate submit. Guards affect UI completions, not already-sent server mutations.
- **Environment:** Windows `sh` fork/Win32 errors recurred; direct `exec node` tests/build still completed successfully. No established app leak or backend failure is inferred. Build chunk warning remains the existing performance follow-up.
