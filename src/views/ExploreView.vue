<script setup>
/**
 * ApexGrid — Interactive Map & Calendar Explorer (Naveed's Advanced Feature View)
 * Combines Leaflet + OpenStreetMap (with Australia & Malaysia region quick-jump)
 * and FullCalendar (Month Grid & Track Schedule List).
 */
import { ref, computed, onMounted } from 'vue'
import { api } from '../services/api'
import EventMap from '../components/EventMap.vue'
import EventCalendar from '../components/EventCalendar.vue'

const allEvents = ref([])
const categories = ref([])
const selectedCategory = ref('all')
const selectedRegion = ref('All')
const viewMode = ref('split') // 'split' | 'map' | 'calendar'
const highlightedEvent = ref(null)
const loading = ref(true)

const filteredEvents = computed(() => {
  return allEvents.value.filter((ev) => {
    const matchCat =
      selectedCategory.value === 'all' || ev.category_slug === selectedCategory.value
    const matchReg =
      selectedRegion.value === 'All' ||
      (selectedRegion.value === 'Australia' && ev.region === 'Australia') ||
      (selectedRegion.value === 'Malaysia' && ev.region === 'Malaysia') ||
      (selectedRegion.value === 'Kuching' && ev.venue.toLowerCase().includes('kuching')) ||
      (selectedRegion.value === 'Sepang' && ev.region === 'Malaysia')
    return matchCat && matchReg
  })
})

function handleRegionJump(regionKey) {
  selectedRegion.value = regionKey
}

