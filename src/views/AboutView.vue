<script setup>
import { ref } from 'vue'

const activeTab = ref('architecture')
const tabs = [
  { id: 'architecture', label: 'Architecture & team' },
  { id: 'roadmap', label: 'Phase 2 roadmap' },
  { id: 'a11y', label: 'Accessibility' }
]

function onTabKeydown(event, index) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  let next
  if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
  else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = tabs.length - 1
  else return
  event.preventDefault()
  activeTab.value = tabs[next].id
  event.currentTarget.closest('[role="tablist"]').querySelectorAll('[role="tab"]')[next].focus()
}

const team = [
  {
    name: 'Jacob Pillai', area: 'Lead full-stack', role: 'PWA & Social API Lead',
    description: 'PWA service worker and offline venue caching, RSVP and likes, comment ratings, and the earlier “F1 Telemetry HUD” interface design.',
    features: ['Vite PWA & Workbox runtime', 'Offline saved events', 'Dual-mode REST API client'],
    file: 'useOfflineEvents.js'
  },
  {
    name: 'Syed Rahman', area: 'Backend & state', role: 'Auth, DB & Pinia Lead',
    description: 'Seven-table MySQL schema targeting Mercury MariaDB 5.5, PHP 5.4+ REST endpoints, pure-PHP HMAC-SHA256 JWT authentication, and persisted Pinia stores.',
    features: ['PHP 5.4+ PDO REST API', 'Pinia auth & event stores', 'Vue Router role-based guards'],
    file: 'authStore.js / jwt.php'
  },
  {
    name: 'Naveed Khan', area: 'Frontend & geo', role: 'Map & Calendar Lead',
    description: 'Leaflet.js venue map with OpenStreetMap tiles, FullCalendar schedule grid and list views, and Haversine distance calculation.',
    features: ['Leaflet category pins', 'FullCalendar v6 month/list', 'Australia & Malaysia region controls'],
    file: 'EventMap.vue / ExploreView.vue'
  },
  {
    name: 'Gibson Tan', area: 'QA & analytics', role: 'Analytics & Testing Lead',
    description: 'Organizer analytics with three Chart.js reactive visualisations and the Vitest automated component test suite.',
    features: ['Chart.js / vue-chartjs charts', 'Vitest unit tests', 'RSVP capacity utilisation'],
    file: 'OrganizerDashboardView.vue'
  }
]
</script>

