<script setup>
import { computed, nextTick, ref } from 'vue'
import { useOfflineEvents } from '../composables/useOfflineEvents'
import { resetLocalDb, exportLocalDbJson } from '../services/localDb'
import { getApiEngineTelemetry } from '../services/api'

const { canInstallPwa, promptPwaInstall, savedEvents } = useOfflineEvents()
const showCredits = ref(false)
const creditsToggle = ref(null)
const installing = ref(false)
const installError = ref('')
const engineTelemetry = computed(() => getApiEngineTelemetry())
const discoveryLinks = [
  { to: '/', label: 'Home' },
  { to: '/events', label: 'Browse events' },
  { to: '/explore', label: 'Map & calendar' },
  { to: '/clubs', label: 'Car clubs' },
  { to: '/about', label: 'About ApexGrid' }
]
const accountLinks = [
  { to: '/login', label: 'Sign in' },
  { to: '/my-events', label: 'My RSVPs & saved events' },
  { to: '/dashboard', label: 'Organizer dashboard' },
  { to: '/admin', label: 'Admin moderation' }
]

async function closeCredits() {
  showCredits.value = false
  await nextTick()
  creditsToggle.value?.focus()
}

async function installApp() {
  if (installing.value) return
  installing.value = true
  installError.value = ''
  try {
    await promptPwaInstall()
  } catch {
    installError.value = 'The install prompt could not open. Please try again.'
  } finally {
    installing.value = false
  }
}

function handleResetSeedData() {
  if (window.confirm('Reset the local demo database? This replaces local accounts, events, RSVPs, likes and comments with the original seed data. It does not reset the server database or your offline-saved events.')) {
    resetLocalDb()
    window.location.reload()
  }
}

