<script setup>
import { ref } from 'vue'
import { useOfflineEvents } from '../composables/useOfflineEvents'
import { resetLocalDb } from '../services/localDb'

const { canInstallPwa, promptPwaInstall, savedEvents } = useOfflineEvents()
const showCreditsModal = ref(false)

function handleResetSeedData() {
  if (
    typeof window !== 'undefined' &&
    window.confirm('Reset local database back to initial seeded Australia & Malaysia events?')
  ) {
    resetLocalDb()
    window.location.reload()
  }
}
</script>

<template>
  <footer class="border-top mt-5 py-4" style="background-color: var(--apex-bg-surface)">
    <div class="container">
      <div class="row g-4 align-items-start">
        <div class="col-12 col-md-5">
          <div class="d-flex align-items-center gap-2 fw-bold fs-5 mb-2">
            <span class="badge bg-danger"><i class="bi bi-speedometer2"></i></span>
            <span>APEX<span class="text-danger">GRID</span></span>
            <span class="badge bg-secondary-subtle text-body-secondary font-monospace" style="font-size: 0.68rem">
              v2.0 TELEMETRY
            </span>
          </div>
          <p class="text-body-secondary small mb-2">
            Community Car Meet, Drift, Drag &amp; Track-Day Event Board connecting motorsport
            organizers and drivers across <strong>Melbourne / Victoria (AU)</strong> and
            <strong>Sepang &amp; Sarawak (MY)</strong>.
          </p>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <button
              v-if="canInstallPwa"
              type="button"
              class="btn btn-sm btn-apex"
              @click="promptPwaInstall"
            >
              <i class="bi bi-download me-1" aria-hidden="true"></i>Install ApexGrid PWA
            </button>
            <span class="badge bg-secondary-subtle text-body-secondary font-monospace">
              <i class="bi bi-cloud-check me-1 text-success" aria-hidden="true"></i>
              Offline Vault: {{ savedEvents.length }} Event(s)
            </span>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary py-0 px-2"
              @click="showCreditsModal = !showCreditsModal"
            >
              <i class="bi bi-journal-code me-1" aria-hidden="true"></i>Sources &amp; Credits
            </button>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <h2 class="h6 fw-bold text-uppercase mb-2">Platform Navigation</h2>
          <ul class="list-unstyled small mb-0 d-flex flex-column gap-1">
            <li><router-link to="/" class="text-decoration-none text-body-secondary">Home</router-link></li>
            <li><router-link to="/events" class="text-decoration-none text-body-secondary">Browse All Events</router-link></li>
            <li><router-link to="/explore" class="text-decoration-none text-body-secondary">Interactive Map &amp; Calendar</router-link></li>
            <li><router-link to="/clubs" class="text-decoration-none text-body-secondary">Verified Car Clubs (6)</router-link></li>
            <li><router-link to="/about" class="text-decoration-none text-body-secondary">About &amp; Phase 2 Roadmap</router-link></li>
          </ul>
        </div>

        <div class="col-6 col-md-4">
          <h2 class="h6 fw-bold text-uppercase mb-2">Account Portals &amp; COS30043</h2>
          <ul class="list-unstyled small mb-2 d-flex flex-column gap-1">
            <li><router-link to="/login" class="text-decoration-none text-body-secondary">Guest Sign In / Register</router-link></li>
            <li><router-link to="/my-events" class="text-decoration-none text-body-secondary">Member RSVPs &amp; Offline Vault</router-link></li>
            <li><router-link to="/dashboard" class="text-decoration-none text-body-secondary">Organizer Analytics Dashboard</router-link></li>
            <li><router-link to="/admin" class="text-decoration-none text-body-secondary">Admin Moderation Panel</router-link></li>
          </ul>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            title="Restore default seed data if modified during testing"
            @click="handleResetSeedData"
          >
            <i class="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>Reset Seed Database
          </button>
        </div>
      </div>

      <!-- Collapsible Academic Sources & Credits Drawer -->
      <div v-if="showCreditsModal" class="mt-4 p-3 rounded-3 border small" style="background-color: var(--apex-bg-elevated)">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h3 class="h6 fw-bold mb-0">
            <i class="bi bi-award-fill text-warning me-2" aria-hidden="true"></i>
            Academic Report Sources, Media Credits &amp; Open-Source Attributions (See <code>CREDITS.md</code>)
          </h3>
          <button
            type="button"
            class="btn-close btn-sm"
            aria-label="Close credits panel"
            @click="showCreditsModal = false"
          ></button>
        </div>
        <div class="row g-3 text-body-secondary" style="font-size: 0.78rem">
          <div class="col-12 col-md-4">
            <strong class="text-body d-block mb-1">Frameworks &amp; Libraries (MIT):</strong>
            Vue 3.5, Vue Router 4, Pinia 3, Vite 6, Bootstrap 5.3 + Bootstrap Icons, Leaflet 1.9 + OpenStreetMap (ODbL), FullCalendar v6, Chart.js 4 + vue-chartjs, vite-plugin-pwa (Workbox), Vitest + Vue Test Utils.
          </div>
          <div class="col-12 col-md-4">
            <strong class="text-body d-block mb-1">Typography &amp; Visual Inspiration:</strong>
            Google Fonts (<code>Space Grotesk</code>, <code>Inter</code>, <code>JetBrains Mono</code> — SIL OFL 1.1). Motorsport UI inspired by Formula 1 Official Timing App, Porsche Track Precision App, MotorsportReg, and Speedhunters.
          </div>
          <div class="col-12 col-md-4">
            <strong class="text-body d-block mb-1">Photography &amp; Infrastructure:</strong>
            Event &amp; club photography sourced from Unsplash under the Unsplash License (full URLs documented in <code>CREDITS.md</code>). Deployed for Swinburne FeeNIX / Mercury Server (PHP 5.4+ / MariaDB 5.5).
          </div>
        </div>
      </div>

      <hr class="my-3 opacity-25" />

      <div class="d-flex flex-wrap justify-content-between align-items-center small text-body-secondary gap-2">
        <div>
          COS30043 Interface Design &amp; Development — Team: Jacob, Syed, Naveed &amp; Gibson
        </div>
        <div class="font-monospace" style="font-size: 0.75rem">
          Mercury Ready (Vue 3 + Pinia + Leaflet + FullCalendar + Chart.js + PWA + PHP/MariaDB)
        </div>
      </div>
    </div>
  </footer>
</template>