<template>
  <div class="about-page">
    <div class="container about-shell">
      <nav aria-label="Breadcrumb" class="about-breadcrumb">
        <ol>
          <li><router-link to="/">Home</router-link></li>
          <li aria-current="page">About ApexGrid</li>
        </ol>
      </nav>

      <header class="about-header">
        <div>
          <p class="about-eyebrow">About ApexGrid / The project</p>
          <h1>Built around cars.<br /><span>Made for community.</span></h1>
          <p class="about-intro">
            From a first car meet to a weekend at the track, ApexGrid brings automotive communities
            together. Discover car meets, shows, cruises, drift, drag and track days across
            Melbourne / Victoria (AU) and Sepang &amp; Sarawak (MY).
          </p>
        </div>
        <aside class="about-project" aria-label="Academic project">
          <p class="about-eyebrow">A university group project</p>
          <h2>Swinburne University</h2>
          <dl>
            <div><dt>Unit</dt><dd>COS30043<br />Interface Design &amp; Development</dd></div>
            <div><dt>Period</dt><dd>Semester 2, 2026</dd></div>
            <div><dt>Team</dt><dd>4-person group capstone</dd></div>
          </dl>
        </aside>
      </header>

      <div class="about-tabs" role="tablist" aria-label="About the project" aria-orientation="horizontal">
        <button
          v-for="(tab, index) in tabs"
          :id="`about-tab-${tab.id}`"
          :key="tab.id"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.id"
          :aria-controls="`about-panel-${tab.id}`"
          :tabindex="activeTab === tab.id ? 0 : -1"
          @click="activeTab = tab.id"
          @keydown="onTabKeydown($event, index)"
        >
          <span class="about-tab-number" aria-hidden="true">0{{ index + 1 }}</span>
          {{ tab.label }}
        </button>
      </div>

      <section
        id="about-panel-architecture"
        role="tabpanel"
        aria-labelledby="about-tab-architecture"
        :hidden="activeTab !== 'architecture'"
        tabindex="0"
        class="about-panel"
      >
        <div class="about-section-heading">
          <p class="about-eyebrow">01 / People &amp; platform</p>
          <h2>One project. Four perspectives.</h2>
          <p>A Vue 3 full-stack event board, with team responsibilities recorded for the Week 12 academic submission.</p>
        </div>
        <div class="about-team">
          <article v-for="(member, index) in team" :key="member.name" class="about-member">
            <p class="about-kicker"><span aria-hidden="true">0{{ index + 1 }} / </span>{{ member.area }}</p>
            <h3>{{ member.name }}</h3>
            <p class="about-role">{{ member.role }}</p>
            <p>{{ member.description }}</p>
            <ul><li v-for="feature in member.features" :key="feature">{{ feature }}</li></ul>
            <p class="about-file">Key file <code>{{ member.file }}</code></p>
          </article>
        </div>

        <div class="about-section-heading about-technical-heading">
          <p class="about-eyebrow">Under the bonnet</p>
          <h2>Technical architecture.</h2>
          <p>Mercury compatibility is a design target, not a guarantee for every hosting environment.</p>
        </div>
        <div class="about-technical">
          <article>
            <h3>Mercury server compatibility</h3>
            <p>
              The academic hosting target is Swinburne's Mercury Web Server: Apache, PHP 5.4 and MariaDB 5.5.
              Vue Router uses <code>createWebHashHistory()</code> to avoid server-side route rewrites.
              Query routing through <code>api/index.php?endpoint=/events</code> avoids reliance on Apache
              <code>mod_rewrite</code>. Deployment still requires environment-specific checks.
            </p>
          </article>
          <article>
            <h3>Dual-mode API client</h3>
            <p>
              <code>src/services/api.js</code> can call the PDO PHP REST API on Mercury or when configured
              for PHP mode. Local development uses the stateful <code>localStorage</code>-backed
              <code>localDb.js</code> engine; some remote failures also fall back to it. Local data is
              separate from the server, not a synchronised copy or proof of backend availability.
            </p>
          </article>
          <article>
            <h3>Role-based access</h3>
            <p>
              Guests can browse events and venue overviews. Exact addresses and organizer contacts are
              intended for authenticated members, alongside member, organizer and admin route controls.
              UI visibility is not a security boundary; server authorization needs independent verification.
            </p>
          </article>
        </div>
      </section>

      <section
        id="about-panel-roadmap"
        role="tabpanel"
        aria-labelledby="about-tab-roadmap"
        :hidden="activeTab !== 'roadmap'"
        tabindex="0"
        class="about-panel"
      >
        <div class="about-section-heading">
          <p class="about-eyebrow">02 / Proposed, not implemented</p>
          <h2>Events first. Ideas for the road ahead.</h2>
          <p>
            The project scoping analysis kept the event board at the centre of a 5–10 minute demonstration,
            rather than combining parts trading, workshops and events at once. These Phase 2 concepts are
            proposals, not available features. The original 2027 windows are indicative, not delivery commitments.
          </p>
        </div>
        <div class="about-roadmap">
          <article class="about-roadmap-entry">
            <p class="about-kicker">Phase 2.1 <span>Proposed / Q1 2027</span></p>
            <div>
              <h3>Track-prep workshop &amp; dyno tuner locator</h3>
              <p>A proposed directory for motorsport preparation, with any garage credentials requiring a defined verification process.</p>
              <ul>
                <li><strong>CAMS / Motorsport Australia scrutineering:</strong> discover services for roll-cage tagging, harness installation and extinguisher checks; certification would need validation.</li>
                <li><strong>Wheel alignment &amp; corner weighting:</strong> find shops offering optical alignment and track camber/toe setup.</li>
                <li><strong>Dyno tuning &amp; logbook checks:</strong> explore community ratings, dyno sheet uploads and customer-review verification.</li>
              </ul>
            </div>
          </article>
          <article class="about-roadmap-entry">
            <p class="about-kicker">Phase 2.2 <span>Proposed / Q2 2027</span></p>
            <div>
              <h3>Used track parts &amp; JDM swap board</h3>
              <p>A community swap-board concept for track tyres, spare wheels and performance take-offs.</p>
              <ul>
                <li><strong>Paddock pick-up points:</strong> coordinate collection at upcoming track days.</li>
                <li><strong>PCD &amp; fitment matching:</strong> investigate compatibility checks against a future vehicle profile, not an existing fitment guarantee.</li>
                <li><strong>Track tyre trading:</strong> listings for semi-slicks, scrubs and wet tyres with tread-depth inspection photos.</li>
              </ul>
            </div>
          </article>
          <article class="about-roadmap-entry">
            <p class="about-kicker">Phase 2.3 <span>Proposed / Q3 2027</span></p>
            <div>
              <h3>Circuit timing integration</h3>
              <p>
                A proposed Mylaps / Dorian transponder integration using a WebSockets gateway for timing loops
                at venues such as Sandown and Sepang. The concept would link personal best laps to event
                reviews and driver profiles. It depends on provider access, venue permission and further technical scoping.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section
        id="about-panel-a11y"
        role="tabpanel"
        aria-labelledby="about-tab-a11y"
        :hidden="activeTab !== 'a11y'"
        tabindex="0"
        class="about-panel"
      >
        <div class="about-section-heading">
          <p class="about-eyebrow">03 / Access &amp; usability</p>
          <h2>A more considered experience.</h2>
          <p>
            WCAG 2.1 AA informs the project's accessibility goals. These engineering practices are not a
            conformance certification; keyboard, assistive-technology and contrast checks remain necessary.
          </p>
        </div>
        <div class="about-practices">
          <article>
            <p class="about-kicker">01 / Forms</p>
            <h3>Helpful validation, in context</h3>
            <p>
              The shared styles include <code>:user-invalid</code> and <code>:user-valid</code> for
              post-interaction feedback. Form guidance includes requirement hints and descriptive links
              using <code>aria-describedby</code> and <code>aria-errormessage</code>, with
              <code>aria-invalid</code> where validation state is exposed. Each form still needs individual review.
            </p>
          </article>
          <article>
            <p class="about-kicker">02 / Interaction</p>
            <h3>Keyboard access. Less motion.</h3>
            <p>
              This page has visible focus, labelled tabs and Arrow Left/Right, Home and End navigation.
              Tab moves from the selected tab into its panel. There is no automatic animation here.
              Shared reduced-motion styles use <code>prefers-reduced-motion: reduce</code>; animated
              components should be checked individually, favouring <code>opacity</code> and <code>transform</code> when motion is needed.
            </p>
          </article>
          <article>
            <p class="about-kicker">03 / Readability</p>
            <h3>Steady, readable numbers</h3>
            <p>
              The existing type system pairs Space Grotesk and Inter with JetBrains Mono for code and
              numeric details. <code>font-variant-numeric: tabular-nums</code> supports consistent digit
              widths for prices, coordinates and RSVP capacity figures without relying on decorative counters.
            </p>
          </article>
          <article>
            <p class="about-kicker">04 / Offline use</p>
            <h3>Saved details, with limits</h3>
            <p>
              Saved event snapshots are stored locally through <code>useOfflineEvents.js</code>.
              Vite PWA / Workbox configures caching for visited OpenStreetMap tiles and Google Fonts.
              Offline access depends on prior loading, service-worker readiness and browser storage;
              maps may be incomplete, saved details may be out of date, and live actions still need connectivity.
            </p>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  --about-bg: #181a19;
  --about-surface: #222523;
  --about-text: #f3f0e9;
  --about-muted: #b4b6af;
  --about-line: #41443f;
  --about-accent: #ff5a1f;
  color: var(--about-text);
  background: var(--about-bg);
}
[data-bs-theme='light'] .about-page {
  --about-bg: #f4f1ea;
  --about-surface: #e9e6de;
  --about-text: #242722;
  --about-muted: #5f625a;
  --about-line: #c8c9bf;
  --about-accent: #c2410c;
}
.about-shell { padding-top: 2rem; padding-bottom: clamp(3rem, 6vw, 5rem); }
.about-breadcrumb ol { display: flex; flex-wrap: wrap; gap: .6rem; padding: 0; margin: 0 0 2.5rem; list-style: none; color: var(--about-muted); font-size: .8rem; }
.about-breadcrumb li + li::before { content: '/'; margin-right: .6rem; }
.about-breadcrumb a { color: var(--about-muted); text-underline-offset: .25em; }
.about-breadcrumb a:hover { color: var(--about-text); }
.about-header { display: grid; grid-template-columns: minmax(0, 2fr) minmax(240px, 1fr); gap: clamp(2rem, 5vw, 5rem); align-items: end; padding-bottom: 3rem; }
.about-eyebrow { color: var(--about-accent); font-size: .72rem; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; margin: 0 0 1.2rem; }
.about-header h1 { font-size: clamp(2.5rem, 5.2vw, 4.8rem); line-height: 1.06; letter-spacing: -.055em; font-weight: 700; margin: 0 0 1.5rem; }
.about-header h1 span { color: var(--about-muted); }
.about-intro { max-width: 63ch; color: var(--about-muted); line-height: 1.8; margin: 0; }
.about-project { border-left: 1px solid var(--about-line); padding-left: 1.75rem; }
.about-project h2 { font-size: 1.25rem; margin: 0 0 1.5rem; }
.about-project dl { margin: 0; font-size: .8rem; }
.about-project dl > div { display: grid; grid-template-columns: 3.5rem minmax(0, 1fr); gap: .75rem; margin-top: .85rem; }
.about-project dt { color: var(--about-muted); font-weight: 400; }
.about-project dd { margin: 0; line-height: 1.6; }
.about-tabs { display: flex; border-block: 1px solid var(--about-line); }
.about-tabs button { display: flex; align-items: center; justify-content: center; gap: .6rem; flex: 1; min-width: 0; min-height: 58px; padding: 1rem; border: 0; border-bottom: 3px solid transparent; color: var(--about-muted); background: transparent; font: inherit; font-size: .875rem; font-weight: 600; }
.about-tabs button:hover { color: var(--about-text); background: var(--about-surface); }
.about-tabs button[aria-selected='true'] { color: var(--about-text); border-bottom-color: var(--about-accent); background: var(--about-surface); }
.about-tab-number { color: var(--about-accent); font-size: .7rem; font-variant-numeric: tabular-nums; }
.about-page :is(a, button, [tabindex]):focus-visible { outline: 3px solid var(--about-accent); outline-offset: 4px; box-shadow: none; }
.about-panel { padding-top: 2.75rem; }
.about-panel[hidden] { display: none; }
.about-section-heading { max-width: 78ch; margin-bottom: 2.5rem; }
.about-section-heading h2 { font-size: clamp(1.8rem, 3vw, 2.5rem); font-weight: 600; line-height: 1.15; margin: 0 0 1rem; }
.about-section-heading > p:last-child { color: var(--about-muted); line-height: 1.8; margin-bottom: 0; }
.about-team { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.75rem; }
.about-member { display: flex; flex-direction: column; min-width: 0; border-top: 1px solid var(--about-line); padding-top: 1.25rem; }
.about-page h3 { font-size: 1.25rem; font-weight: 600; line-height: 1.3; margin: 0 0 .75rem; }
.about-kicker { color: var(--about-accent); font-size: .72rem; font-weight: 600; margin: 0 0 1rem; }
.about-member .about-role { color: var(--about-text); font-size: .78rem; font-weight: 600; }
.about-member > p:not(.about-kicker, .about-role), .about-technical p, .about-roadmap-entry > div p, .about-practices article > p:last-child { color: var(--about-muted); font-size: .875rem; line-height: 1.8; }
.about-page ul { color: var(--about-muted); padding-left: 1.1rem; font-size: .82rem; line-height: 1.8; }
.about-page li + li { margin-top: .3rem; }
.about-member .about-file { margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--about-line); font-size: .7rem; }
.about-file code { display: block; margin-top: .35rem; }
.about-page code { color: var(--about-text); font-size: .9em; overflow-wrap: anywhere; }
.about-technical-heading { margin-top: 3.5rem; }
.about-technical { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--about-line); }
.about-technical p, .about-practices article > p:last-child { margin-bottom: 0; }
.about-roadmap-entry { display: grid; grid-template-columns: minmax(160px, 1fr) minmax(0, 3fr); gap: 2rem; border-top: 1px solid var(--about-line); padding: 2rem 0; }
.about-roadmap-entry .about-kicker span { display: block; color: var(--about-muted); font-weight: 400; margin-top: .5rem; }
.about-roadmap-entry ul { margin-bottom: 0; }
.about-roadmap-entry li + li { margin-top: .75rem; }
.about-roadmap-entry strong { color: var(--about-text); font-weight: 600; }
.about-practices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2.5rem 3rem; }
.about-practices article { border-top: 1px solid var(--about-line); padding-top: 1.5rem; }
@media (max-width: 991.98px) {
  .about-header { grid-template-columns: minmax(0, 1fr); align-items: start; }
  .about-project { border-left: 0; border-top: 1px solid var(--about-line); padding: 1.5rem 0 0; }
  .about-project dl { display: flex; flex-wrap: wrap; gap: 1rem 2rem; }
  .about-project dl > div { margin-top: 0; }
  .about-team { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2rem; }
  .about-technical { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 575.98px) {
  .about-shell { padding-top: 1.5rem; }
  .about-breadcrumb ol { margin-bottom: 2rem; }
  .about-header { padding-bottom: 2rem; }
  .about-project dl { display: block; }
  .about-project dl > div + div { margin-top: .85rem; }
  .about-tabs button { flex-direction: column; gap: .35rem; padding: .85rem .35rem; font-size: .75rem; line-height: 1.5; }
  .about-panel { padding-top: 2rem; }
  .about-team, .about-practices { grid-template-columns: minmax(0, 1fr); }
  .about-roadmap-entry { grid-template-columns: minmax(0, 1fr); gap: .5rem; }
  .about-roadmap-entry .about-kicker span { display: inline; margin-left: .75rem; }
}
</style>