function handleExportDbSnapshot() {
  const json = exportLocalDbJson()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `apexgrid-db-snapshot-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <footer class="site-footer" aria-label="Site footer">
    <div class="container">
      <div class="footer-main">
        <div class="footer-intro">
          <router-link to="/" class="footer-brand" aria-label="ApexGrid home">
            <span class="footer-mark" aria-hidden="true"><span></span><span></span><span></span></span>
            <span>APEXGRID</span>
          </router-link>
          <p class="footer-tagline">Good cars. Better company.</p>
          <p class="footer-description">Find car meets, shows, drives and track days across Australia and Malaysia. Find your people along the way.</p>
          <div class="footer-offline">
            <i class="bi bi-bookmark" aria-hidden="true"></i>
            <span>{{ savedEvents.length }} {{ savedEvents.length === 1 ? 'event' : 'events' }} saved for offline</span>
          </div>
          <button v-if="canInstallPwa" type="button" class="footer-install" :disabled="installing" @click="installApp">
            <i class="bi bi-download" aria-hidden="true"></i>
            {{ installing ? 'Opening install prompt…' : 'Install ApexGrid' }}
          </button>
          <p v-if="installError" class="footer-error" role="alert">{{ installError }}</p>
        </div>
        <nav aria-label="Footer discovery" class="footer-links">
          <h2>Find your next gathering</h2>
          <ul>
            <li v-for="link in discoveryLinks" :key="link.to"><router-link :to="link.to">{{ link.label }}</router-link></li>
          </ul>
        </nav>
        <nav aria-label="Footer account" class="footer-links">
          <h2>Your ApexGrid</h2>
          <ul>
            <li v-for="link in accountLinks" :key="link.to"><router-link :to="link.to">{{ link.label }}</router-link></li>
          </ul>
          <p class="footer-access-note">Organizer and admin tools require the appropriate account role.</p>
        </nav>
      </div>

      <div class="footer-resources">
        <button ref="creditsToggle" type="button" class="footer-text-button" :aria-expanded="showCredits" aria-controls="apex-footer-credits" @click="showCredits = !showCredits">
          Sources &amp; credits <i class="bi" :class="showCredits ? 'bi-dash' : 'bi-plus'" aria-hidden="true"></i>
        </button>
        <div class="footer-demo-tools">
          <span class="footer-engine-pill" title="Active Dual-Mode Database & REST API Engine">
            <i class="bi bi-hdd-network me-1" aria-hidden="true"></i>
            DB Engine: {{ engineTelemetry.label }}
          </span>
          <button type="button" class="footer-text-button footer-reset" title="Export 7-table relational DB state as JSON" @click="handleExportDbSnapshot">Export DB (.json)</button>
          <button type="button" class="footer-text-button footer-reset" title="Restore the local demo database to its original seed data" @click="handleResetSeedData">Reset seed database</button>
        </div>
      </div>

      <section v-if="showCredits" id="apex-footer-credits" class="footer-credits" aria-labelledby="apex-footer-credits-title" @keydown.esc.stop.prevent="closeCredits">
        <div class="footer-credits-heading">
          <h2 id="apex-footer-credits-title">Sources &amp; credits</h2>
          <button type="button" class="footer-close" aria-label="Close credits panel" @click="closeCredits"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
        </div>
        <p>Academic references and third-party attributions are recorded in the project's <code>CREDITS.md</code>. Dependency versions are listed in <code>package.json</code> and its lockfile.</p>
        <div class="footer-credit-columns">
          <div>
            <h3>Built with</h3>
            <p>Vue, Vue Router, Pinia, Vite, Bootstrap &amp; Bootstrap Icons, Leaflet, FullCalendar, Chart.js &amp; vue-chartjs, vite-plugin-pwa &amp; Workbox, Vitest &amp; Vue Test Utils.</p>
            <p>Map data © OpenStreetMap contributors. Mapping data and software have their own licence terms; see the project credits.</p>
          </div>
          <div>
            <h3>Type &amp; design</h3>
            <p>Space Grotesk, Inter and JetBrains Mono from Google Fonts (SIL Open Font License). Earlier design references include Formula 1 timing, Porsche Track Precision, MotorsportReg and Speedhunters.</p>
            <p>The current direction is community-first automotive: photography, confident type and quieter controls.</p>
          </div>
          <div>
            <h3>Photography &amp; project</h3>
            <p>Seed event and club image URLs are documented in <code>CREDITS.md</code> as Unsplash sources. The homepage photograph's source and licence still need verification.</p>
            <p>Built for COS30043 at Swinburne, with a PHP/MariaDB API and a local demo-data fallback. Deployment and live-service operation are not established by this page.</p>
          </div>
        </div>
      </section>

      <div class="footer-wordmark" aria-hidden="true">APEX<span>GRID</span></div>

      <div class="footer-bottom">
        <p>COS30043 · Interface Design &amp; Development</p>
        <p>Made by Jacob, Syed, Naveed &amp; Gibson</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  --footer-bg: #141413;
  --footer-text: #f4f1eb;
  --footer-muted: #b6b2aa;
  --footer-line: #363530;
  --footer-accent: #ff5a1f;
  margin-top: 4rem;
  padding: 3.5rem 0 1.25rem;
  background: var(--footer-bg);
  color: var(--footer-text);
  border-top: 1px solid var(--footer-line);
}
[data-bs-theme='light'] .site-footer {
  --footer-bg: #eeebe4;
  --footer-text: #25241f;
  --footer-muted: #615d54;
  --footer-line: #cec8bc;
  --footer-accent: #c2410c;
}
.footer-main { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 3.5rem; padding-bottom: 2.5rem; }
.footer-intro { max-width: 26rem; }
.footer-brand { display: inline-flex; align-items: center; gap: .75rem; color: var(--footer-text); font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.2rem; letter-spacing: .06em; text-decoration: none; min-height: 44px; }
.footer-mark { display: flex; align-items: center; gap: 3px; width: 28px; height: 25px; transform: skewX(-20deg); }
.footer-mark span { width: 6px; height: 17px; background: currentColor; }
.footer-mark span:nth-child(2) { height: 24px; }
.footer-mark span:last-child { height: 12px; color: var(--footer-accent); }
.footer-tagline { font-family: 'JetBrains Mono', ui-monospace, monospace; font-weight: 700; text-transform: uppercase; letter-spacing: -.04em; font-size: 1.25rem; margin: 1rem 0 .6rem; }
.footer-description, .footer-access-note, .footer-credits p { color: var(--footer-muted); line-height: 1.7; font-size: .875rem; }
.footer-description { margin-bottom: 1.25rem; }
.footer-offline { display: flex; align-items: center; gap: .6rem; color: var(--footer-muted); font-size: .8rem; }
.footer-install { margin-top: 1rem; min-height: 44px; padding: .5rem 1rem; border: 1px solid var(--footer-line); border-radius: 0; background: transparent; color: var(--footer-text); font: 700 .75rem 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .06em; text-transform: uppercase; display: inline-flex; gap: .6rem; align-items: center; }
.footer-install:disabled { opacity: .65; cursor: wait; }
.footer-error { color: var(--footer-accent); font-size: .85rem; margin: .75rem 0 0; }
.footer-links h2 { display: flex; align-items: center; gap: .6rem; font: 600 .7rem 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .12em; text-transform: uppercase; margin: .85rem 0 1rem; }
.footer-links h2::before { content: ''; flex: none; width: 6px; height: 6px; background: var(--footer-accent); }
.footer-links ul { padding: 0; margin: 0; list-style: none; }
.footer-links a { color: var(--footer-muted); text-decoration: none; display: inline-flex; align-items: center; min-height: 44px; font-size: .875rem; }
.footer-links a:hover, .footer-brand:hover, .footer-text-button:hover { color: var(--footer-accent); }
.footer-access-note { font-size: .75rem; max-width: 24ch; margin: .75rem 0 0; }
.footer-resources { border-top: 1px solid var(--footer-line); border-bottom: 1px solid var(--footer-line); display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: .65rem 0; }
.footer-text-button { min-height: 44px; border: 0; padding: .5rem 0; background: transparent; color: var(--footer-text); font-size: .8rem; display: inline-flex; align-items: center; gap: .75rem; text-align: left; }
.footer-demo-tools { display: flex; flex-wrap: wrap; align-items: center; gap: .25rem 1.25rem; min-width: 0; }
.footer-wordmark { margin: 2rem 0 .5rem; overflow: hidden; color: var(--footer-text); font: 700 clamp(2.4rem, 17vw, 14rem)/.85 'JetBrains Mono', ui-monospace, monospace; letter-spacing: -.07em; text-align: center; white-space: nowrap; user-select: none; }
.footer-wordmark span { color: var(--footer-accent); }
.footer-demo-tools > span { color: var(--footer-muted); font-size: .75rem; }
.footer-reset { color: var(--footer-muted); text-decoration: underline; text-underline-offset: 4px; }
.footer-credits { padding: 1.5rem 0; border-bottom: 1px solid var(--footer-line); }
.footer-credits-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.footer-credits h2 { font-size: 1.2rem; margin: 0; }
.footer-credits h3 { font-size: .9rem; margin: .75rem 0; }
.footer-credits code { color: var(--footer-text); overflow-wrap: anywhere; }
.footer-close { width: 44px; height: 44px; flex-shrink: 0; background: transparent; color: var(--footer-text); border: 1px solid var(--footer-line); border-radius: 50%; }
.footer-credit-columns { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2rem; }
.footer-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .5rem 2rem; padding-top: 1.25rem; color: var(--footer-muted); font-size: .75rem; }
.footer-bottom p { margin: 0; }
.site-footer :is(a, button):focus-visible { outline: 2px solid var(--footer-accent); outline-offset: 4px; }
@media (max-width: 991px) {
  .footer-main { grid-template-columns: 1.2fr 1fr 1fr; gap: 1.75rem; }
  .footer-credit-columns { grid-template-columns: 1fr; gap: .5rem; }
}
@media (max-width: 767px) {
  .site-footer { margin-top: 2.5rem; padding-top: 2.5rem; }
  .footer-main { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.75rem 1.25rem; }
  .footer-intro { grid-column: 1 / -1; }
  .footer-links h2 { line-height: 1.5; }
  .footer-resources { align-items: flex-start; flex-direction: column; gap: 0; }
  .footer-demo-tools { flex-direction: column; align-items: flex-start; width: 100%; gap: 0; }
  .footer-engine-pill { display: block; padding: .5rem 0; line-height: 1.5; overflow-wrap: anywhere; }
  .footer-bottom { flex-direction: column; }
}
</style>