onMounted(async () => {
  loading.value = true
  try {
    const [catRes, evRes] = await Promise.all([
      api.get('/categories'),
      api.get('/events', { limit: 50, page: 1 })
    ])
    categories.value = catRes.data || []
    allEvents.value = evRes.data || []
    highlightedEvent.value = allEvents.value[0] || null
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container py-4">
    <!-- Header & View Mode Switcher -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div>
        <span class="badge apex-badge-accent mb-1">
          <i class="bi bi-compass me-1" aria-hidden="true"></i>Geospatial &amp; Schedule Telemetry
        </span>
        <h1 class="h3 fw-bold mb-1">Interactive Track Map &amp; Event Calendar</h1>
        <p class="text-body-secondary small mb-0">
          Explore circuit pins across Melbourne / Victoria (AU) and Sepang / Sarawak (MY), or switch
          to the monthly FullCalendar schedule.
        </p>
      </div>

      <div class="btn-group btn-group-sm" role="group" aria-label="Select Explorer layout">
        <button
          type="button"
          class="btn"
          :class="viewMode === 'split' ? 'btn-apex' : 'btn-outline-secondary'"
          @click="viewMode = 'split'"
        >
          <i class="bi bi-layout-split me-1" aria-hidden="true"></i>Map + Calendar
        </button>
        <button
          type="button"
          class="btn"
          :class="viewMode === 'map' ? 'btn-apex' : 'btn-outline-secondary'"
          @click="viewMode = 'map'"
        >
          <i class="bi bi-geo-alt-fill me-1" aria-hidden="true"></i>Leaflet Map Only
        </button>
        <button
          type="button"
          class="btn"
          :class="viewMode === 'calendar' ? 'btn-apex' : 'btn-outline-secondary'"
          @click="viewMode = 'calendar'"
        >
          <i class="bi bi-calendar3 me-1" aria-hidden="true"></i>FullCalendar Only
        </button>
      </div>
    </div>

    <!-- Category Filter Bar -->
    <div class="apex-card p-3 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
      <div class="d-flex flex-wrap gap-1 align-items-center">
        <span class="small fw-semibold me-2">Discipline Filter:</span>
        <button
          type="button"
          class="btn btn-sm"
          :class="selectedCategory === 'all' ? 'btn-apex' : 'btn-outline-secondary'"
          @click="selectedCategory = 'all'"
        >
          All ({{ allEvents.length }})
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          class="btn btn-sm"
          :class="selectedCategory === cat.slug ? 'btn-apex' : 'btn-outline-secondary'"
          @click="selectedCategory = cat.slug"
        >
          <i :class="[cat.icon, 'me-1']" aria-hidden="true"></i>{{ cat.name }}
        </button>
      </div>

      <div class="small text-body-secondary">
        Showing <strong>{{ filteredEvents.length }}</strong> pinned events
      </div>
    </div>

    <!-- Interactive Leaflet Map Section -->
    <section
      v-if="viewMode === 'split' || viewMode === 'map'"
      class="mb-4"
      aria-label="Leaflet interactive map"
    >
      <div class="row g-3">
        <div class="col-12 col-lg-8">
          <div class="apex-card p-3">
            <EventMap
              :events="filteredEvents"
              height="460px"
              :initial-region="selectedRegion"
              @select-event="(ev) => (highlightedEvent = ev)"
              @region-change="handleRegionJump"
            />
          </div>
        </div>

        <!-- Synchronized Map Event Inspector Sidebar -->
        <div class="col-12 col-lg-4">
          <div class="apex-card p-3 h-100 d-flex flex-column">
            <h2 class="h6 fw-bold text-uppercase text-warning mb-3">
              <i class="bi bi-broadcast-pin me-2" aria-hidden="true"></i>
              Selected Circuit / Meet Telemetry
            </h2>

            <div v-if="highlightedEvent" class="mb-3 p-3 rounded-3 border">
              <img
                :src="highlightedEvent.image"
                :alt="highlightedEvent.title"
                class="w-100 rounded-2 object-fit-cover mb-2"
                style="height: 140px"
              />
              <div class="d-flex gap-1 mb-1">
                <span class="badge" :class="`bg-${highlightedEvent.badge_color || 'danger'}`">
                  {{ highlightedEvent.category_name }}
                </span>
                <span class="badge bg-secondary">{{ highlightedEvent.region }}</span>
              </div>
              <h3 class="h6 fw-bold mb-1">{{ highlightedEvent.title }}</h3>
              <p class="small text-body-secondary mb-2">
                <i class="bi bi-geo-alt text-danger me-1" aria-hidden="true"></i>
                {{ highlightedEvent.venue }}<br />
                <i class="bi bi-calendar-event text-warning me-1" aria-hidden="true"></i>
                {{ highlightedEvent.start_datetime }}
              </p>
              <router-link
                :to="`/events/${highlightedEvent.id}`"
                class="btn btn-sm btn-apex w-100"
              >
                Open Event Details &amp; RSVP
              </router-link>
            </div>

            <div class="small fw-semibold mb-2">Quick-Select Event Marker:</div>
            <div class="overflow-auto flex-grow-1" style="max-height: 210px">
              <div class="list-group list-group-flush small">
                <button
                  v-for="ev in filteredEvents"
                  :key="ev.id"
                  type="button"
                  class="list-group-item list-group-item-action d-flex justify-content-between align-items-center bg-transparent"
                  :class="{ 'fw-bold text-danger': highlightedEvent?.id === ev.id }"
                  @click="highlightedEvent = ev"
                >
                  <span class="text-truncate me-2">
                    <span class="badge bg-secondary me-1">{{ ev.region === 'Malaysia' ? 'MY' : 'AU' }}</span>
                    {{ ev.title }}
                  </span>
                  <i class="bi bi-chevron-right" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FullCalendar Schedule Section -->
    <section
      v-if="viewMode === 'split' || viewMode === 'calendar'"
      aria-label="FullCalendar event schedule"
    >
      <div class="d-flex align-items-center justify-content-between mb-2">
        <h2 class="h5 fw-bold mb-0">
          <i class="bi bi-calendar3 text-danger me-2" aria-hidden="true"></i>
          FullCalendar Track &amp; Meet Schedule
        </h2>
        <span class="small text-body-secondary">
          Click any calendar block to open its event page
        </span>
      </div>
      <EventCalendar :events="filteredEvents" />
    </section>
  </div>
</template>
