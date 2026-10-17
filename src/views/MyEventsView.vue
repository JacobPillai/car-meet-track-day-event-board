<script setup>
/**
 * ApexGrid — Member Account Portal: My RSVPs, Liked Events & Offline PWA Cache (Jacob's Feature)
 */
import { ref, computed, onMounted } from 'vue'
import { api } from '../services/api'
import { useOfflineEvents } from '../composables/useOfflineEvents'
import EventCard from '../components/EventCard.vue'

const {
  savedEvents,
  isOnline,
  toggleSaveOffline,
  clearOfflineEvents
} = useOfflineEvents()

const rsvpEvents = ref([])
const likedEvents = ref([])
const loading = ref(true)
const activeTab = ref('going')

const goingEvents = computed(() =>
  rsvpEvents.value.filter((e) => e.rsvp_status === 'going')
)
const interestedEvents = computed(() =>
  rsvpEvents.value.filter((e) => e.rsvp_status === 'interested')
)

async function loadMyEvents() {
  loading.value = true
  try {
    const res = await api.get('/users/me/rsvps')
    rsvpEvents.value = res.rsvp_events || []
    likedEvents.value = res.liked_events || []
  } finally {
    loading.value = false
  }
}

async function handleToggleLike(ev) {
  if (ev.user_liked) {
    await api.delete(`/events/${ev.id}/like`)
  } else {
    await api.post(`/events/${ev.id}/like`)
  }
  await loadMyEvents()
}

function pinAllGoingOffline() {
  goingEvents.value.forEach((ev) => {
    if (!savedEvents.value.some((s) => Number(s.id) === Number(ev.id))) {
      toggleSaveOffline(ev)
    }
  })
  activeTab.value = 'offline'
}

onMounted(() => {
  loadMyEvents()
})
</script>

