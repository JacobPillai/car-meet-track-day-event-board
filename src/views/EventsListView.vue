<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '../stores/eventStore'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../composables/useToast'
import EventCard from '../components/EventCard.vue'
import SkeletonCard from '../components/SkeletonCard.vue'
import PaginationBar from '../components/PaginationBar.vue'

const router = useRouter()
const eventStore = useEventStore()
const authStore = useAuthStore()
const { showToast } = useToast()

const userLocation = ref(null)
const geoStatus = ref('')
const categoriesError = ref(false)
const pendingLikes = ref(new Set())

async function applyFilters(resetPage = true) {
  if (resetPage) {
    eventStore.filters.page = 1
  }
  const extra = {}
  if (userLocation.value) {
    extra.lat = userLocation.value.lat
    extra.lng = userLocation.value.lng
  }
  try {
    await eventStore.fetchEvents(extra)
  } catch {
    // The store exposes the error for the retry state below.
  }
}

async function loadCategories() {
  categoriesError.value = false
  try {
    await eventStore.fetchCategories()
  } catch {
    categoriesError.value = true
  }
}

function handlePageChange(newPage) {
  eventStore.filters.page = newPage
  applyFilters(false)
}

function handleResetFilters() {
  eventStore.resetFilters()
  geoStatus.value = ''
  userLocation.value = null
  applyFilters(true)
  showToast('Event filters reset to default.', 'info')
}

function useBrowserGeolocation() {
  if (!navigator.geolocation) {
    geoStatus.value = 'Geolocation is not supported by this browser.'
    showToast(geoStatus.value, 'warning')
    return
  }
  geoStatus.value = 'Finding your location…'
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation.value = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }
      geoStatus.value = 'Distances are measured from your current location.'
      eventStore.filters.sort = 'distance'
      showToast('Events sorted by distance from your location.', 'success')
      applyFilters(true)
    },
    () => {
      // Fallback to Melbourne or Sepang hub based on selected region
      const isMy = eventStore.filters.region === 'Malaysia'
      userLocation.value = isMy
        ? { lat: 2.7608, lng: 101.7383 }
        : { lat: -37.8136, lng: 144.9631 }
      geoStatus.value = `Location unavailable. Distances are measured from ${isMy ? 'Sepang, Malaysia' : 'Melbourne, Australia'}, not your location.`
      eventStore.filters.sort = 'distance'
      showToast(`Sorted by distance from ${isMy ? 'Sepang MY' : 'Melbourne AU'} hub.`, 'info')
      applyFilters(true)
    }
  )
}

async function handleToggleLike(event) {
  if (!authStore.isAuthenticated) {
    showToast('Sign in with a Member account to like events.', 'info')
    router.push({ path: '/login', query: { redirect: `/events/${event.id}` } })
    return
  }
  if (pendingLikes.value.has(event.id)) return
  pendingLikes.value.add(event.id)
  const wasLiked = Boolean(event.user_liked)
  try {
    await eventStore.toggleLike(event.id, wasLiked)
    showToast(wasLiked ? `Removed like from "${event.title}"` : `Liked "${event.title}"!`, 'success')
    await applyFilters(false)
  } catch (err) {
    showToast(err.message || 'Unable to update your like. Please try again.', 'danger')
  } finally {
    pendingLikes.value.delete(event.id)
  }
}

onMounted(() => {
  loadCategories()
  applyFilters(false)
})
</script>

