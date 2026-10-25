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
  <div class="container apx-page">
    <header class="apx-head">
      <div>
        <p class="apx-eyebrow">Member account</p>
        <h1 class="apx-title">My RSVPs, likes &amp; offline vault</h1>
        <p class="apx-lede">
          Your confirmed entries, your watchlist, and the events saved for when there is no reception at the circuit.
        </p>
      </div>
      <div class="apx-actions">
        <button v-if="goingEvents.length > 0" type="button" class="apx-btn" @click="pinAllGoingOffline">
          <i class="bi bi-cloud-arrow-down-fill" aria-hidden="true"></i>Save all "Going" offline
        </button>
        <router-link to="/events" class="apx-btn apx-btn--primary">
          <i class="bi bi-search" aria-hidden="true"></i>Browse more events
        </router-link>
      </div>
    </header>

    <ul class="apx-tabs" aria-label="Event lists">
      <li>
        <button type="button" class="apx-tab" :class="{ 'is-active': activeTab === 'going' }" :aria-pressed="activeTab === 'going'" @click="activeTab = 'going'">
          <i class="bi bi-check2-circle" aria-hidden="true"></i>Going ({{ goingEvents.length }})
        </button>
      </li>
      <li>
        <button type="button" class="apx-tab" :class="{ 'is-active': activeTab === 'interested' }" :aria-pressed="activeTab === 'interested'" @click="activeTab = 'interested'">
          <i class="bi bi-star" aria-hidden="true"></i>Interested ({{ interestedEvents.length }})
        </button>
      </li>
      <li>
        <button type="button" class="apx-tab" :class="{ 'is-active': activeTab === 'liked' }" :aria-pressed="activeTab === 'liked'" @click="activeTab = 'liked'">
          <i class="bi bi-heart-fill" aria-hidden="true"></i>Liked ({{ likedEvents.length }})
        </button>
      </li>
      <li>
        <button type="button" class="apx-tab" :class="{ 'is-active': activeTab === 'offline' }" :aria-pressed="activeTab === 'offline'" @click="activeTab = 'offline'">
          <i class="bi bi-cloud-check-fill" aria-hidden="true"></i>Offline vault ({{ savedEvents.length }})
        </button>
      </li>
    </ul>

    <div v-if="activeTab !== 'offline'">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border" style="color: var(--apex-red)" role="status">
          <span class="visually-hidden">Loading your events...</span>
        </div>
      </div>

      <div
        v-else-if="
          (activeTab === 'going' && goingEvents.length === 0) ||
          (activeTab === 'interested' && interestedEvents.length === 0) ||
          (activeTab === 'liked' && likedEvents.length === 0)
        "
        class="apx-panel apx-panel--empty apx-tick"
      >
        <i class="bi bi-calendar2-x" aria-hidden="true"></i>
        <h2 class="h5 fw-bold">No events in this list yet</h2>
        <p class="small mb-3">Explore the event board to RSVP as Going or Interested, or heart your favourite meets.</p>
        <router-link to="/events" class="apx-btn apx-btn--primary">Explore events</router-link>
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

    <section v-else aria-label="Offline saved events vault">
      <div class="apx-panel apx-panel--accent apx-tick mb-4">
        <div class="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div style="max-width: 62ch">
            <h2 class="h5 fw-bold mb-2"><i class="bi bi-wifi-off me-2" style="color: var(--apex-red)" aria-hidden="true"></i>Trackside pass &amp; saved events</h2>
            <p class="small mb-0">
              Events saved here are kept on this device, so you can still read the exact gate address, GPS
              coordinates and organizer contact with no mobile reception at Winton, Phillip Island or Genting.
            </p>
          </div>
          <div class="d-flex flex-wrap align-items-center gap-2">
            <span class="apx-chip" :class="isOnline ? 'apx-chip--ok' : 'apx-chip--accent'">
              Network: {{ isOnline ? 'Online (Synced)' : 'Offline (Serving Local Vault)' }}
            </span>
            <button v-if="savedEvents.length > 0" type="button" class="apx-btn apx-btn--danger" @click="clearOfflineEvents">Clear vault</button>
          </div>
        </div>
      </div>

      <div v-if="savedEvents.length === 0" class="apx-panel apx-panel--empty apx-tick">
        <i class="bi bi-cloud-arrow-down" aria-hidden="true"></i>
        <h3 class="h5 fw-bold">Your offline vault is empty</h3>
        <p class="small mb-0">
          Click the cloud-download icon on any event card, or use "Save all Going offline" above, to cache events for offline viewing.
        </p>
      </div>

      <div v-else class="row g-4">
        <div v-for="ev in savedEvents" :key="ev.id" class="col-12 col-md-6">
          <div class="apx-panel apx-tick h-100">
            <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
              <span class="apx-chip apx-chip--accent"><i class="bi bi-cloud-check-fill" aria-hidden="true"></i>Offline ready</span>
              <button type="button" class="apx-btn apx-btn--danger" style="min-height: 36px; padding: 0.3rem 0.7rem" @click="toggleSaveOffline(ev)">Remove</button>
            </div>
            <h3 class="h5 fw-bold mb-1">{{ ev.title }}</h3>
            <div class="apx-mono small mb-3" style="color: var(--apex-red)">{{ ev.start_datetime }} — {{ ev.end_datetime }}</div>
            <dl class="small mb-3 apx-vault-list">
              <div><dt>Venue</dt><dd>{{ ev.venue }} ({{ ev.region }})</dd></div>
              <div><dt>Gate address</dt><dd>{{ ev.address }}</dd></div>
              <div><dt>GPS</dt><dd><code>{{ ev.latitude }}, {{ ev.longitude }}</code></dd></div>
              <div><dt>Organizer</dt><dd>{{ ev.organizer_contact }}</dd></div>
            </dl>
            <router-link :to="`/events/${ev.id}`" class="apx-btn apx-btn--primary">Open cached event <i class="bi bi-arrow-right" aria-hidden="true"></i></router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.apx-vault-list { display: grid; gap: 0.6rem; margin: 0; }
.apx-vault-list > div { display: grid; grid-template-columns: 7rem minmax(0, 1fr); gap: 0.75rem; padding-top: 0.6rem; border-top: 1px solid var(--apex-border); }
.apx-vault-list dt { color: var(--apex-text-muted); font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
.apx-vault-list dd { margin: 0; overflow-wrap: anywhere; }
@media (max-width: 480px) { .apx-vault-list > div { grid-template-columns: minmax(0, 1fr); gap: 0.15rem; } }
</style>
