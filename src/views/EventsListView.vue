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

async function applyFilters(resetPage = true) {
  if (resetPage) {
    eventStore.filters.page = 1
  }
  const extra = {}
  if (userLocation.value) {
    extra.lat = userLocation.value.lat
    extra.lng = userLocation.value.lng
  }
  await eventStore.fetchEvents(extra)
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
  geoStatus.value = 'Acquiring GPS coordinates...'
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation.value = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }
      geoStatus.value = `GPS locked (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`
      eventStore.filters.sort = 'distance'
      showToast(`Sorted by Haversine distance from ${geoStatus.value}`, 'success')
      applyFilters(true)
    },
    () => {
      // Fallback to Melbourne or Sepang hub based on selected region
      const isMy = eventStore.filters.region === 'Malaysia'
      userLocation.value = isMy
        ? { lat: 2.7608, lng: 101.7383 }
        : { lat: -37.8136, lng: 144.9631 }
      geoStatus.value = `Using ${isMy ? 'Sepang MY' : 'Melbourne AU'} hub coordinates`
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
  await eventStore.toggleLike(event.id, event.user_liked)
  showToast(
    event.user_liked ? `Removed like from "${event.title}"` : `Liked "${event.title}"!`,
    'success'
  )
  await applyFilters(false)
}

onMounted(async () => {
  await eventStore.fetchCategories()
  await applyFilters(false)
})
</script>

<template>
  <div class="container py-4">
    <!-- Page Header -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1">
          <i class="bi bi-flag-fill text-danger me-2" aria-hidden="true"></i>
          Car Meet &amp; Track-Day Event Board
        </h1>
        <p class="text-body-secondary small mb-0">
          Search, filter, and sort upcoming and completed motorsport events across Australia and Malaysia
        </p>
      </div>

      <div class="d-flex gap-2">
        <router-link to="/explore" class="btn btn-sm btn-outline-secondary">
          <i class="bi bi-geo-alt me-1 text-danger" aria-hidden="true"></i>Map &amp; Calendar View
        </router-link>
        <router-link
          v-if="authStore.isOrganizer"
          to="/events/new"
          class="btn btn-sm btn-apex"
        >
          <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Host Event
        </router-link>
      </div>
    </div>

    <!-- Search, Filter & Sort Toolbar -->
    <section class="apex-card p-3 mb-4" aria-label="Search and filter controls">
      <form @submit.prevent="applyFilters(true)">
        <div class="row g-3">
          <!-- Keyword / Location Search -->
          <div class="col-12 col-md-4">
            <label for="filter-search" class="form-label small fw-semibold mb-1">
              Keyword, Venue or Location
            </label>
            <input
              id="filter-search"
              v-model="eventStore.filters.search"
              type="search"
              class="form-control form-control-sm"
              placeholder="e.g. Sandown, Sepang, Kuching, Drift..."
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
              <option value="All">All (AU &amp; MY)</option>
              <option value="Australia">Australia (VIC)</option>
              <option value="Malaysia">Malaysia (MY)</option>
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
              Max Price
            </label>
            <select
              id="filter-price"
              v-model="eventStore.filters.max_price"
              class="form-select form-select-sm"
              @change="applyFilters(true)"
            >
              <option value="">Any Price</option>
              <option value="0">Free Entry Only ($0)</option>
              <option value="50">Up to $50 / RM 50</option>
              <option value="180">Up to $180 / RM 180</option>
              <option value="250">Up to $250 / RM 250</option>
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
              <option value="all">All (Upcoming &amp; Past)</option>
              <option value="upcoming">Upcoming Only</option>
              <option value="completed">Completed (Past Events)</option>
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
              <option value="distance">Distance (Nearest to Me/Hub)</option>
              <option value="price_asc">Price (Lowest to Highest)</option>
            </select>
          </div>

          <div class="col-12 col-md-6 d-flex flex-wrap align-items-end justify-content-between gap-2">
            <div class="d-flex flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-sm btn-outline-warning"
                @click="useBrowserGeolocation"
              >
                <i class="bi bi-crosshair me-1" aria-hidden="true"></i>Sort by My Distance
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                @click="handleResetFilters"
              >
                <i class="bi bi-x-circle me-1" aria-hidden="true"></i>Reset Filters
              </button>
            </div>

            <span v-if="geoStatus" class="small text-warning font-monospace">
              <i class="bi bi-geo-fill me-1" aria-hidden="true"></i>{{ geoStatus }}
            </span>
          </div>
        </div>
      </form>
    </section>

    <!-- Results Count Bar -->
    <div class="d-flex align-items-center justify-content-between mb-3 small text-body-secondary">
      <div>
        Found <strong class="font-monospace">{{ eventStore.pagination.total }}</strong> matching motorsport event(s)
      </div>
      <div class="font-monospace">
        Page {{ eventStore.pagination.page }} of {{ eventStore.pagination.total_pages }}
      </div>
    </div>

    <!-- Skeleton Shimmer Loading Grid -->
    <div v-if="eventStore.loading" class="row g-4">
      <div v-for="n in 6" :key="n" class="col-12 col-md-6 col-lg-4">
        <SkeletonCard />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="eventStore.events.length === 0"
      class="apex-card p-5 text-center my-3"
    >
      <i class="bi bi-search display-5 text-secondary mb-2 d-block" aria-hidden="true"></i>
      <h2 class="h5 fw-bold">No Events Match Your Current Filters</h2>
      <p class="text-body-secondary small mb-3">
        Try clearing your search keyword, expanding the price limit, or switching regions.
      </p>
      <button type="button" class="btn btn-sm btn-apex" @click="handleResetFilters">
        Show All Events
      </button>
    </div>

    <!-- Paginated Event Grid -->
    <div v-else class="row g-4">
      <div
        v-for="ev in eventStore.events"
        :key="ev.id"
        class="col-12 col-md-6 col-lg-4"
      >
        <EventCard :event="ev" @toggle-like="handleToggleLike" />
      </div>
    </div>

    <!-- Reusable Pagination Component -->
    <PaginationBar
      :page="eventStore.pagination.page"
      :total-pages="eventStore.pagination.total_pages"
      :total-items="eventStore.pagination.total"
      @change-page="handlePageChange"
    />
  </div>
</template>
