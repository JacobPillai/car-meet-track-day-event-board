<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '../stores/eventStore'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../composables/useToast'
import EventCard from '../components/EventCard.vue'
import SkeletonCard from '../components/SkeletonCard.vue'

const router = useRouter()
const eventStore = useEventStore()
const authStore = useAuthStore()
const { showToast } = useToast()

const quickSearch = ref('')
const quickRegion = ref('All')
const featuredEvents = ref([])
const allClubs = ref([])
const loading = ref(true)

// Spotlight Carousel & Live Countdown state
const spotlightIndex = ref(0)
const isCarouselPaused = ref(false)
const nowTimestamp = ref(Date.now())
let countdownTimer = null
let carouselTimer = null

const currentSpotlight = computed(() => {
  if (!featuredEvents.value.length) return null
  return featuredEvents.value[spotlightIndex.value % featuredEvents.value.length]
})

const spotlightCountdown = computed(() => {
  const ev = currentSpotlight.value
  if (!ev || !ev.start_datetime) {
    return { days: '00', hours: '00', mins: '00', secs: '00' }
  }
  const target = new Date(ev.start_datetime.replace(' ', 'T')).getTime()
  const diff = Math.max(0, target - nowTimestamp.value)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const mins = Math.floor((diff / (1000 * 60)) % 60)
  const secs = Math.floor((diff / 1000) % 60)
  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    mins: String(mins).padStart(2, '0'),
    secs: String(secs).padStart(2, '0')
  }
})

const stats = computed(() => {
  const totalGoing = featuredEvents.value.reduce((s, e) => s + (e.going_count || 0), 0)
  const totalLikes = featuredEvents.value.reduce((s, e) => s + (e.likes_count || 0), 0)
  return {
    eventsCount: 12,
    clubsCount: allClubs.value.length || 6,
    rsvpsCount: totalGoing + 24,
    likesCount: totalLikes + 38
  }
})

async function loadHomeData() {
  loading.value = true
  try {
    await eventStore.fetchCategories()
    const evRes = await eventStore.fetchEvents({
      status: 'upcoming',
      sort: 'popularity',
      page: 1,
      limit: 6,
      region: quickRegion.value === 'All' ? '' : quickRegion.value
    })
    featuredEvents.value = evRes.data || []
    spotlightIndex.value = 0
    const clubsRes = await eventStore.fetchClubs()
    allClubs.value = clubsRes || []
  } finally {
    loading.value = false
  }
}

function nextSpotlight() {
  if (!featuredEvents.value.length) return
  spotlightIndex.value = (spotlightIndex.value + 1) % featuredEvents.value.length
}

function prevSpotlight() {
  if (!featuredEvents.value.length) return
  spotlightIndex.value =
    (spotlightIndex.value - 1 + featuredEvents.value.length) % featuredEvents.value.length
}

function toggleCarouselPause() {
  isCarouselPaused.value = !isCarouselPaused.value
}

function submitHeroSearch() {
  eventStore.filters.search = quickSearch.value
  eventStore.filters.region = quickRegion.value
  eventStore.filters.page = 1
  router.push('/events')
}

function filterByCategory(slug) {
  eventStore.resetFilters()
  eventStore.filters.category = slug
  router.push('/events')
}

function filterByRegionHub(regionName) {
  eventStore.resetFilters()
  eventStore.filters.region = regionName
  router.push('/events')
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
  await loadHomeData()
}

onMounted(() => {
  loadHomeData()
  countdownTimer = window.setInterval(() => {
    nowTimestamp.value = Date.now()
  }, 1000)
  carouselTimer = window.setInterval(() => {
    if (!isCarouselPaused.value && featuredEvents.value.length > 1) {
      nextSpotlight()
    }
  }, 6500)
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  if (carouselTimer) clearInterval(carouselTimer)
})
</script>

