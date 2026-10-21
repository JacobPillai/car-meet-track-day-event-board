<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { api } from '../services/api'
import EventMap from '../components/EventMap.vue'
import EventCalendar from '../components/EventCalendar.vue'

const allEvents = ref([])
const categories = ref([])
const selectedCategory = ref('all')
const selectedRegion = ref('All')
const viewMode = ref('split')
const highlightedEvent = ref(null)
const loading = ref(true)
const eventError = ref(false)
const categoryLoading = ref(false)
const categoryError = ref(false)
const failedImage = ref(false)
let active = true
let eventRequest = 0
let categoryRequest = 0

const modes = [
  { value: 'split', label: 'Map + calendar', icon: 'bi-layout-split' },
  { value: 'map', label: 'Map', icon: 'bi-map' },
  { value: 'calendar', label: 'Calendar', icon: 'bi-calendar3' }
]
const regions = [
  { value: 'All', label: 'All regions' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Malaysia', label: 'Malaysia' },
  { value: 'Kuching', label: 'Kuching' },
  { value: 'Sepang', label: 'Malaysia · Sepang map' }
]
const filteredEvents = computed(() => allEvents.value.filter(ev => {
  const categoryMatches = selectedCategory.value === 'all' || ev.category_slug === selectedCategory.value
  const regionMatches = selectedRegion.value === 'All' || ev.region === selectedRegion.value ||
    (selectedRegion.value === 'Kuching' && String(ev.venue || '').toLowerCase().includes('kuching')) ||
    (selectedRegion.value === 'Sepang' && ev.region === 'Malaysia')
  return categoryMatches && regionMatches
}))

// A selection must always belong to the currently visible results.
watch(filteredEvents, events => {
  highlightedEvent.value = events.find(ev => ev.id === highlightedEvent.value?.id) || events[0] || null
}, { flush: 'sync' })
watch(() => highlightedEvent.value?.image, () => { failedImage.value = false })

function selectEvent(event) {
  highlightedEvent.value = filteredEvents.value.find(ev => ev.id === event.id) || highlightedEvent.value
}
function clearFilters() {
  selectedCategory.value = 'all'
  selectedRegion.value = 'All'
}
function formatDate(value) {
  if (!value) return 'Date to be confirmed'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return 'Date to be confirmed'
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
  }).format(date)
}
function formatPrice(event) {
  if (event.price == null || event.price === '') return 'See event for entry details'
  const amount = Number(event.price)
  if (!Number.isFinite(amount) || amount < 0) return 'See event for entry details'
  if (amount === 0) return 'Free entry'
  return `${event.region === 'Malaysia' ? 'RM ' : 'A$'}${amount.toLocaleString('en-AU', { maximumFractionDigits: 2 })}`
}

async function loadEvents() {
  if (loading.value && eventRequest > 0) return
  const request = ++eventRequest
  loading.value = true
  eventError.value = false
  try {
    const events = []
    let page = 1
    let totalPages = 1
    // Both maps and calendars need the complete collection, not just the first API page.
    do {
      const response = await api.get('/events', { limit: 50, page })
      if (!active || request !== eventRequest) return
      events.push(...(response.data || []))
      totalPages = Number(response.total_pages) || 1
      page++
    } while (page <= totalPages)
    allEvents.value = events
  } catch {
    if (active && request === eventRequest) eventError.value = true
  } finally {
    if (active && request === eventRequest) loading.value = false
  }
}
async function loadCategories() {
  if (categoryLoading.value) return
  const request = ++categoryRequest
  categoryLoading.value = true
  categoryError.value = false
  try {
    const response = await api.get('/categories')
    if (active && request === categoryRequest) categories.value = response.data || []
  } catch {
    if (active && request === categoryRequest) categoryError.value = true
  } finally {
    if (active && request === categoryRequest) categoryLoading.value = false
  }
}
onMounted(() => {
  loadEvents()
  loadCategories()
})
onBeforeUnmount(() => {
  active = false
  eventRequest++
  categoryRequest++
})
</script>

