<script setup>
import { ref } from 'vue'

const activeTab = ref('architecture')
</script>

<template>
  <div class="container py-4">
    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb" class="mb-3">
      <ol class="breadcrumb small mb-0">
        <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
        <li class="breadcrumb-item active" aria-current="page">About ApexGrid</li>
      </ol>
    </nav>

    <!-- Page Header Banner -->
    <div class="apex-card p-4 p-md-5 mb-4 position-relative overflow-hidden">
      <div class="row align-items-center g-4">
        <div class="col-12 col-lg-8">
          <div class="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-danger bg-opacity-25 border border-danger border-opacity-50 text-uppercase small fw-bold mb-3">
            <span class="live-dot" aria-hidden="true"></span>
            <span>COS30043 Interface Design &amp; Development</span>
          </div>
          <h1 class="display-6 fw-bold mb-3 font-display">
            Engineered for <span class="text-danger">Motorsport Enthusiasts</span>, Powered by Vue 3
          </h1>
          <p class="lead text-body-secondary mb-0" style="max-width: 65ch">
            <strong>ApexGrid</strong> is a full-stack Car Meet, Drift, Drag &amp; Track-Day Event Board connecting
            sanctioned motorsport clubs, amateur racers, and automotive communities across
            <strong>Melbourne / Victoria (AU)</strong> and <strong>Sepang &amp; Sarawak (MY)</strong>.
          </p>
        </div>

        <div class="col-12 col-lg-4 text-center text-lg-end">
          <div class="p-3 rounded-4 bg-dark bg-opacity-50 border border-secondary border-opacity-50 d-inline-block text-start">
            <div class="small text-secondary font-mono text-uppercase mb-1">Project Telemetry</div>
            <div class="fw-bold fs-5 text-white mb-1"><i class="bi bi-mortarboard text-danger me-2"></i>Swinburne University</div>
            <div class="small text-body-secondary font-mono mb-2">Unit: COS30043 (Semester 2, 2026)</div>
            <span class="badge bg-danger-subtle text-danger font-mono">4-Person Group Capstone</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <ul class="nav nav-pills gap-2 mb-4" role="tablist">
      <li class="nav-item" role="presentation">
        <button
          type="button"
          class="nav-link"
          :class="{ active: activeTab === 'architecture', 'bg-danger': activeTab === 'architecture' }"
          @click="activeTab = 'architecture'"
        >
          <i class="bi bi-cpu-fill me-1" aria-hidden="true"></i>System Architecture &amp; Team Roles
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          type="button"
          class="nav-link"
          :class="{ active: activeTab === 'roadmap', 'bg-danger': activeTab === 'roadmap' }"
          @click="activeTab = 'roadmap'"
        >
          <i class="bi bi-rocket-takeoff-fill me-1" aria-hidden="true"></i>Phase 2 Scalability Roadmap
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          type="button"
          class="nav-link"
          :class="{ active: activeTab === 'a11y', 'bg-danger': activeTab === 'a11y' }"
          @click="activeTab = 'a11y'"
        >
          <i class="bi bi-universal-access-circle me-1" aria-hidden="true"></i>Accessibility &amp; WCAG 2.1 AA
        </button>
      </li>
    </ul>

    <!-- Tab 1: System Architecture & Team Allocation -->
    <section v-if="activeTab === 'architecture'" aria-label="System Architecture & Team Feature Allocation">
      <div class="row g-4 mb-4">
        <!-- 4 Team Member Feature Cards -->
        <div class="col-12 col-md-6 col-lg-3">
          <div class="apex-card p-4 h-100 border-top border-4 border-danger d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="badge bg-danger">Lead Full-Stack</span>
                <span class="small font-mono text-body-secondary">Week 12</span>
              </div>
              <h3 class="h5 fw-bold mb-1">Jacob Pillai</h3>
              <div class="text-danger small fw-semibold font-mono mb-3">PWA &amp; Social API Lead</div>
              <p class="small text-body-secondary mb-3">
                Architected the PWA service worker with offline venue caching, interactive RSVP &amp; Like system,
                comment ratings, and the "F1 Telemetry HUD" redesign.
              </p>
              <ul class="list-unstyled small text-body-secondary d-flex flex-column gap-1">
                <li><i class="bi bi-check2 text-danger me-1"></i>Vite PWA &amp; Workbox runtime</li>
                <li><i class="bi bi-check2 text-danger me-1"></i>Offline Saved Events Vault</li>
                <li><i class="bi bi-check2 text-danger me-1"></i>Dual-mode REST API client</li>
              </ul>
            </div>
            <div class="pt-3 border-top font-mono small text-secondary">
              Key File: <code>useOfflineEvents.js</code>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6 col-lg-3">
          <div class="apex-card p-4 h-100 border-top border-4 border-warning d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="badge bg-warning text-dark">Backend &amp; State</span>
                <span class="small font-mono text-body-secondary">Week 12</span>
              </div>
              <h3 class="h5 fw-bold mb-1">Syed Rahman</h3>
              <div class="text-warning small fw-semibold font-mono mb-3">Auth, DB &amp; Pinia Lead</div>
              <p class="small text-body-secondary mb-3">
                Engineered the 7-table MySQL schema for Mercury MariaDB 5.5, PHP 5.4+ REST endpoints,
                pure-PHP HMAC-SHA256 JWT auth, and Pinia persisted stores.
              </p>
              <ul class="list-unstyled small text-body-secondary d-flex flex-column gap-1">
                <li><i class="bi bi-check2 text-warning me-1"></i>PHP 5.4+ PDO REST API</li>
                <li><i class="bi bi-check2 text-warning me-1"></i>Pinia Auth &amp; Event Stores</li>
                <li><i class="bi bi-check2 text-warning me-1"></i>Vue Router RBAC Guards</li>
              </ul>
            </div>
            <div class="pt-3 border-top font-mono small text-secondary">
              Key File: <code>authStore.js / jwt.php</code>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6 col-lg-3">
          <div class="apex-card p-4 h-100 border-top border-4 border-info d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="badge bg-info text-dark">Frontend &amp; Geo</span>
                <span class="small font-mono text-body-secondary">Week 12</span>
              </div>
              <h3 class="h5 fw-bold mb-1">Naveed Khan</h3>
              <div class="text-info small fw-semibold font-mono mb-3">Map &amp; Calendar Lead</div>
              <p class="small text-body-secondary mb-3">
                Implemented the Leaflet.js interactive circuit map with OpenStreetMap tiles, FullCalendar
                schedule grid/list views, and Haversine distance calculator.
              </p>
              <ul class="list-unstyled small text-body-secondary d-flex flex-column gap-1">
                <li><i class="bi bi-check2 text-info me-1"></i>Leaflet custom category pins</li>
                <li><i class="bi bi-check2 text-info me-1"></i>FullCalendar v6 month/list</li>
                <li><i class="bi bi-check2 text-info me-1"></i>AU &amp; MY regional jump</li>
              </ul>
            </div>
            <div class="pt-3 border-top font-mono small text-secondary">
              Key File: <code>EventMap.vue / ExploreView.vue</code>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6 col-lg-3">
          <div class="apex-card p-4 h-100 border-top border-4 border-success d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="badge bg-success">QA &amp; Analytics</span>
                <span class="small font-mono text-body-secondary">Week 12</span>
              </div>
              <h3 class="h5 fw-bold mb-1">Gibson Tan</h3>
              <div class="text-success small fw-semibold font-mono mb-3">Analytics &amp; Testing Lead</div>
              <p class="small text-body-secondary mb-3">
                Engineered the Organizer Analytics Dashboard with 3 Chart.js reactive visualisations,
                and built the Vitest automated component test suite.
              </p>
              <ul class="list-unstyled small text-body-secondary d-flex flex-column gap-1">
                <li><i class="bi bi-check2 text-success me-1"></i>Chart.js / vue-chartjs charts</li>
                <li><i class="bi bi-check2 text-success me-1"></i>Vitest unit test suite</li>
                <li><i class="bi bi-check2 text-success me-1"></i>Capacity utilization telemetry</li>
              </ul>
            </div>
            <div class="pt-3 border-top font-mono small text-secondary">
              Key File: <code>OrganizerDashboardView.vue</code>
            </div>
          </div>
        </div>
      </div>

      <!-- Technical Architecture Highlights -->
      <div class="apex-card p-4">
        <h2 class="h5 fw-bold mb-3">
          <i class="bi bi-diagram-3-fill text-danger me-2" aria-hidden="true"></i>
          Technical Architecture &amp; Mercury Compatibility
        </h2>
        <div class="row g-4">
          <div class="col-12 col-md-4">
            <h3 class="h6 fw-bold text-white mb-2">1. Mercury Server Compatibility</h3>
            <p class="small text-body-secondary mb-0">
              Engineered specifically for Swinburne's <strong>Mercury Web Server</strong> (Apache + PHP 5.4 + MariaDB 5.5).
              Uses <code>createWebHashHistory()</code> so virtual routes never 404 on page refresh, and query routing
              (<code>api/index.php?endpoint=/events</code>) to eliminate Apache <code>mod_rewrite</code> dependency.
            </p>
          </div>
          <div class="col-12 col-md-4">
            <h3 class="h6 fw-bold text-white mb-2">2. Dual-Mode API Engine</h3>
            <p class="small text-body-secondary mb-0">
              When deployed to Mercury, calls PDO PHP REST scripts. During local <code>npm run dev</code> on machines
              without PHP/MySQL installed, <code>src/services/api.js</code> automatically routes requests through a stateful
              <code>localStorage</code>-backed relational database engine (<code>localDb.js</code>) with identical responses.
            </p>
          </div>
          <div class="col-12 col-md-4">
            <h3 class="h6 fw-bold text-white mb-2">3. Role-Based Visibility Engine</h3>
            <p class="small text-body-secondary mb-0">
              Public guests can browse events and view venue overviews. Exact paddock gate addresses and direct clerk-of-course
              contacts are masked by the backend and unlocked only for authenticated members to prevent overcrowding at private meets.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Tab 2: Phase 2 Scalability Roadmap (Scoping Brief Recommendation) -->
    <section v-else-if="activeTab === 'roadmap'" aria-label="Phase 2 Scalability Roadmap">
      <div class="apex-card p-4 mb-4">
        <div class="d-flex align-items-center gap-2 mb-2">
          <span class="badge bg-warning text-dark font-mono">Future Scalability Brief</span>
          <span class="small text-body-secondary">Planned Expansion Phases</span>
        </div>
        <h2 class="h4 fw-bold mb-2">Extending ApexGrid Beyond Events</h2>
        <p class="text-body-secondary small mb-4" style="max-width: 75ch">
          As noted in our project scoping analysis, combining parts trading, workshop locators, and event boards simultaneously
          would overload a 5–10 minute demonstration. ApexGrid established the core event telemetry platform first, with the
          following commercial and technical extensions architected for Phase 2:
        </p>

        <div class="row g-4">
          <!-- Phase 2.1: Specialty Workshop Locator -->
          <div class="col-12 col-md-6">
            <div class="p-3 rounded-3 border h-100" style="background-color: var(--apex-bg-elevated)">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="badge bg-danger">Phase 2.1</span>
                <span class="badge bg-secondary-subtle text-body-secondary font-mono">Q1 2027</span>
              </div>
              <h3 class="h5 fw-bold mb-2">
                <i class="bi bi-tools text-danger me-2" aria-hidden="true"></i>
                Track-Prep Workshop &amp; Dyno Tuner Locator
              </h3>
              <p class="small text-body-secondary mb-3">
                Connect drivers with verified performance garages specializing in motorsport preparation:
              </p>
              <ul class="small text-body-secondary ps-3 mb-0 d-flex flex-column gap-1">
                <li><strong>CAMS / Motorsport Australia Scrutineering:</strong> Find garages certified for roll-cage tagging, harness installation, and extinguisher checks.</li>
                <li><strong>Wheel Alignment &amp; Corner Weighting:</strong> Directory of shops with optical alignment rigs tuned for track camber/toe settings.</li>
                <li><strong>Dyno Tuning &amp; Logbook Checks:</strong> Community ratings, dyno sheet uploads, and verified customer reviews.</li>
              </ul>
            </div>
          </div>

          <!-- Phase 2.2: Used Track Parts Swap Board -->
          <div class="col-12 col-md-6">
            <div class="p-3 rounded-3 border h-100" style="background-color: var(--apex-bg-elevated)">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="badge bg-warning text-dark">Phase 2.2</span>
                <span class="badge bg-secondary-subtle text-body-secondary font-mono">Q2 2027</span>
              </div>
              <h3 class="h5 fw-bold mb-2">
                <i class="bi bi-boxes text-warning me-2" aria-hidden="true"></i>
                Used Track Parts &amp; JDM Swap Board
              </h3>
              <p class="small text-body-secondary mb-3">
                A community-governed swap board specifically for track tyres, spare wheels, and performance take-offs:
              </p>
              <ul class="small text-body-secondary ps-3 mb-0 d-flex flex-column gap-1">
                <li><strong>Paddock Pick-Up Points:</strong> Coordinate delivery at upcoming track days (e.g. "Bring to Sandown Round 4").</li>
                <li><strong>Verified PCD &amp; Fitment Matching:</strong> Automatic compatibility checks based on the car registered in the driver's profile.</li>
                <li><strong>Track Tyre Trading:</strong> Used semi-slicks, scrubs, and wet tyres with tread-depth inspection photos.</li>
              </ul>
            </div>
          </div>

          <!-- Phase 2.3: Live Timing Transponder Telemetry -->
          <div class="col-12 col-md-12">
            <div class="p-3 rounded-3 border" style="background-color: var(--apex-bg-elevated)">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="badge bg-info text-dark">Phase 2.3</span>
                <span class="badge bg-secondary-subtle text-body-secondary font-mono">Q3 2027</span>
              </div>
              <h3 class="h5 fw-bold mb-2">
                <i class="bi bi-stopwatch text-info me-2" aria-hidden="true"></i>
                Real-Time Circuit Transponder Telemetry (Mylaps / Dorian Integration)
              </h3>
              <p class="small text-body-secondary mb-0">
                WebSockets streaming gateway connecting timing loops at Sandown and Sepang directly to user dashboards,
                automatically linking personal best lap times to completed event reviews in the driver's profile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Tab 3: Accessibility & Engineering Standards -->
    <section v-else aria-label="Accessibility & Engineering Standards">
      <div class="apex-card p-4">
        <h2 class="h5 fw-bold mb-3">
          <i class="bi bi-shield-check text-success me-2" aria-hidden="true"></i>
          WCAG 2.1 AA Compliance &amp; Modern Web Guidance
        </h2>
        <div class="row g-4">
          <div class="col-12 col-md-6">
            <h3 class="h6 fw-bold text-white mb-2">1. Accessible Form Validation UX</h3>
            <p class="small text-body-secondary mb-2">
              Forms use CSS <code>:user-invalid</code> and <code>:user-valid</code> selectors so validation errors only appear
              after user interaction. Input requirement hints are placed <em>above</em> fields and synchronized with
              <code>aria-describedby</code>, <code>aria-errormessage</code>, and <code>aria-invalid</code>.
            </p>
          </div>
          <div class="col-12 col-md-6">
            <h3 class="h6 fw-bold text-white mb-2">2. Motion &amp; Animation Ergonomics</h3>
            <p class="small text-body-secondary mb-2">
              All animations (skeleton shimmer, page transitions, spotlight carousel) animate only compositor-friendly
              <code>opacity</code> and <code>transform</code> properties. A Pause/Play button is provided for the Hero carousel,
              and all motion respects <code>@media (prefers-reduced-motion: reduce)</code>.
            </p>
          </div>
          <div class="col-12 col-md-6">
            <h3 class="h6 fw-bold text-white mb-2">3. Tabular Monospace Readability</h3>
            <p class="small text-body-secondary mb-2">
              Numeric telemetry—including countdown timers, prices, GPS coordinates, and RSVP capacity percentages—uses
              <code>JetBrains Mono</code> with <code>font-variant-numeric: tabular-nums</code> to ensure jitter-free race telemetry.
            </p>
          </div>
          <div class="col-12 col-md-6">
            <h3 class="h6 fw-bold text-white mb-2">4. Zero-Dependency Offline Resilience</h3>
            <p class="small text-body-secondary mb-2">
              The PWA Service Worker caches OpenStreetMap tiles and Google Fonts locally. Drivers can pin any event to their
              Offline Vault to view schedules and gate coordinates at remote tracks with zero cellular reception.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