<template>
  <div>
    <!-- Hero Telemetry Banner + Interactive Featured Spotlight -->
    <section class="apex-hero text-white py-5">
      <div class="container py-lg-3">
        <div class="row align-items-center g-4">
          <!-- Left Hero Copy & Quick Search -->
          <div class="col-12 col-lg-7">
            <div class="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-danger bg-opacity-25 border border-danger border-opacity-50 text-uppercase small fw-bold mb-3">
              <span class="live-dot" aria-hidden="true"></span>
              <span>Season 2026 Telemetry • Australia &amp; Malaysia</span>
            </div>

            <h1 class="display-5 fw-bold mb-3">
              Your Paddock Pass to <span class="text-danger">Track Days</span>, Drift Nights &amp; JDM Meets
            </h1>

            <p class="lead text-light opacity-90 mb-4" style="max-width: 62ch">
              Discover CAMS/AASA open-pitlane circuits, Friday night drift clinics, dawn mountain touge runs,
              and curated concourse shows across <strong>Victoria, Australia</strong> and
              <strong>Malaysia (Sepang &amp; Sarawak)</strong>.
            </p>

            <!-- Quick Search Bar -->
            <form
              class="apex-card p-3 bg-dark bg-opacity-75 border-secondary mb-4"
              role="search"
              aria-label="Quick event search"
              @submit.prevent="submitHeroSearch"
            >
              <div class="row g-2 align-items-center">
                <div class="col-12 col-md-6">
                  <label for="hero-search-input" class="visually-hidden">
                    Search by venue, city, or event title
                  </label>
                  <div class="input-group">
                    <span class="input-group-text bg-transparent border-secondary text-secondary">
                      <i class="bi bi-search" aria-hidden="true"></i>
                    </span>
                    <input
                      id="hero-search-input"
                      v-model="quickSearch"
                      type="search"
                      class="form-control border-secondary text-white bg-dark"
                      placeholder="Sandown, Sepang, Kuching, Drift, JDM..."
                    />
                  </div>
                </div>

                <div class="col-7 col-md-3">
                  <label for="hero-region-select" class="visually-hidden">Select region</label>
                  <select
                    id="hero-region-select"
                    v-model="quickRegion"
                    class="form-select border-secondary text-white bg-dark"
                    @change="loadHomeData"
                  >
                    <option value="All">All Regions (AU &amp; MY)</option>
                    <option value="Australia">Australia (VIC)</option>
                    <option value="Malaysia">Malaysia (MY)</option>
                  </select>
                </div>

                <div class="col-5 col-md-3 d-grid">
                  <button type="submit" class="btn btn-apex">
                    Search Grid
                  </button>
                </div>
              </div>
            </form>

            <!-- Live Platform Telemetry Counters -->
            <div class="row g-2 row-cols-2 row-cols-sm-4 text-center">
              <div class="col">
                <div class="p-2 rounded-3 bg-black bg-opacity-50 border border-secondary border-opacity-50">
                  <div class="h4 fw-bold text-danger font-monospace mb-0">{{ stats.eventsCount }}</div>
                  <div class="text-secondary" style="font-size: 0.75rem">Sanctioned Events</div>
                </div>
              </div>
              <div class="col">
                <div class="p-2 rounded-3 bg-black bg-opacity-50 border border-secondary border-opacity-50">
                  <div class="h4 fw-bold text-warning font-monospace mb-0">{{ stats.clubsCount }}</div>
                  <div class="text-secondary" style="font-size: 0.75rem">Verified Clubs</div>
                </div>
              </div>
              <div class="col">
                <div class="p-2 rounded-3 bg-black bg-opacity-50 border border-secondary border-opacity-50">
                  <div class="h4 fw-bold text-info font-monospace mb-0">{{ stats.rsvpsCount }}+</div>
                  <div class="text-secondary" style="font-size: 0.75rem">Locked Driver RSVPs</div>
                </div>
              </div>
              <div class="col">
                <div class="p-2 rounded-3 bg-black bg-opacity-50 border border-secondary border-opacity-50">
                  <div class="h4 fw-bold text-success font-monospace mb-0">2</div>
                  <div class="text-secondary" style="font-size: 0.75rem">APAC Hubs (AU/MY)</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Interactive Featured Event Spotlight Carousel -->
          <div class="col-12 col-lg-5">
            <div
              v-if="currentSpotlight"
              class="apex-card overflow-hidden bg-dark text-white border-secondary shadow-lg"
              aria-roledescription="carousel"
              aria-label="Featured upcoming motorsport event spotlight"
            >
              <!-- Spotlight Cover -->
              <div class="position-relative" style="height: 220px; overflow: hidden">
                <img
                  :src="currentSpotlight.image"
                  :alt="currentSpotlight.title"
                  class="w-100 h-100 object-fit-cover"
                />
                <div
                  class="position-absolute inset-0 w-100 h-100"
                  style="top:0;left:0;background: linear-gradient(180deg, rgba(9,11,16,0.2) 0%, rgba(9,11,16,0.92) 100%)"
                ></div>

                <!-- Carousel Header Controls -->
                <div class="position-absolute top-0 start-0 w-100 p-3 d-flex justify-content-between align-items-center">
                  <span class="badge bg-danger text-uppercase">
                    <i class="bi bi-lightning-charge-fill me-1" aria-hidden="true"></i>
                    Featured Spotlight ({{ spotlightIndex + 1 }}/{{ featuredEvents.length }})
                  </span>

                  <div class="btn-group btn-group-sm">
                    <button
                      type="button"
                      class="btn btn-dark bg-opacity-75 border-secondary text-light"
                      :aria-label="isCarouselPaused ? 'Play spotlight rotation' : 'Pause spotlight rotation'"
                      :title="isCarouselPaused ? 'Play rotation' : 'Pause rotation'"
                      @click="toggleCarouselPause"
                    >
                      <i :class="isCarouselPaused ? 'bi bi-play-fill' : 'bi bi-pause-fill'" aria-hidden="true"></i>
                    </button>
                    <button
                      type="button"
                      class="btn btn-dark bg-opacity-75 border-secondary text-light"
                      aria-label="Previous spotlight event"
                      @click="prevSpotlight"
                    >
                      <i class="bi bi-chevron-left" aria-hidden="true"></i>
                    </button>
                    <button
                      type="button"
                      class="btn btn-dark bg-opacity-75 border-secondary text-light"
                      aria-label="Next spotlight event"
                      @click="nextSpotlight"
                    >
                      <i class="bi bi-chevron-right" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>

                <!-- Title & Venue Overlay -->
                <div class="position-absolute bottom-0 start-0 w-100 p-3">
                  <div class="small text-warning fw-semibold mb-1">
                    <i class="bi bi-geo-alt-fill me-1" aria-hidden="true"></i>
                    {{ currentSpotlight.venue }} • {{ currentSpotlight.region }}
                  </div>
                  <h2 class="h5 fw-bold text-white mb-0">{{ currentSpotlight.title }}</h2>
                </div>
              </div>

              <!-- Live Telemetry Countdown & CTA -->
              <div class="p-3 bg-black bg-opacity-50">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="small text-secondary text-uppercase fw-bold" style="font-size: 0.72rem; letter-spacing: 0.06em">
                    <i class="bi bi-stopwatch text-danger me-1" aria-hidden="true"></i>
                    Lights Out Countdown
                  </span>
                  <span class="badge bg-warning text-dark font-monospace">
                    {{ Number(currentSpotlight.price) <= 0 ? 'FREE ENTRY' : `${currentSpotlight.region === 'Malaysia' ? 'RM ' : 'A$'}${Number(currentSpotlight.price).toFixed(0)}` }}
                  </span>
                </div>

                <div class="row g-2 text-center mb-3">
                  <div class="col-3">
                    <div class="apex-countdown-box">
                      <div class="num">{{ spotlightCountdown.days }}</div>
                      <div class="lbl">Days</div>
                    </div>
                  </div>
                  <div class="col-3">
                    <div class="apex-countdown-box">
                      <div class="num">{{ spotlightCountdown.hours }}</div>
                      <div class="lbl">Hours</div>
                    </div>
                  </div>
                  <div class="col-3">
                    <div class="apex-countdown-box">
                      <div class="num">{{ spotlightCountdown.mins }}</div>
                      <div class="lbl">Mins</div>
                    </div>
                  </div>
                  <div class="col-3">
                    <div class="apex-countdown-box">
                      <div class="num text-danger">{{ spotlightCountdown.secs }}</div>
                      <div class="lbl">Secs</div>
                    </div>
                  </div>
                </div>

                <div class="d-flex gap-2">
                  <router-link
                    :to="`/events/${currentSpotlight.id}`"
                    class="btn btn-apex btn-sm flex-grow-1"
                  >
                    Inspect Event &amp; Paddock Pass →
                  </router-link>
                  <router-link
                    to="/explore"
                    class="btn btn-outline-light btn-sm"
                    title="Open Interactive Map & Calendar"
                  >
                    <i class="bi bi-map" aria-hidden="true"></i>
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Category Quick-Filter Pills -->
    <section class="container py-4">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h2 class="h5 fw-bold mb-0">
          <i class="bi bi-grid-fill text-danger me-2" aria-hidden="true"></i>Browse by Motorsport Discipline
        </h2>
        <router-link to="/events" class="small text-decoration-none text-danger fw-semibold">
          View Full Event Board <i class="bi bi-arrow-right" aria-hidden="true"></i>
        </router-link>
      </div>

      <div class="row g-2 row-cols-2 row-cols-sm-3 row-cols-lg-6">
        <div v-for="cat in eventStore.categories" :key="cat.id" class="col">
          <button
            type="button"
            class="btn apex-card apex-card-hover w-100 py-3 text-center d-flex flex-column align-items-center gap-1"
            @click="filterByCategory(cat.slug)"
          >
            <i :class="[cat.icon, `text-${cat.badge_color}`, 'fs-4']" aria-hidden="true"></i>
            <span class="fw-semibold small">{{ cat.name }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Featured Upcoming Events -->
    <section class="container py-3">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h2 class="h4 fw-bold mb-1">Featured &amp; Popular Upcoming Events</h2>
          <p class="text-body-secondary small mb-0">
            Ranked by driver RSVPs and community likes across Australia &amp; Malaysia
          </p>
        </div>
        <div class="btn-group btn-group-sm" role="group" aria-label="Filter featured events by region">
          <button
            type="button"
            class="btn"
            :class="quickRegion === 'All' ? 'btn-apex' : 'btn-outline-secondary'"
            @click="quickRegion = 'All'; loadHomeData()"
          >
            All (AU &amp; MY)
          </button>
          <button
            type="button"
            class="btn"
            :class="quickRegion === 'Australia' ? 'btn-apex' : 'btn-outline-secondary'"
            @click="quickRegion = 'Australia'; loadHomeData()"
          >
            Australia (VIC)
          </button>
          <button
            type="button"
            class="btn"
            :class="quickRegion === 'Malaysia' ? 'btn-apex' : 'btn-outline-secondary'"
            @click="quickRegion = 'Malaysia'; loadHomeData()"
          >
            Malaysia (MY)
          </button>
        </div>
      </div>

      <!-- Skeleton Shimmer Grid while loading -->
      <div v-if="loading" class="row g-4">
        <div v-for="n in 6" :key="n" class="col-12 col-md-6 col-lg-4">
          <SkeletonCard />
        </div>
      </div>

      <div v-else class="row g-4">
        <div
          v-for="ev in featuredEvents"
          :key="ev.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <EventCard :event="ev" @toggle-like="handleToggleLike" />
        </div>
      </div>
    </section>

    <!-- Regional Circuit Hubs (AU vs MY Cross-Border Spotlight) -->
    <section class="container py-4">
      <h2 class="h4 fw-bold mb-3">
        <i class="bi bi-globe-asia-australia text-danger me-2" aria-hidden="true"></i>
        Cross-Border Motorsport Hubs
      </h2>
      <div class="row g-4">
        <div class="col-12 col-md-6">
          <div class="apex-card apex-card-hover p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-danger">AUSTRALIA HUB</span>
                <span class="font-monospace small text-body-secondary">37.8136° S, 144.9631° E</span>
              </div>
              <h3 class="h5 fw-bold mb-2">Melbourne &amp; Victoria Circuits</h3>
              <p class="small text-body-secondary mb-3">
                Featuring Sandown International Raceway, Calder Park Thunderdome, Winton Motor Raceway,
                Yarra Ranges Reefton Spur, and Docklands Harbour JDM night meets.
              </p>
            </div>
            <div class="d-flex gap-2">
              <button
                type="button"
                class="btn btn-sm btn-apex"
                @click="filterByRegionHub('Australia')"
              >
                Browse Australian Events
              </button>
              <router-link to="/explore" class="btn btn-sm btn-outline-secondary">
                View Victoria Map
              </router-link>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6">
          <div class="apex-card apex-card-hover p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-warning text-dark">MALAYSIA HUB</span>
                <span class="font-monospace small text-body-secondary">2.7608° N, 101.7383° E</span>
              </div>
              <h3 class="h5 fw-bold mb-2">Sepang Circuit &amp; Sarawak Touge</h3>
              <p class="small text-body-secondary mb-3">
                Featuring Petronas Sepang International Circuit F1 Night Track Days, KL Underground
                rotary meets, Kuching Borneo Samariang Drift, and Borneo Highlands Hillclimbs.
              </p>
            </div>
            <div class="d-flex gap-2">
              <button
                type="button"
                class="btn btn-sm btn-apex"
                @click="filterByRegionHub('Malaysia')"
              >
                Browse Malaysian Events
              </button>
              <router-link to="/explore" class="btn btn-sm btn-outline-secondary">
                View Malaysia Map
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- All 6 Official Clubs & Organizers -->
    <section class="container py-4">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h2 class="h4 fw-bold mb-1">Official Clubs &amp; Track Organizers ({{ allClubs.length }})</h2>
          <p class="text-body-secondary small mb-0">
            Verified motorsport clubs hosting regular meets, time attacks, and drift clinics
          </p>
        </div>
        <router-link to="/clubs" class="btn btn-sm btn-outline-secondary">
          Explore All {{ allClubs.length }} Clubs <i class="bi bi-arrow-right ms-1" aria-hidden="true"></i>
        </router-link>
      </div>

      <div class="row g-3">
        <div v-for="club in allClubs" :key="club.id" class="col-12 col-md-6 col-lg-4">
          <div class="apex-card apex-card-hover h-100 p-3 d-flex flex-column">
            <div class="d-flex align-items-center gap-3 mb-2">
              <img
                :src="club.logo"
                :alt="club.name"
                width="54"
                height="54"
                class="rounded-3 object-fit-cover border"
                loading="lazy"
              />
              <div>
                <div class="d-flex align-items-center gap-1 mb-1">
                  <span class="badge bg-secondary-subtle text-body-emphasis">
                    {{ club.city }}
                  </span>
                  <span class="badge bg-danger-subtle text-danger">
                    <i class="bi bi-patch-check-fill me-1" aria-hidden="true"></i>Verified
                  </span>
                </div>
                <h3 class="h6 fw-bold mb-0">{{ club.name }}</h3>
              </div>
            </div>
            <p class="small text-body-secondary flex-grow-1 mb-3">
              {{ club.description.slice(0, 115) }}...
            </p>
            <div class="d-flex align-items-center justify-content-between pt-2 border-top small">
              <span class="font-monospace"><strong>{{ club.events_count || 0 }}</strong> Sanctioned Events</span>
              <router-link :to="`/clubs/${club.id}`" class="text-danger text-decoration-none fw-semibold">
                Club Paddock →
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Role-Based Account Portals Overview -->
    <section class="container py-4">
      <div class="apex-card p-4">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <h2 class="h5 fw-bold mb-0">
            <i class="bi bi-shield-check text-warning me-2" aria-hidden="true"></i>
            Role-Based Portals &amp; Visibility Architecture
          </h2>
          <span class="small text-body-secondary">
            Tip: Press <kbd>Ctrl+K</kbd> anywhere to launch the Command Search Palette
          </span>
        </div>
        <div class="row g-3">
          <div class="col-12 col-md-6 col-lg-3">
            <div class="p-3 rounded-3 border h-100 d-flex flex-column justify-content-between">
              <div>
                <span class="badge bg-secondary mb-2">Guest Access</span>
                <h3 class="h6 fw-bold">Public Browsing</h3>
                <p class="small text-body-secondary mb-3">
                  Browse events, filter by category/date/price, and explore the interactive map &amp;
                  calendar. Exact paddock addresses and organizer contacts remain locked.
                </p>
              </div>
              <router-link to="/events" class="btn btn-sm btn-outline-secondary w-100">
                Browse Events
              </router-link>
            </div>
          </div>

          <div class="col-12 col-md-6 col-lg-3">
            <div class="p-3 rounded-3 border h-100 d-flex flex-column justify-content-between">
              <div>
                <span class="badge bg-info text-dark mb-2">Member Account</span>
                <h3 class="h6 fw-bold">RSVP, Rate &amp; Offline Vault</h3>
                <p class="small text-body-secondary mb-3">
                  Unlock exact paddock addresses and organizer contacts, RSVP (Going/Interested),
                  rate past track days, and pin events for offline PWA access.
                </p>
              </div>
              <router-link to="/my-events" class="btn btn-sm btn-outline-info w-100">
                Member Portal
              </router-link>
            </div>
          </div>

          <div class="col-12 col-md-6 col-lg-3">
            <div class="p-3 rounded-3 border h-100 d-flex flex-column justify-content-between">
              <div>
                <span class="badge bg-warning text-dark mb-2">Organizer Account</span>
                <h3 class="h6 fw-bold">Event CRUD &amp; Analytics</h3>
                <p class="small text-body-secondary mb-3">
                  Create, edit, and cancel track days or car meets, manage clubs, and track cumulative
                  RSVPs and capacity utilization via Chart.js analytics.
                </p>
              </div>
              <router-link to="/dashboard" class="btn btn-sm btn-outline-warning w-100">
                Organizer Dashboard
              </router-link>
            </div>
          </div>

          <div class="col-12 col-md-6 col-lg-3">
            <div class="p-3 rounded-3 border h-100 d-flex flex-column justify-content-between">
              <div>
                <span class="badge bg-danger mb-2">Admin Account</span>
                <h3 class="h6 fw-bold">Role &amp; Content Moderation</h3>
                <p class="small text-body-secondary mb-3">
                  Audit platform users, promote or revoke Organizer/Admin roles, moderate events
                  across all clubs, and remove policy-violating reviews.
                </p>
              </div>
              <router-link to="/admin" class="btn btn-sm btn-outline-danger w-100">
                Admin Panel
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