<template>
  <div class="events-page">
    <div class="container">
    <header class="events-heading">
      <div>
        <p class="events-eyebrow">Australia &amp; Malaysia · The community calendar</p>
        <h1>Find your next<br /><span>good weekend.</span></h1>
        <p class="events-heading__intro">
          Coffee meets, coastal cruises, shows and track days. Find your scene, at your pace.
        </p>
      </div>

      <div class="events-heading__actions">
        <router-link to="/explore" class="events-button">
          <i class="bi bi-map" aria-hidden="true"></i>Map &amp; calendar
        </router-link>
        <router-link
          v-if="authStore.isOrganizer"
          to="/events/new"
          class="events-button events-button--accent"
        >
          <i class="bi bi-plus-lg" aria-hidden="true"></i>Host an event
        </router-link>
      </div>
    </header>

    <section class="events-filters" aria-labelledby="filters-title">
      <div class="events-filters__heading">
        <h2 id="filters-title">A little more your kind of thing.</h2>
        <button type="button" class="events-text-button" @click="handleResetFilters">Clear filters <i class="bi bi-x-lg" aria-hidden="true"></i></button>
      </div>
      <form role="search" aria-label="Find events" @submit.prevent="applyFilters(true)">
        <div class="row g-3">
          <!-- Keyword / Location Search -->
          <div class="col-12 col-md-4">
            <label for="filter-search" class="form-label small fw-semibold mb-1">
              Search events
            </label>
            <input
              id="filter-search"
              v-model="eventStore.filters.search"
              type="search"
              class="form-control form-control-sm"
              placeholder="A meet, a venue, a city…"
              @input="applyFilters(true)"
            />
          </div>

          <!-- Category Filter -->
          <div class="col-6 col-md-2">
            <label for="filter-category" class="form-label small fw-semibold mb-1">
              Event Type
            </label>
            <select
              id="filter-category"
              v-model="eventStore.filters.category"
              class="form-select form-select-sm"
              @change="applyFilters(true)"
            >
              <option value="">All Types</option>
              <option
                v-for="cat in eventStore.categories"
                :key="cat.id"
                :value="cat.slug"
              >
                {{ cat.name }}
              </option>
            </select>
          </div>

          <!-- Region Filter -->
          <div class="col-6 col-md-2">
            <label for="filter-region" class="form-label small fw-semibold mb-1">
              Region
            </label>
            <select
              id="filter-region"
              v-model="eventStore.filters.region"
              class="form-select form-select-sm"
              @change="applyFilters(true)"
            >
              <option value="All">Australia &amp; Malaysia</option>
              <option value="Australia">Australia</option>
              <option value="Malaysia">Malaysia</option>
            </select>
          </div>

          <!-- Date From -->
          <div class="col-6 col-md-2">
            <label for="filter-date" class="form-label small fw-semibold mb-1">
              From Date
            </label>
            <input
              id="filter-date"
              v-model="eventStore.filters.date_from"
              type="date"
              class="form-control form-control-sm"
              @change="applyFilters(true)"
            />
          </div>

          <!-- Max Price -->
          <div class="col-6 col-md-2">
            <label for="filter-price" class="form-label small fw-semibold mb-1">
              Entry price
            </label>
            <select
              id="filter-price"
              v-model="eventStore.filters.max_price"
              class="form-select form-select-sm"
              @change="applyFilters(true)"
            >
              <option value="">Any Price</option>
              <option value="0">Free entry</option>
              <option value="50">Up to A$50 / RM 50</option>
              <option value="180">Up to A$180 / RM 180</option>
              <option value="250">Up to A$250 / RM 250</option>
            </select>
          </div>

          <!-- Second Row: Status, Sort By, GPS Distance & Reset -->
          <div class="col-6 col-md-3">
            <label for="filter-status" class="form-label small fw-semibold mb-1">
              Event Status
            </label>
            <select
              id="filter-status"
              v-model="eventStore.filters.status"
              class="form-select form-select-sm"
              @change="applyFilters(true)"
            >
              <option value="all">Upcoming &amp; past</option>
              <option value="upcoming">Upcoming Only</option>
              <option value="completed">Past events</option>
            </select>
          </div>

          <div class="col-6 col-md-3">
            <label for="filter-sort" class="form-label small fw-semibold mb-1">
              Sort By
            </label>
            <select
              id="filter-sort"
              v-model="eventStore.filters.sort"
              class="form-select form-select-sm"
              @change="applyFilters(true)"
            >
              <option value="date">Date (Soonest First)</option>
              <option value="popularity">Popularity (Most RSVPs &amp; Likes)</option>
              <option value="distance">Distance (location or fallback city)</option>
              <option value="price_asc">Price (Lowest to Highest)</option>
            </select>
          </div>

          <div class="col-12 col-md-6 d-flex flex-wrap align-items-end justify-content-between gap-2">
            <div class="d-flex flex-wrap gap-2">
              <button
                type="button"
                class="events-button"
                @click="useBrowserGeolocation"
              >
                <i class="bi bi-geo-alt" aria-hidden="true"></i>Use my location
              </button>
              <button type="submit" class="events-button events-button--accent">
                Find events <i class="bi bi-arrow-right" aria-hidden="true"></i>
              </button>
            </div>

            <span v-if="geoStatus" class="events-location-note" role="status">
              <i class="bi bi-geo-fill me-1" aria-hidden="true"></i>{{ geoStatus }}
            </span>
          </div>
        </div>
      </form>
      <p class="events-filter-note">Price limits apply in each event’s local currency: A$ for Australia, RM for Malaysia.</p>
      <p v-if="categoriesError" class="events-filter-note" role="status">
        Event types couldn’t load. You can still search using the other filters.
        <button type="button" class="events-text-button" @click="loadCategories">Try again</button>
      </p>
    </section>

    <section class="events-results" aria-labelledby="results-title" :aria-busy="eventStore.loading">
    <div class="events-results__heading">
      <h2 id="results-title">On the calendar</h2>
      <p role="status" aria-live="polite" aria-atomic="true">
        <template v-if="eventStore.loading">Finding events…</template>
        <template v-else-if="eventStore.error">Events unavailable</template>
        <template v-else>{{ eventStore.pagination.total }} {{ eventStore.pagination.total === 1 ? 'event' : 'events' }} found<span v-if="eventStore.pagination.total > 0"> · Page {{ eventStore.pagination.page }} of {{ eventStore.pagination.total_pages }}</span></template>
      </p>
    </div>

    <!-- Skeleton Shimmer Loading Grid -->
    <div v-if="eventStore.loading" class="row g-4" aria-hidden="true">
      <div v-for="n in 6" :key="n" class="col-12 col-md-6 col-xl-4">
        <SkeletonCard />
      </div>
    </div>

    <div v-else-if="eventStore.error" class="events-empty" role="alert">
      <i class="bi bi-cloud-slash" aria-hidden="true"></i>
      <h3>We couldn’t load the calendar.</h3>
      <p>Please try again. Your search and filters are still here.</p>
      <button type="button" class="events-button events-button--accent" @click="applyFilters(false)">Try again <i class="bi bi-arrow-clockwise" aria-hidden="true"></i></button>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="eventStore.events.length === 0"
      class="events-empty"
    >
      <i class="bi bi-search" aria-hidden="true"></i>
      <h3>No events just yet.</h3>
      <p>
        Try clearing your search keyword, expanding the price limit, or switching regions.
      </p>
      <button type="button" class="events-button events-button--accent" @click="handleResetFilters">
        Clear filters
      </button>
    </div>

    <!-- Paginated Event Grid -->
    <div v-else class="row g-4">
      <div
        v-for="ev in eventStore.events"
        :key="ev.id"
        class="col-12 col-md-6 col-xl-4"
      >
        <EventCard :event="ev" @toggle-like="handleToggleLike" />
      </div>
    </div>

    <!-- Reusable Pagination Component -->
    <PaginationBar
      v-if="!eventStore.loading && !eventStore.error && eventStore.events.length"
      :page="eventStore.pagination.page"
      :total-pages="eventStore.pagination.total_pages"
      :total-items="eventStore.pagination.total"
      @change-page="handlePageChange"
    />
    </section>
    </div>
  </div>