<template>
  <div class="explore-page">
    <div class="container">
      <header class="explore-heading">
        <div>
          <p class="explore-eyebrow">Explore / Australia &amp; Malaysia</p>
          <h1>Find your<br /><span>next gathering.</span></h1>
          <p class="explore-intro">A new place. A familiar crowd. Find car meets, shows and track days on the map, or make room in your calendar.</p>
        </div>
        <router-link to="/events" class="explore-button">Browse all events <i class="bi bi-arrow-up-right" aria-hidden="true"></i></router-link>
      </header>

      <section class="explore-controls" aria-label="Explore controls">
        <div class="explore-controls__row">
          <div class="explore-modes" role="group" aria-label="Explore layout">
            <button v-for="mode in modes" :key="mode.value" type="button" :aria-pressed="viewMode === mode.value" @click="viewMode = mode.value">
              <i :class="['bi', mode.icon]" aria-hidden="true"></i>{{ mode.label }}
            </button>
          </div>
          <div class="explore-region">
            <label for="explore-region">Region / map area</label>
            <select id="explore-region" v-model="selectedRegion">
              <option v-for="region in regions" :key="region.value" :value="region.value">{{ region.label }}</option>
            </select>
          </div>
        </div>
        <div class="explore-types" role="group" aria-label="Event type" :aria-busy="categoryLoading">
          <span class="explore-filter-label">Event type</span>
          <button type="button" :aria-pressed="selectedCategory === 'all'" @click="selectedCategory = 'all'">All types</button>
          <button v-for="category in categories" :key="category.id" type="button" :aria-pressed="selectedCategory === category.slug" @click="selectedCategory = category.slug">{{ category.name }}</button>
          <span v-if="categoryLoading" class="explore-note" role="status">Loading event types…</span>
        </div>
        <p v-if="categoryError" class="explore-note" role="status">Event types couldn’t load. You can still explore all events. <button type="button" class="explore-text-button" @click="loadCategories">Retry event types</button></p>
        <p v-if="selectedRegion === 'Sepang'" class="explore-note">The map centres on Sepang; results include all Malaysian events.</p>
        <p v-else-if="selectedRegion === 'Kuching'" class="explore-note">Showing events with Kuching in the venue name.</p>
      </section>

      <div class="explore-results" :aria-busy="loading">
        <div v-if="loading" class="explore-state" role="status">
          <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          <h2>Finding your next stop…</h2><p>Loading events for the map and calendar.</p>
        </div>
        <div v-else-if="eventError" class="explore-state" role="alert">
          <h2>We couldn’t load the events.</h2><p>Your filters are still here. Try again when you’re ready.</p>
          <button type="button" class="explore-button explore-button--accent" @click="loadEvents">Try again</button>
        </div>
        <template v-else>
          <div class="explore-results__heading">
            <p role="status">{{ filteredEvents.length }} {{ filteredEvents.length === 1 ? 'event' : 'events' }} to explore</p>
            <button v-if="selectedCategory !== 'all' || selectedRegion !== 'All'" type="button" class="explore-text-button" @click="clearFilters">Clear filters <i class="bi bi-x-lg" aria-hidden="true"></i></button>
          </div>
          <div v-if="!filteredEvents.length" class="explore-state explore-empty">
            <h2>{{ allEvents.length ? 'A little further afield?' : 'No events just yet.' }}</h2>
            <p>{{ allEvents.length ? 'Try another region or event type to find your next gathering.' : 'Check back for new meets, shows and days out.' }}</p>
            <button v-if="allEvents.length" type="button" class="explore-button" @click="clearFilters">Show all events</button>
          </div>

          <div class="explore-workspace" :class="{ 'explore-workspace--calendar': viewMode === 'calendar' }">
            <div class="explore-visuals">
              <section v-if="viewMode !== 'calendar'" class="explore-map-section" aria-labelledby="explore-map-heading">
                <div class="explore-section-heading"><h2 id="explore-map-heading">Find a place.</h2><p>Select a marker to preview an event.</p></div>
                <EventMap :events="filteredEvents" height="clamp(320px, 48vw, 520px)" :initial-region="selectedRegion" :show-region-controls="false" @select-event="selectEvent" @region-change="selectedRegion = $event" />
                <p class="explore-note">Map tiles need a connection unless already cached. The event list is another way to explore.</p>
              </section>
              <section v-if="viewMode !== 'map'" class="explore-calendar-section" aria-labelledby="explore-calendar-heading">
                <div class="explore-section-heading"><h2 id="explore-calendar-heading">Make a date.</h2><p>Select a calendar event for details and RSVP.</p></div>
                <EventCalendar :events="filteredEvents" />
              </section>
            </div>

            <aside class="explore-sidebar" aria-label="Event preview and selection">
              <section v-if="highlightedEvent" class="explore-preview" aria-labelledby="explore-preview-heading">
                <p class="explore-eyebrow">Selected event</p>
                <img v-if="highlightedEvent.image && !failedImage" :key="highlightedEvent.image" :src="highlightedEvent.image" alt="" class="explore-preview__image" @error="failedImage = true" />
                <div v-else class="explore-preview__fallback"><i class="bi bi-image" aria-hidden="true"></i><span>Event photo unavailable</span></div>
                <p class="explore-preview__category">{{ highlightedEvent.category_name || 'Event' }} <span v-if="highlightedEvent.region">/ {{ highlightedEvent.region }}</span></p>
                <h2 id="explore-preview-heading">{{ highlightedEvent.title }}</h2>
                <p v-if="highlightedEvent.status === 'cancelled'" class="explore-event-status">Cancelled</p>
                <p v-else-if="highlightedEvent.status === 'completed'" class="explore-event-status">Completed</p>
                <dl class="explore-facts">
                  <div><dt>When</dt><dd>{{ formatDate(highlightedEvent.start_datetime) }}</dd></div>
                  <div><dt>Where</dt><dd>{{ highlightedEvent.venue || 'See event for venue details' }}</dd></div>
                  <div><dt>Entry</dt><dd>{{ formatPrice(highlightedEvent) }}</dd></div>
                </dl>
                <router-link :to="`/events/${highlightedEvent.id}`" class="explore-button explore-button--accent">View event <i class="bi bi-arrow-right" aria-hidden="true"></i></router-link>
              </section>
              <section v-if="filteredEvents.length" class="explore-event-list" aria-labelledby="explore-list-heading">
                <h2 id="explore-list-heading">Choose an event</h2>
                <div class="explore-event-list__scroll" role="group" aria-label="Choose an event to preview">
                  <button v-for="event in filteredEvents" :key="event.id" type="button" :aria-pressed="highlightedEvent?.id === event.id" @click="selectEvent(event)">
                    <span><span class="explore-event-list__region">{{ event.region }}</span><span class="explore-event-list__title">{{ event.title }}</span></span>
                    <i class="bi bi-arrow-up-right" aria-hidden="true"></i>
                  </button>
                </div>
              </section>
            </aside>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.explore-page {
  --scene-bg: #101110;
  --scene-surface: #171917;
  --scene-text: #f4f2eb;
  --scene-muted: #b3b5ac;
  --scene-border: #343731;
  --scene-accent: #ff775f;
  --apex-bg-surface: var(--scene-bg);
  --apex-bg-elevated: var(--scene-surface);
  --apex-text-primary: var(--scene-text);
  --apex-text-muted: var(--scene-muted);
  min-height: 70vh;
  padding-bottom: 4rem;
  background: var(--scene-bg);
  color: var(--scene-text);
}
[data-bs-theme='light'] .explore-page {
  --scene-bg: #f7f6f2;
  --scene-surface: #eeeee7;
  --scene-text: #1c211d;
  --scene-muted: #575e55;
  --scene-border: #cdd0c6;
  --scene-accent: #a52e20;
}
.explore-heading { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 2rem; padding: 4rem 0 3rem; }
.explore-eyebrow { margin: 0 0 1.5rem; color: var(--scene-muted); font-size: 0.7rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
.explore-heading h1 { margin: 0; font-family: 'Space Grotesk', system-ui, sans-serif; font-size: clamp(2.8rem, 6vw, 5.5rem); font-weight: 700; letter-spacing: -0.06em; line-height: 1; }
.explore-heading h1 span { color: var(--scene-accent); }
.explore-intro { max-width: 34rem; margin: 1.5rem 0 0; color: var(--scene-muted); font-size: 0.95rem; line-height: 1.8; }
.explore-button { display: inline-flex; align-items: center; justify-content: center; gap: 1rem; min-height: 48px; padding: 0.75rem 1rem; border: 1px solid var(--scene-border); border-radius: 0.25rem; color: var(--scene-text); background: transparent; font: inherit; font-size: 0.85rem; font-weight: 600; text-decoration: none; }
.explore-button:hover { color: var(--scene-text); background: var(--scene-surface); }
.explore-button--accent { border-color: #bb3827; background: #bb3827; color: #fff; }
.explore-button--accent:hover { border-color: #9e2c1e; background: #9e2c1e; color: #fff; }
.explore-controls { border-block: 1px solid var(--scene-border); padding: 1.5rem 0; }
.explore-controls__row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: end; gap: 1.5rem; }
.explore-modes { display: flex; flex-wrap: wrap; gap: 0.25rem; }
.explore-modes button, .explore-types button { min-height: 48px; padding: 0.65rem 1rem; border: 1px solid transparent; border-radius: 0.25rem; background: transparent; color: var(--scene-muted); font: inherit; font-size: 0.85rem; }
.explore-modes button { display: inline-flex; align-items: center; justify-content: center; gap: 0.65rem; }
.explore-modes button[aria-pressed='true'] { border-color: var(--scene-border); background: var(--scene-surface); color: var(--scene-text); }
.explore-types button[aria-pressed='true'] { color: var(--scene-accent); border-bottom-color: var(--scene-accent); border-radius: 0; }
.explore-modes button:hover, .explore-types button:hover { color: var(--scene-text); background: var(--scene-surface); }
.explore-region { display: flex; align-items: center; gap: 0.75rem; }
.explore-region label, .explore-filter-label { color: var(--scene-muted); font-size: 0.75rem; }
.explore-region select { min-height: 48px; max-width: 100%; padding: 0.65rem; border: 1px solid var(--scene-border); border-radius: 0.25rem; background: var(--scene-bg); color: var(--scene-text); font: inherit; font-size: 0.85rem; color-scheme: dark; }
[data-bs-theme='light'] .explore-region select { color-scheme: light; }
.explore-types { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem; margin-top: 1rem; }
.explore-filter-label { margin-right: 0.75rem; }
.explore-note { margin: 0.75rem 0 0; color: var(--scene-muted); font-size: 0.75rem; line-height: 1.7; }
.explore-text-button { display: inline-flex; align-items: center; gap: 0.5rem; min-height: 44px; border: 0; padding: 0; background: transparent; color: var(--scene-text); font: inherit; font-size: 0.8rem; text-decoration: underline; text-underline-offset: 0.25em; }
.explore-results { padding-top: 1.5rem; }
.explore-results__heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; min-height: 44px; margin-bottom: 1.5rem; }
.explore-results__heading p { margin: 0; color: var(--scene-muted); font-size: 0.85rem; }
.explore-workspace { display: grid; grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); gap: 2.5rem; align-items: start; }
.explore-visuals, .explore-sidebar { min-width: 0; }
.explore-section-heading { margin-bottom: 1.25rem; }
.explore-section-heading h2 { margin: 0; font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 700; letter-spacing: -0.04em; }
.explore-section-heading p { margin: 0.5rem 0 0; color: var(--scene-muted); font-size: 0.85rem; line-height: 1.7; }
.explore-calendar-section { margin-top: 3rem; }
.explore-workspace--calendar { grid-template-columns: minmax(0, 3fr) minmax(260px, 1fr); }
.explore-workspace--calendar .explore-calendar-section { margin-top: 0; }
.explore-map-section :deep(.leaflet-container) { z-index: 0; border-color: var(--scene-border) !important; border-radius: 0.25rem !important; box-shadow: none !important; }
.explore-preview .explore-eyebrow { margin-bottom: 1rem; }
.explore-preview__image, .explore-preview__fallback { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 0.25rem; }
.explore-preview__fallback { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; background: var(--scene-surface); color: var(--scene-muted); font-size: 0.85rem; }
.explore-preview__fallback i { font-size: 1.75rem; }
.explore-preview__category { margin: 1.25rem 0 0.75rem; color: var(--scene-accent); font-size: 0.75rem; }
.explore-preview__category span { color: var(--scene-muted); }
.explore-preview h2 { margin: 0; font-size: clamp(1.4rem, 2vw, 2rem); font-weight: 600; line-height: 1.2; letter-spacing: -0.035em; overflow-wrap: anywhere; }
.explore-event-status { margin: 0.75rem 0 0; color: var(--scene-accent); font-weight: 600; }
.explore-facts { margin: 1.5rem 0; }
.explore-facts > div { display: grid; grid-template-columns: 3rem minmax(0, 1fr); gap: 0.75rem; margin-top: 0.75rem; font-size: 0.8rem; line-height: 1.7; }
.explore-facts dt { color: var(--scene-muted); font-weight: 400; }
.explore-facts dd { margin: 0; overflow-wrap: anywhere; }
.explore-preview > .explore-button { width: 100%; }
.explore-event-list { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--scene-border); }
.explore-event-list h2 { margin: 0 0 1rem; font-size: 1rem; font-weight: 600; }
.explore-event-list__scroll { max-height: 350px; overflow: auto; padding: 4px; scrollbar-width: thin; }
.explore-event-list button { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; width: 100%; min-height: 64px; padding: 0.75rem; border: 0; border-bottom: 1px solid var(--scene-border); border-left: 2px solid transparent; background: transparent; color: var(--scene-text); text-align: left; font: inherit; }
.explore-event-list button[aria-pressed='true'] { border-left-color: var(--scene-accent); background: var(--scene-surface); }
.explore-event-list button:hover { background: var(--scene-surface); }
.explore-event-list__region { display: block; margin-bottom: 0.25rem; color: var(--scene-muted); font-size: 0.65rem; }
.explore-event-list__title { display: block; font-size: 0.8rem; overflow-wrap: anywhere; }
.explore-event-list button > i { color: var(--scene-muted); flex-shrink: 0; }
.explore-state { padding: 4rem 1rem; text-align: center; }
.explore-state h2 { margin-top: 1rem; font-size: 1.5rem; letter-spacing: -0.025em; }
.explore-state p { max-width: 32rem; margin: 0.75rem auto 1.5rem; color: var(--scene-muted); line-height: 1.7; }
.explore-empty { margin-bottom: 2rem; padding-block: 2rem; border-bottom: 1px solid var(--scene-border); }
.explore-page :is(a, button, select):focus-visible { outline: 2px solid var(--scene-accent); outline-offset: 3px; box-shadow: none; }
@media (max-width: 991.98px) {
  .explore-workspace, .explore-workspace--calendar { grid-template-columns: minmax(0, 1fr); gap: 2rem; }
  .explore-sidebar { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: start; gap: 2rem; }
  .explore-event-list { margin-top: 0; }
}
@media (max-width: 575.98px) {
  .explore-heading { padding: 2.5rem 0 2rem; gap: 1.5rem; }
  .explore-controls__row, .explore-region { display: block; }
  .explore-region { margin-top: 1.25rem; }
  .explore-region label { display: block; margin-bottom: 0.5rem; }
  .explore-region select { width: 100%; }
  .explore-modes { display: grid; grid-template-columns: 1.5fr 1fr 1fr; }
  .explore-modes button { padding-inline: 0.5rem; font-size: 0.75rem; gap: 0.4rem; }
  .explore-modes button i { display: none; }
  .explore-filter-label { width: 100%; margin: 0 0 0.25rem; }
  .explore-types button { padding-inline: 0.75rem; }
  .explore-sidebar { grid-template-columns: minmax(0, 1fr); }
}
</style>
