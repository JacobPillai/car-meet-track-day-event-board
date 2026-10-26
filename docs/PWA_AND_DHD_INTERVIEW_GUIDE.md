# ApexGrid — PWA, Offline Vault & D/HD Interview Guide (`COS30043`)

Complete README-style documentation of **Jacob Pillai's Advanced Feature** (**Progressive Web App + Offline Saved Events Vault**), the **D/HD Interest Registration draft**, recent **PWA Service Worker & Offline State fixes**, and a **step-by-step live demonstration & interview walkthrough**.

---

## Table of Contents

1. [D/HD Interest Registration Submission Text](#1-dhd-interest-registration-submission-text)
2. [What Was Built & Updated (Changelog Summary)](#2-what-was-built--updated-changelog-summary)
3. [Architecture of the PWA & Offline Saved Events Vault](#3-architecture-of-the-pwa--offline-saved-events-vault)
4. [Troubleshooting & Root-Cause Fixes Applied](#4-troubleshooting--root-cause-fixes-applied)
5. [Step-by-Step Live Demo Script (Video & Week 14 Interview)](#5-step-by-step-live-demo-script-video--week-14-interview)
6. [Likely D/HD Interview Code Modification Questions & Answers](#6-likely-dhd-interview-code-modification-questions--answers)

---

## 1. D/HD Interest Registration Submission Text

A ready-to-submit Word document has been generated at:
- **`docs/ApexGrid_DHD_Interest_Registration.docx`**

### Submission Copy (2–3 Lines + Context)
> **Project Interview & D/HD Interest Registration**  
> **Unit:** COS30043 Interface Design and Development (2026 HX08)  
> **Name:** Jacob Jayon Pillai  
> **Student ID:** `<insert your Student ID>`  
> **Project:** ApexGrid — Car Meet & Track-Day Event Board (Vue 3, Pinia, PHP/MySQL)
>
> **Planned advanced feature:**  
> I have implemented an installable Progressive Web App (PWA) with an offline saved-events vault for ApexGrid (`vite.config.js` + `src/composables/useOfflineEvents.js`). A Workbox service worker (`vite-plugin-pwa`) precaches the Vue 3 application shell and runtime-caches OpenStreetMap tiles and Google Fonts so the app installs and loads without a network connection. Members can pin event snapshots (venue, schedule, exact gate address, GPS coordinates, and organizer contact) from event cards, event detail pages, or in bulk from `/my-events` into a reactive local offline vault that displays live `online`/`offline` network state (`Navbar.vue` & `MyEventsView.vue`).

---

## 2. What Was Built & Updated (Changelog Summary)

| Area | File(s) | Summary of Work |
| :--- | :--- | :--- |
| **Team Attribution & Role Breakdown** | `src/views/AboutView.vue` | Updated all 4 team members' detailed technical descriptions, bulleted feature lists, and key files on `#/about` (Jacob Pillai, Syed Rahman, Naveed Khan, Gibson Tan). |
| **PWA Service Worker Auto-Update & Dev Cleanup** | `src/main.js` | Fixed stale PWA caching: automatically unregisters lingering Service Workers in `npm run dev` (`import.meta.env.DEV`), and in production/preview builds listens for `controllerchange` + triggers `reg.update()` so new builds immediately refresh in the browser/installed PWA. |
| **Reactive Browser Offline Detection** | `src/composables/useOfflineEvents.js` | Updated `updateOnlineStatus(event)` to inspect `event?.type === 'offline'` and `event?.type === 'online'` alongside `navigator.onLine`, ensuring instant reactivity across real network drops and DevTools offline simulation. |
| **Offline Saved Events Vault & UI Controls** | `src/composables/useOfflineEvents.js`, `src/components/EventCard.vue`, `src/views/EventDetailView.vue`, `src/views/MyEventsView.vue`, `src/components/Navbar.vue`, `src/components/Footer.vue` | Full offline pinning workflow: save/remove individual events on cards & detail views, bulk **"Save all 'Going' offline"** in `/my-events`, **Offline vault** tab with `Network: Online (Synced)` / `Network: Offline (Serving Local Vault)` status chip, header `Browser offline` banner (`.nav-offline-note`), and footer `Install ApexGrid` prompt. |
| **Unit Test Suite Hardening (300/300 Passing)** | `tests/unit/emailService.spec.js` | Stubbed `VITE_EMAILJS_*` environment variables in the "unconfigured" test case so all **19 spec files (300 tests)** pass even when local `.env` keys are present. |
| **D/HD Registration Document** | `docs/ApexGrid_DHD_Interest_Registration.docx` | Generated formatted `.docx` file ready for Canvas upload. |

---

## 3. Architecture of the PWA & Offline Saved Events Vault

### 3.1 Build-Time Service Worker & Workbox Caching (`vite.config.js`)
Configured via `VitePWA({ registerType: 'autoUpdate', ... })`:
1. **Web App Manifest (`dist/manifest.webmanifest`):**
   - Defines `name: "ApexGrid — Car Meet & Track-Day Event Board"`, `short_name: "ApexGrid"`, `display: "standalone"`, `theme_color: "#090b10"`, and maskable SVG icon (`pwa-icon.svg`).
2. **App-Shell Precaching (`workbox.globPatterns`):**
   - Precaches all compiled `.js`, `.css`, `.html`, `.svg`, `.jpg`, and `.woff2` bundles (`12 entries` in `dist/sw.js`) and binds SPA navigation fallback to `index.html`.
3. **Runtime Caching (`workbox.runtimeCaching`):**
   - **OpenStreetMap Raster Tiles (`osm-map-tiles`):** `CacheFirst` strategy caching up to `200` map tiles for `14 days` so previously viewed circuit maps render offline.
   - **Google Fonts (`google-fonts-cache`):** `CacheFirst` strategy caching font stylesheets and webfonts for `365 days`.

### 3.2 Reactive Composable & Local Vault (`src/composables/useOfflineEvents.js`)
Uses a module-scoped singleton pattern (`savedEvents`, `browserOnline`, `deferredInstallPrompt`, `isInstalledPwa`) shared across all Vue components:
- **`savedEvents` (`localStorage` key `apexgrid_offline_saved_events_v1`):** Stores full event snapshots together with a `saved_offline_at` ISO timestamp.
- **`toggleSaveOffline(eventObj)`:** Adds or removes an event from the offline vault and persists immediately to `localStorage`.
- **`isEventSavedOffline(eventId)` / `getOfflineEventById(eventId)`:** Powers the pressed state on buttons and serves the cached event snapshot on `/events/:id` when the API is unreachable offline.
- **`isOnline` (`computed`):** Reactively tracks browser connectivity via `window` `'online'` and `'offline'` events plus `navigator.onLine`.
- **`canInstallPwa` & `promptPwaInstall()`:** Captures the browser's `beforeinstallprompt` event so users can trigger native app installation from the footer's **Install ApexGrid** button.

### 3.3 Where It Appears in the UI
- **Event Card (`src/components/EventCard.vue`):** Button toggles between `Save offline` (`aria-label="Save for offline"`, `aria-pressed="false"`) and `Saved offline` (`aria-label="Remove from saved offline events"`, `aria-pressed="true"`), firing a toast notification.
- **Event Detail Page (`src/views/EventDetailView.vue`):** Button toggles between `Save for offline` and `Remove offline save` (`Event saved for offline viewing.` / `Offline save removed.`). If the user visits `#/events/:id` while offline and the API fails, `EventDetailView.vue` falls back to `getOfflineEventById(id)` and displays the `.detail-notice` banner: *"Saved offline — You’re viewing a saved snapshot. Event details and attendance may have changed. Comments and map tiles may need a connection."* with a **`Try loading latest details`** button.
- **Global Offline Banner (`src/App.vue`):** Whenever `!isOnline`, displays a banner directly below the navbar reading: *"Offline Mode Active — Serving cached data & `<N>` offline-pinned event(s) via Service Worker."* with a **`View Offline Saved Events (<N>)`** button routing to `/my-events`.
- **Member Portal (`src/views/MyEventsView.vue` — `#/my-events`):**
  - **Save all "Going" offline** header action pins every confirmed RSVP in one click.
  - **Offline vault (`<N>`)** tab lists all saved event snapshots with their `Offline ready` chip, venue, exact gate address, GPS coordinates, organizer contact, **Open cached event** link, **Remove** button, and **Clear vault** button.
  - **Live Network Chip:** Displays `Network: Online (Synced)` (green) when online and `Network: Offline (Serving Local Vault)` (accent orange) when offline.
- **Navbar (`src/components/Navbar.vue`):**
  - Displays a top status bar (`.nav-offline-note`) reading `Browser offline` whenever `!isOnline && !menuOpen`.
  - Inside the account/navigation menu (`.nav-panel`), displays `<N> saved for offline` under **My RSVPs & saved events** and shows `Browser online` / `Browser offline` in `.nav-connection`.
- **Footer (`src/components/Footer.vue`):**
  - Shows the live count `<N> event(s) saved for offline` and renders the **Install ApexGrid** button when `canInstallPwa` is true.

---

## 4. Troubleshooting & Root-Cause Fixes Applied

### Issue A: Why the Installed PWA Did Not Show Updated `AboutView.vue` Content
- **Symptom:** After editing `src/views/AboutView.vue` to add detailed team member contributions, opening the PWA still showed the older `AboutView.vue` text.
- **Root Cause:**
  1. The PWA Service Worker (`dist/sw.js`) precaches the production bundle from `dist/`. Editing source files in `src/` does not update `dist/` until `npm run build` is executed.
  2. When a Service Worker is already active on a port, it serves the cached `index.html` and old hashed JS bundle first while downloading the new Service Worker in the background. Without a `controllerchange` listener, the page did not automatically reload when the new Service Worker took control.
  3. If a Service Worker was ever registered on `localhost:5173`, running `npm run dev` on that port was intercepted by the old Service Worker cache.
- **Fix Applied (`src/main.js`):**
  ```js
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    if (import.meta.env.DEV) {
      navigator.serviceWorker.getRegistrations?.().then((registrations) => {
        registrations.forEach((reg) => reg.unregister())
      })
    } else {
      let refreshing = false
      navigator.serviceWorker.addEventListener?.('controllerchange', () => {
        if (refreshing) return
        refreshing = true
        window.location.reload()
      })
      navigator.serviceWorker.getRegistration?.().then((reg) => {
        reg?.update?.()
      })
    }
  }
  ```

### Issue B: `Browser offline` Indicator Under DevTools / Event Emulation
- **Symptom:** When simulating offline events in automated browser checks where `navigator.onLine` remained `true`, `updateOnlineStatus()` ignored the `'offline'` event type.
- **Fix Applied (`src/composables/useOfflineEvents.js`):**
  ```js
  const updateOnlineStatus = (event) => {
    if (event?.type === 'offline') {
      browserOnline.value = false
    } else if (event?.type === 'online') {
      browserOnline.value = true
    } else {
      browserOnline.value = navigator.onLine
    }
  }
  ```

---

## 5. Step-by-Step Live Demo Script (Video & Week 14 Interview)

Use these exact steps when recording your video demonstration or showing your tutor during the Week 14 interview:

### Step 1 — Build & Start the Production PWA Preview
*(Note: In Windows PowerShell, run `npx vite preview` directly so PowerShell does not strip `--port`)*
```powershell
cd D:\ApexGrid
npm run build
npx vite preview --port 4173 --host 127.0.0.1
```
Open **`http://127.0.0.1:4173/`** in Google Chrome.

### Step 2 — Show Service Worker, Manifest & Installability
1. Open Chrome DevTools (`F12`) $\rightarrow$ **Application** tab:
   - Click **Manifest** on the left sidebar to show `ApexGrid — Car Meet & Track-Day Event Board` and the maskable icon.
   - Click **Service Workers** to show `sw.js` with status **activated and is running**.
2. Scroll to the page footer on ApexGrid and point out:
   - The live counter: **`0 events saved for offline`**
   - The **`Install ApexGrid`** button (`.footer-install`).

### Step 3 — Pin Events to the Offline Vault
1. On the Home or Events page (`#/events`), click **`Save offline`** on an event card:
   - Point out the toast notification (`"... saved for offline."`), the button changing to **`Saved offline`** (`aria-pressed="true"`), and the footer counter incrementing to **`1 event saved for offline`**.
2. Sign in at `#/login` with **`member@apexgrid.com`** / **`Password123!`** (Gibson Tan).
3. Go to **`#/my-events`** (**My RSVPs & saved events**):
   - Click **`Save all "Going" offline`** in the top-right header.
   - It automatically switches to the **`Offline vault (4)`** tab and shows the green chip **`Network: Online (Synced)`** alongside each saved event's venue, exact gate address, GPS coordinates, and organizer contact.

### Step 4 — Demonstrate Full Offline Mode
1. In Chrome DevTools $\rightarrow$ **Network** tab (or **Application $\rightarrow$ Service Workers**), tick **Offline**:
   - Point out the **`Browser offline`** status banner appearing immediately at the top of the navbar (`.nav-offline-note`).
   - Point out the vault status chip changing to **`Network: Offline (Serving Local Vault)`**.
   - Open the top-right account menu (`.nav-account-toggle`) to show **`4 saved for offline`** and **`Browser offline`** at the bottom of the menu.
2. Click **`Open cached event`** on any card in the Offline Vault (e.g., `#/events/11`) or press **`Ctrl+R`** to reload the browser tab while still offline:
   - Show that the entire Vue app shell, stylesheets, and saved event telemetry load with zero network connection.
3. Untick **Offline** in DevTools to show the `Browser offline` banner disappear and the chip return to **`Network: Online (Synced)`**.

---

## 6. Likely D/HD Interview Code Modification Questions & Answers

During the D/HD interview, the assessor may ask you to explain or modify your advanced feature live. Here are the 3 most likely prompts and where to make the change:

1. **"Where is the `localStorage` key defined, and how would you limit the Offline Vault to a maximum of 5 saved events?"**
   - **File:** `src/composables/useOfflineEvents.js` (lines 9 & 66–80).
   - **How to modify:** Inside `toggleSaveOffline(eventObj)`, before `savedEvents.value.unshift(...)`, check `if (savedEvents.value.length >= 5) return false` (or `.slice(0, 5)`).
2. **"How does `EventDetailView.vue` still load an event when the user is offline and the API call fails?"**
   - **File:** `src/views/EventDetailView.vue` (inside `loadEvent()`, `catch` block).
   - **Explanation:** When `api.get('/events/' + route.params.id)` throws a network error, the `catch` block calls `getOfflineEventById(route.params.id)` from `useOfflineEvents.js`. If found, it sets `event.value = cached` and sets `usingOfflineFallback.value = true` so the user sees the saved snapshot banner.
3. **"How do you change how long OpenStreetMap tiles are cached by the Service Worker?"**
   - **File:** `vite.config.js` under `VitePWA({ workbox: { runtimeCaching: [...] } })` (lines 42–56).
   - **How to modify:** Change `maxAgeSeconds: 60 * 60 * 24 * 14` (14 days) or `maxEntries: 200` in the `osm-map-tiles` `CacheFirst` rule and run `npm run build`.