<template>
  <div class="container py-4">
    <!-- Member Portal Header -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div>
        <span class="badge bg-info text-dark mb-1">
          <i class="bi bi-person-Workspace me-1" aria-hidden="true"></i>Member Account Portal
        </span>
        <h1 class="h3 fw-bold mb-1">My RSVPs, Likes &amp; Offline PWA Vault</h1>
        <p class="text-body-secondary small mb-0">
          Manage your confirmed track-day entries, watchlist, and offline-cached events for remote circuits
        </p>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <button
          v-if="goingEvents.length > 0"
          type="button"
          class="btn btn-sm btn-warning text-dark fw-semibold"
          @click="pinAllGoingOffline"
        >
          <i class="bi bi-cloud-arrow-down-fill me-1" aria-hidden="true"></i>
          Sync All "Going" Events to Offline PWA Cache
        </button>
        <router-link to="/events" class="btn btn-sm btn-apex">
          <i class="bi bi-search me-1" aria-hidden="true"></i>Browse More Events
        </router-link>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <ul class="nav nav-pills gap-2 mb-4" role="tablist">
      <li class="nav-item">
        <button
          type="button"
          class="nav-link"
          :class="{ active: activeTab === 'going', 'bg-danger': activeTab === 'going' }"
          @click="activeTab = 'going'"
        >
          <i class="bi bi-check2-circle me-1" aria-hidden="true"></i>
          Going ({{ goingEvents.length }})
        </button>
      </li>
      <li class="nav-item">
        <button
          type="button"
          class="nav-link"
          :class="{ active: activeTab === 'interested', 'bg-danger': activeTab === 'interested' }"
          @click="activeTab = 'interested'"
        >
          <i class="bi bi-star me-1" aria-hidden="true"></i>
          Interested ({{ interestedEvents.length }})
        </button>
      </li>
      <li class="nav-item">
        <button
          type="button"
          class="nav-link"
          :class="{ active: activeTab === 'liked', 'bg-danger': activeTab === 'liked' }"
          @click="activeTab = 'liked'"
        >
          <i class="bi bi-heart-fill me-1" aria-hidden="true"></i>
          Liked ({{ likedEvents.length }})
        </button>
      </li>
      <li class="nav-item">
        <button
          type="button"
          class="nav-link"
          :class="{
            active: activeTab === 'offline',
            'bg-warning text-dark fw-bold': activeTab === 'offline'
          }"
          @click="activeTab = 'offline'"
        >
          <i class="bi bi-cloud-check-fill me-1" aria-hidden="true"></i>
          Offline Saved Vault ({{ savedEvents.length }})
        </button>
      </li>
    </ul>

    <!-- Tab 1/2/3: Going, Interested, Liked -->
    <div v-if="activeTab !== 'offline'">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-danger" role="status">
          <span class="visually-hidden">Loading your events...</span>
        </div>
      </div>

      <div
        v-else-if="
          (activeTab === 'going' && goingEvents.length === 0) ||
          (activeTab === 'interested' && interestedEvents.length === 0) ||
          (activeTab === 'liked' && likedEvents.length === 0)
        "
        class="apex-card p-5 text-center"
      >
        <i class="bi bi-calendar2-x display-5 text-secondary mb-2 d-block" aria-hidden="true"></i>
        <h2 class="h5 fw-bold">No Events in This List Yet</h2>
        <p class="text-body-secondary small mb-3">
          Explore the Event Board to RSVP as Going/Interested or heart your favorite meets.
        </p>
        <router-link to="/events" class="btn btn-sm btn-apex">Explore Events</router-link>
      </div>

      <div v-else class="row g-4">
        <div
          v-for="ev in activeTab === 'going'
            ? goingEvents
            : activeTab === 'interested'
              ? interestedEvents
              : likedEvents"
          :key="ev.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <EventCard :event="ev" @toggle-like="handleToggleLike" />
        </div>
      </div>
    </div>

    <!-- Tab 4: Jacob's Offline PWA Saved Events Vault -->
    <section v-else aria-label="Offline saved events vault">
      <div class="apex-card p-4 mb-4 border-warning">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div>
            <h2 class="h5 fw-bold mb-1">
              <i class="bi bi-wifi-off text-warning me-2" aria-hidden="true"></i>
              PWA Offline Trackside Pass &amp; Saved Events
            </h2>
            <p class="small text-body-secondary mb-0">
              Events pinned here are stored locally alongside the Service Worker (`vite-plugin-pwa`)
              so you can read exact paddock gate addresses, GPS coordinates, and organizer contacts
              even with zero mobile reception at Winton, Phillip Island, or Genting.
            </p>
          </div>

          <div class="d-flex align-items-center gap-2">
            <span
              class="badge"
              :class="isOnline ? 'bg-success' : 'bg-warning text-dark'"
            >
              Network: {{ isOnline ? 'Online (Synced)' : 'Offline (Serving Local Vault)' }}
            </span>
            <button
              v-if="savedEvents.length > 0"
              type="button"
              class="btn btn-sm btn-outline-danger"
              @click="clearOfflineEvents"
            >
              Clear Vault
            </button>
          </div>
        </div>
      </div>

      <div v-if="savedEvents.length === 0" class="apex-card p-5 text-center">
        <i class="bi bi-cloud-arrow-down display-5 text-warning mb-2 d-block" aria-hidden="true"></i>
        <h3 class="h5 fw-bold">Your Offline PWA Vault is Empty</h3>
        <p class="text-body-secondary small mb-3">
          Click the cloud-download icon on any event card or click "Sync All Going Events" above to
          cache events for offline viewing.
        </p>
      </div>

      <div v-else class="row g-4">
        <div v-for="ev in savedEvents" :key="ev.id" class="col-12 col-md-6">
          <div class="apex-card p-4 h-100 border-warning-subtle">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="badge bg-warning text-dark">
                <i class="bi bi-cloud-check-fill me-1" aria-hidden="true"></i>Offline Ready
              </span>
              <button
                type="button"
                class="btn btn-sm btn-outline-danger py-0 px-2"
                @click="toggleSaveOffline(ev)"
              >
                Remove
              </button>
            </div>
            <h3 class="h5 fw-bold mb-1">{{ ev.title }}</h3>
            <div class="small text-danger fw-semibold mb-2">
              {{ ev.start_datetime }} — {{ ev.end_datetime }}
            </div>
            <div class="p-3 rounded border small mb-3" style="background-color: var(--apex-bg-elevated)">
              <div><strong>Venue:</strong> {{ ev.venue }} ({{ ev.region }})</div>
              <div class="mt-1"><strong>Gate Address:</strong> {{ ev.address }}</div>
              <div class="mt-1"><strong>GPS:</strong> <code>{{ ev.latitude }}, {{ ev.longitude }}</code></div>
              <div class="mt-1"><strong>Organizer Contact:</strong> {{ ev.organizer_contact }}</div>
            </div>
            <router-link :to="`/events/${ev.id}`" class="btn btn-sm btn-apex">
              Open Full Cached Event Page →
            </router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
