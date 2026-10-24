# ApexGrid — Academic Report Sources, Credits & Third-Party Attributions

**Unit:** COS30043 — Interface Design and Development (Swinburne University of Technology)  
**Project:** **ApexGrid** — Car Meet, Drift, Drag & Track-Day Event Board  
**Team Members:** Jacob (Admin & PWA/Theme), Syed (Organizer AU & Map/Calendar), Naveed (Organizer MY & Analytics), Gibson (Member & Testing/WCAG)

This document provides complete, citation-ready attribution for all software libraries, open-source packages, fonts, map tile providers, photography assets, UI/UX design inspirations, and university technical documentation used to build **ApexGrid**. You may copy any section or table directly into your COS30043 group report appendices and reference list.

---

## 1. Software Frameworks, Libraries & Open-Source Packages

All npm dependencies are compiled at build time by Vite into static assets inside `dist/`, ensuring **zero runtime Node.js requirements** on the Swinburne Mercury Web Server (`feenix.swin.edu.au`).

| Package / Technology | Version | License | Official URL / Source | Role in ApexGrid |
| :--- | :--- | :--- | :--- | :--- |
| **Vue.js 3** (`vue`) | `^3.5.13` | MIT | [https://vuejs.org/](https://vuejs.org/) | Reactive Single-Page Application (SPA) framework using Composition API (`<script setup>`). |
| **Vue Router 4** (`vue-router`) | `^4.5.0` | MIT | [https://router.vuejs.org/](https://router.vuejs.org/) | Client-side routing (`createWebHashHistory()`) with 13 routes and `router.beforeEach` RBAC guards. |
| **Pinia** (`pinia`) | `^3.0.1` | MIT | [https://pinia.vuejs.org/](https://pinia.vuejs.org/) | Centralized state management (`authStore`, `eventStore`, `themeStore`). |
| **Pinia PersistedState** (`pinia-plugin-persistedstate`) | `^4.2.0` | MIT | [https://prazdevs.github.io/pinia-plugin-persistedstate/](https://prazdevs.github.io/pinia-plugin-persistedstate/) | Persists JWT tokens, active user session, and dark/light theme preference across page reloads. |
| **Bootstrap 5** (`bootstrap`) | `^5.3.3` | MIT | [https://getbootstrap.com/](https://getbootstrap.com/) | Responsive 12-column grid layout (`col-12 col-md-6 col-lg-4`), accessible utilities, and dark mode variables. |
| **Bootstrap Icons** (`bootstrap-icons`) | `^1.11.3` | MIT | [https://icons.getbootstrap.com/](https://icons.getbootstrap.com/) | Vector iconography for motorsport categories, telemetry badges, and navigation actions. |
| **Leaflet.js** (`leaflet`) | `^1.9.4` | BSD-2-Clause | [https://leafletjs.com/](https://leafletjs.com/) | Interactive GPS venue maps on `/explore` and `/events/:id` with custom SVG pins and region switcher. |
| **OpenStreetMap Tiles** | Standard | ODbL / CC BY-SA 2.0 | [https://www.openstreetmap.org/copyright](https://www.openstreetmap.org/copyright) | Map raster tiles cached for 30 days via Workbox `CacheFirst` strategy for offline use. |
| **FullCalendar v6** (`@fullcalendar/vue3`, `daygrid`, `list`, `interaction`) | `^6.1.15` | MIT | [https://fullcalendar.io/](https://fullcalendar.io/) | Monthly grid and agenda schedule calendar on `/explore` with click-through event navigation. |
| **Chart.js 4 & vue-chartjs** (`chart.js`, `vue-chartjs`) | `^4.4.7` / `^5.3.2` | MIT | [https://www.chartjs.org/](https://www.chartjs.org/) | Organizer Analytics Dashboard (`/dashboard`) rendering Bar, Doughnut, and Cumulative Line charts. |
| **Vite** (`vite`, `@vitejs/plugin-vue`) | `^6.1.0` | MIT | [https://vite.dev/](https://vite.dev/) | Frontend module bundler and local development server (`http://localhost:5173/`). |
| **Vite Plugin PWA & Workbox** (`vite-plugin-pwa`) | `^0.21.1` | MIT | [https://vite-pwa-org.netlify.app/](https://vite-pwa-org.netlify.app/) | Generates `sw.js` Service Worker and `manifest.webmanifest` for offline track-day caching. |
| **Vitest & Vue Test Utils** (`vitest`, `@vue/test-utils`, `jsdom`) | `^3.0.5` / `^2.4.6` | MIT | [https://vitest.dev/](https://vitest.dev/) | Automated unit testing suite (`293/293` passing tests across 17 spec files). |
| **Open-Meteo Weather REST API** | `v1` | CC BY 4.0 | [https://open-meteo.com/en/docs](https://open-meteo.com/en/docs) | Live circuit ambient temp, track asphalt temp, wind speed & rain probability telemetry on `/events/:id`. |
| **OpenStreetMap Nominatim Geocoding API** | `jsonv2` | ODbL | [https://nominatim.org/release-docs/latest/api/Overview/](https://nominatim.org/release-docs/latest/api/Overview/) | Live forward address search and click-on-map reverse geocoding in `EventFormView.vue`. |
| **NHTSA vPIC Vehicle Specifications API** | `vPIC` | Public Domain (US DOT) | [https://vpic.nhtsa.dot.gov/api/](https://vpic.nhtsa.dot.gov/api/) | Live manufacturer Make & Model verification in `ProfileView.vue` and `RegisterView.vue`. |

---

## 2. Typography & Fonts (SIL Open Font License 1.1)

Loaded from Google Fonts (`https://fonts.googleapis.com`) and cached offline by the Workbox Service Worker (`google-fonts-stylesheets` & `google-fonts-webfonts`):

1. **Space Grotesk** (`600`, `700`) — Geometric display typeface used for motorsport headings, hero titles, and navigation branding.
   - Designer: Florian Karsten ([https://fonts.google.com/specimen/Space+Grotesk](https://fonts.google.com/specimen/Space+Grotesk))
2. **Inter** (`400`, `500`, `600`, `700`) — High-legibility UI body typeface used for event descriptions, forms, and comments.
   - Designer: Rasmus Andersson ([https://fonts.google.com/specimen/Inter](https://fonts.google.com/specimen/Inter))
3. **JetBrains Mono** (`500`, `700`) — Monospace typeface with `font-variant-numeric: tabular-nums` used for countdown timers, GPS coordinates, prices (`A$245.00` / `RM 180.00`), capacity telemetry (`45/60`), and Haversine distances (`14.2 km`).
   - Designer: JetBrains ([https://fonts.google.com/specimen/JetBrains+Mono](https://fonts.google.com/specimen/JetBrains+Mono))

---

## 3. UI/UX Design Direction & Industry Inspirations

To elevate ApexGrid beyond a standard Bootstrap template into an authentic **Motorsport Telemetry & Event Platform**, the **"F1 Telemetry HUD & Night-Run Carbon"** dark theme (`#090b10` obsidian carbon, `#11151f` elevated slate, `#ff1e1e` FIA timing red, `#f59e0b` sector-purple/amber gold) and **"Daylight Paddock"** light theme (`#f8fafc` tarmac alabaster) were inspired by the following real-world applications:

1. **Formula 1® Official Timing & Telemetry HUD** ([https://www.formula1.com/](https://www.formula1.com/)) — Inspiration for the racing kerb top accent strip (`.apex-kerb-strip`), tabular monospace telemetry counters, live pulsing status indicator (`.live-dot`), and high-contrast sector status badges.
2. **MotorsportReg.com by Hagerty** ([https://www.motorsportreg.com/](https://www.motorsportreg.com/)) — Industry standard for track-day, time-attack, and HPDE event registration; inspired the structured **Official Run-Sheet & Session Schedule** timeline (Scrutineering → Drivers Briefing → Sighting Laps → Chequered Flag) and capacity progress bars.
3. **Porsche Track Precision App** ([https://www.porsche.com/](https://www.porsche.com/)) — Inspiration for dark-first paddock readability under twilight/night conditions and GPS coordinate telemetry cards.
4. **Luma (`lu.ma`) & Resident Advisor (`ra.co`)** — Inspiration for the glassmorphic sticky navigation bar (`backdrop-filter: blur(16px)`), `Ctrl+K` Command Search Palette modal, and floating ticket-style date badges (`OCT 24`) on event cards.
5. **W3C WCAG 2.1 AA & Modern Web Guidance** ([https://www.w3.org/TR/WCAG21/](https://www.w3.org/TR/WCAG21/)) — Guided the implementation of CSS `:user-invalid` / `:user-valid` post-interaction form validation, visible password rules above inputs, compositor-friendly `opacity`/`transform` animations, a Pause/Play button on the Hero Spotlight carousel, and `@media (prefers-reduced-motion: reduce)` support.

---

## 4. Photography & Media Asset Attributions (Unsplash License)

All event cover images, club logos, auth background panels, and user avatars are sourced from **Unsplash** ([https://unsplash.com/license](https://unsplash.com/license)), which grants an irrevocable, nonexclusive, worldwide copyright license to download, copy, modify, distribute, and use photos for free (including academic and commercial projects).

### 4.1 Event Cover & Club Photography (`src/data/seedData.js` & `database/seed.sql`)

| Asset / Event / Club Usage | Unsplash Photo ID | Direct Image URL |
| :--- | :--- | :--- |
| **Event #1:** Sandown Twilight Time Attack — Round 4 & **Club #1:** VicTimeAttack Motorsport | `photo-1568605117036-5fe5e7bab0b7` | `https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=900&auto=format&fit=crop&q=80` |
| **Event #2:** Calder Park Friday Night Drift Matsuri & **Club #3:** Calder Drift Syndicate | `photo-1544829099-b9a0c07fad1a` | `https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=900&auto=format&fit=crop&q=80` |
| **Event #3:** Docklands Underground JDM & Euro Night Meet & **Club #2:** Docklands JDM Collective | `photo-1603584173870-7f23fdae1b7a` | `https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=900&auto=format&fit=crop&q=80` |
| **Event #4:** Sepang Full Circuit Floodlit Track Night & **Club #4:** Sepang Night Attack MY & Hero/Auth Backdrop | `photo-1511919884226-fd3cad34687c` | `https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=900&auto=format&fit=crop&q=80` |
| **Event #5:** Kuching Waterfront & Borneo Touge Night Meet & **Club #5:** Borneo Touge Club | `photo-1552519507-da3b142c6e3d` | `https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&auto=format&fit=crop&q=80` |
| **Event #6:** Winton 300km Endurance & Sprint Festival | `photo-1580273916550-e323be2ae537` | `https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=900&auto=format&fit=crop&q=80` |
| **Event #7:** Genting Highlands Dawn Touge & Breakfast Run & **Club #6:** Klang Valley Midnight Runners | `photo-1583121274602-3e2820c69888` | `https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=900&auto=format&fit=crop&q=80` |
| **Event #8:** Calder Park 1/4 Mile Street Drag Wars | `photo-1492144534655-ae79c964c9d7` | `https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900&auto=format&fit=crop&q=80` |
| **Event #9:** Glenmarie Concours & Custom Build Showcase | `photo-1503376780353-7e6692767b70` | `https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&auto=format&fit=crop&q=80` |
| **Event #10:** Great Ocean Road Sunrise Coastal Cruise | `photo-1502877338535-766e1452684a` | `https://images.unsplash.com/photo-1502877338535-766e1452684a?w=900&auto=format&fit=crop&q=80` |
| **Event #11:** Phillip Island GP Circuit Spring Sprint (Past Event) | `photo-1536700503339-1e4b06520771` | `https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=900&auto=format&fit=crop&q=80` |
| **Event #12:** Kuching Autocross & Gymkhana Challenge Rd 2 (Past Event) | `photo-1617814076367-b759c7d7e738` | `https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=900&auto=format&fit=crop&q=80` |

### 4.2 Seeded User Profile Avatars (`src/data/seedData.js`)

| Seeded User Account | Unsplash Photo ID | Direct Image URL |
| :--- | :--- | :--- |
| **Jacob Pillai** (`admin@apexgrid.com`) | `photo-1535713875002-d1d0cf377fde` | `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80` |
| **Syed Rahman** (`organizer@apexgrid.com`) | `photo-1570295999919-56ceb5ecca61` | `https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=160&auto=format&fit=crop&q=80` |
| **Naveed Khan** (`naveed@apexgrid.com`) | `photo-1507003211169-0a1dd7228f2d` | `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80` |
| **Gibson Tan** (`member@apexgrid.com`) | `photo-1500648767791-00dcc994a43e` | `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80` |
| **Chloe Vance** (`chloe@apexgrid.com`) | `photo-1494790108377-be9c29b29330` | `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80` |
| **Amirul Hakim** (`amirul@apexgrid.com`) | `photo-1522075469751-3a6694fb2f61` | `https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&auto=format&fit=crop&q=80` |

---

## 5. University Infrastructure & Technical References

1. **Swinburne FSET FeeNIX — Mercury Web Server Documentation:**
   - URL: [https://feenix.swin.edu.au/help/?page=Mercury%20Web%20Server](https://feenix.swin.edu.au/help/?page=Mercury%20Web%20Server)
   - Key Specifications Applied: Apache + PHP 5.4 (`16M` memory limit), MariaDB 5.5 (`feenix-mariadb.swin.edu.au`), VPN requirement (`vpn.swin.edu.au`), SFTP deployment (`www/htdocs/`), and chmod permissions (`0711` directories / `0644` static files / `0600` PHP scripts).
2. **Haversine Great-Circle Distance Formula:**
   - Used in `api/index.php` and `src/services/localDb.js` to calculate exact kilometre distances between the user's browser Geolocation coordinates (or Melbourne/Sepang regional hub) and each circuit venue:
     $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
     where $r = 6371\text{ km}$.