</template>

<style scoped>
.events-page {
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
  --apex-border-strong: var(--scene-border);
  --apex-red: var(--scene-accent);
  min-height: 70vh;
  padding-bottom: 4rem;
  color: var(--scene-text);
  background: var(--scene-bg);
}
:global([data-bs-theme='light']) .events-page {
  --scene-bg: #f7f6f2;
  --scene-surface: #eeeee7;
  --scene-text: #1c211d;
  --scene-muted: #575e55;
  --scene-border: #cdd0c6;
  --scene-accent: #a52e20;
}
.events-heading { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 2rem; padding: 4rem 0 3rem; }
.events-eyebrow { margin: 0 0 1.5rem; color: var(--scene-muted); font-size: 0.7rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
.events-heading h1 { margin: 0; font-family: 'Space Grotesk', system-ui, sans-serif; font-size: clamp(2.8rem, 6vw, 5.5rem); font-weight: 700; letter-spacing: -0.06em; line-height: 1; }
.events-heading h1 span { color: var(--scene-accent); }
.events-heading__intro { max-width: 34rem; margin: 1.5rem 0 0; color: var(--scene-muted); font-size: 0.95rem; line-height: 1.8; }
.events-heading__actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.events-button { display: inline-flex; align-items: center; justify-content: center; gap: 0.75rem; min-height: 48px; padding: 0.75rem 1rem; border: 1px solid var(--scene-border); border-radius: 0.25rem; background: transparent; color: var(--scene-text); font: inherit; font-size: 0.85rem; font-weight: 600; text-decoration: none; }
.events-button:hover { background: var(--scene-surface); }
.events-button--accent { border-color: #bb3827; background: #bb3827; color: #fff; }
.events-button--accent:hover { border-color: #9e2c1e; background: #9e2c1e; color: #fff; }
.events-text-button { display: inline-flex; align-items: center; gap: 0.75rem; min-height: 44px; padding: 0; border: 0; background: transparent; color: var(--scene-text); font: inherit; font-size: 0.8rem; text-decoration: underline; text-underline-offset: 0.25em; }
.events-filters { padding: 1.5rem 0 1.75rem; border-top: 1px solid var(--scene-border); border-bottom: 1px solid var(--scene-border); }
.events-filters__heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem 1rem; margin-bottom: 1rem; }
.events-filters h2 { margin: 0; font-size: 1.25rem; font-weight: 600; letter-spacing: -0.025em; }
.events-filters label { color: var(--scene-muted); font-size: 0.75rem; }
.events-filters :is(input, select) { min-width: 0; min-height: 48px; padding: 0.65rem; border: 1px solid var(--scene-border); border-radius: 0.25rem; color: var(--scene-text); background-color: var(--scene-bg); font-size: 0.85rem; color-scheme: dark; box-shadow: none; }
.events-filters input::placeholder { color: var(--scene-muted); opacity: 1; }
:global([data-bs-theme='light']) .events-filters :is(input, select) { color-scheme: light; }
.events-filter-note, .events-location-note { margin: 1rem 0 0; color: var(--scene-muted); font-size: 0.75rem; line-height: 1.7; }
.events-location-note { flex-basis: 100%; margin: 0.25rem 0 0; }
.events-filter-note .events-text-button { margin-left: 0.5rem; }
.events-results { padding-top: 2.5rem; }
.events-results__heading { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 0.5rem 1rem; margin-bottom: 1.5rem; }
.events-results h2 { margin: 0; font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 700; letter-spacing: -0.04em; }
.events-results__heading p { margin: 0; color: var(--scene-muted); font-size: 0.85rem; }
.events-empty { padding: 4rem 1.25rem; text-align: center; }
.events-empty > i { display: block; margin-bottom: 1.25rem; color: var(--scene-muted); font-size: 2rem; }
.events-empty h3 { font-size: 1.5rem; letter-spacing: -0.025em; }
.events-empty p { max-width: 30rem; margin: 0.75rem auto 1.5rem; color: var(--scene-muted); line-height: 1.7; }
.events-page :is(a, button, input, select):focus-visible { outline: 2px solid var(--scene-accent); outline-offset: 4px; box-shadow: none; }
@media (max-width: 767.98px) {
  .events-heading { padding: 2.5rem 0 2rem; gap: 1.5rem; }
  .events-eyebrow { max-width: 22rem; font-size: 0.65rem; line-height: 1.8; }
  .events-heading__actions { width: 100%; }
  .events-heading__actions .events-button { flex: 1; }
  .events-filters h2 { font-size: 1.1rem; }
  .events-results { padding-top: 2rem; }
}
</style>
