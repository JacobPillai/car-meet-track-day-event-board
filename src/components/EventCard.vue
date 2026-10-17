<script setup>
import { computed } from 'vue'
import { useOfflineEvents } from '../composables/useOfflineEvents'
import { useToast } from '../composables/useToast'

const props = defineProps({
  event: {
    type: Object,
    required: true
  },
  showOfflineToggle: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['toggle-like', 'rsvp-change'])
const { isEventSavedOffline, toggleSaveOffline } = useOfflineEvents()
const { showToast } = useToast()

const parsedDate = computed(() => {
  if (!props.event.start_datetime) return null
  const iso = String(props.event.start_datetime).replace(' ', 'T')
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
})

const ticketMonth = computed(() =>
  parsedDate.value
    ? parsedDate.value.toLocaleDateString('en-AU', { month: 'short' }).toUpperCase()
    : 'OCT'
)

const ticketDay = computed(() =>
  parsedDate.value ? String(parsedDate.value.getDate()).padStart(2, '0') : '24'
)

const formattedDate = computed(() => {
  if (!parsedDate.value) return props.event.start_datetime || 'TBA'
  return parsedDate.value.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const priceLabel = computed(() => {
  const num = Number(props.event.price || 0)
  if (num <= 0) return 'FREE ENTRY'
  const currency = props.event.region === 'Malaysia' ? 'RM ' : 'A$'
  return `${currency}${num.toFixed(0)}`
})

const capacityPercent = computed(() => {
  const cap = Math.max(1, Number(props.event.capacity || 100))
  const going = Number(props.event.going_count || 0)
  return Math.min(100, Math.round((going / cap) * 100))
})

const isSellingFast = computed(
  () => props.event.status === 'upcoming' && capacityPercent.value >= 45
)

const isPinnedOffline = computed(() => isEventSavedOffline(props.event.id))

function handlePinClick() {
  const saved = toggleSaveOffline(props.event)
  showToast(
    saved
      ? `"${props.event.title}" saved to Offline PWA Vault.`
      : `Removed "${props.event.title}" from Offline PWA Vault.`,
    saved ? 'success' : 'info'
  )
}
</script>

<template>
  <article class="card apex-card apex-card-hover h-100 overflow-hidden">
    <!-- Event Image, Ticket Date Block & Status Pills -->
    <div class="position-relative overflow-hidden" style="height: 205px">
      <img
        :src="
          event.image ||
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80'
        "
        :alt="event.title"
        class="w-100 h-100 object-fit-cover apex-card-img-zoom"
        loading="lazy"
      />

      <!-- Top Overlay Row -->
      <div
        class="position-absolute top-0 start-0 w-100 p-3 d-flex justify-content-between align-items-start"
        style="background: linear-gradient(180deg, rgba(9,11,16,0.82) 0%, transparent 100%)"
      >
        <div class="d-flex flex-wrap gap-1">
          <span class="badge" :class="`bg-${event.badge_color || 'danger'}`">
            <i :class="[event.category_icon || 'bi-flag-fill', 'me-1']" aria-hidden="true"></i>
            {{ event.category_name || 'Track Event' }}
          </span>
          <span class="badge bg-dark bg-opacity-75 border border-secondary font-mono">
            {{ event.region === 'Malaysia' ? 'MY' : 'AU' }}
          </span>
          <span v-if="isSellingFast" class="badge bg-warning text-dark fw-bold">
            <i class="bi bi-fire me-1" aria-hidden="true"></i>Selling Fast
          </span>
          <span v-if="event.status === 'completed'" class="badge bg-secondary">
            Completed
          </span>
          <span v-else-if="event.status === 'cancelled'" class="badge bg-danger">
            Cancelled
          </span>
        </div>

        <!-- Ticket Date Block -->
        <div class="apex-date-ticket" aria-hidden="true">
          <div class="apex-date-ticket-month">{{ ticketMonth }}</div>
          <div class="apex-date-ticket-day">{{ ticketDay }}</div>
        </div>
      </div>

      <!-- Bottom Image Overlay: Price & Distance -->
      <div
        class="position-absolute bottom-0 start-0 w-100 px-3 py-2 d-flex justify-content-between align-items-end"
        style="background: linear-gradient(0deg, rgba(9,11,16,0.9) 0%, transparent 100%)"
      >
        <span class="badge bg-dark bg-opacity-75 text-warning fw-bold border border-warning-subtle font-mono">
          {{ priceLabel }}
        </span>

        <span
          v-if="event.distance_km !== null && event.distance_km !== undefined"
          class="badge bg-dark bg-opacity-75 text-light font-mono"
        >
          <i class="bi bi-compass me-1 text-danger" aria-hidden="true"></i>
          {{ event.distance_km }} km away
        </span>
      </div>
    </div>

    <!-- Card Body -->
    <div class="card-body d-flex flex-column p-3">
      <div class="small text-danger fw-semibold font-mono mb-1" style="font-size: 0.78rem">
        <i class="bi bi-clock me-1" aria-hidden="true"></i>{{ formattedDate }}
      </div>

      <h3 class="h5 card-title fw-bold mb-1 font-display">
        <router-link
          :to="`/events/${event.id}`"
          class="text-decoration-none text-body stretched-link-title"
        >
          {{ event.title }}
        </router-link>
      </h3>

      <p class="small text-body-secondary mb-2">
        <i class="bi bi-geo-alt-fill text-danger me-1" aria-hidden="true"></i>
        {{ event.venue }}
        <span v-if="event.club_name" class="d-block mt-1">
          <i class="bi bi-shield-check text-warning me-1" aria-hidden="true"></i>
          {{ event.club_name }}
        </span>
      </p>

      <!-- Capacity / Going Telemetry Bar -->
      <div class="mt-auto pt-2">
        <div class="d-flex justify-content-between small mb-1 font-mono" style="font-size: 0.76rem">
          <span>
            <strong>{{ event.going_count || 0 }}</strong>/{{ event.capacity || 100 }} Going
            <span v-if="event.interested_count" class="text-body-secondary">
              (+{{ event.interested_count }} int)
            </span>
          </span>
          <span class="text-body-secondary">{{ capacityPercent }}% Full</span>
        </div>
        <div
          class="progress mb-3"
          style="height: 6px"
          role="progressbar"
          :aria-label="`Event capacity ${capacityPercent}%`"
          :aria-valuenow="capacityPercent"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            class="progress-bar"
            :class="capacityPercent >= 80 ? 'bg-danger' : 'bg-warning'"
            :style="{ width: `${capacityPercent}%` }"
          ></div>
        </div>

        <!-- Bottom Action Row -->
        <div class="d-flex align-items-center justify-content-between gap-2 pt-2 border-top">
          <div class="d-flex align-items-center gap-2">
            <button
              type="button"
              class="btn btn-sm font-mono"
              :class="event.user_liked ? 'btn-danger' : 'btn-outline-secondary'"
              :aria-label="`Like ${event.title}`"
              @click.stop="emit('toggle-like', event)"
            >
              <i :class="event.user_liked ? 'bi bi-heart-fill' : 'bi bi-heart'" aria-hidden="true"></i>
              <span class="ms-1">{{ event.likes_count || 0 }}</span>
            </button>

            <button
              v-if="showOfflineToggle"
              type="button"
              class="btn btn-sm"
              :class="isPinnedOffline ? 'btn-warning text-dark' : 'btn-outline-secondary'"
              :title="
                isPinnedOffline
                  ? 'Saved for Offline PWA Access (click to remove)'
                  : 'Save event for Offline PWA Access'
              "
              :aria-label="isPinnedOffline ? 'Remove from offline cache' : 'Save for offline access'"
              @click.stop="handlePinClick"
            >
              <i
                :class="isPinnedOffline ? 'bi bi-cloud-check-fill' : 'bi bi-cloud-arrow-down'"
                aria-hidden="true"
              ></i>
            </button>
          </div>

          <router-link :to="`/events/${event.id}`" class="btn btn-sm btn-apex">
            Details <i class="bi bi-arrow-right ms-1" aria-hidden="true"></i>
          </router-link>
        </div>
      </div>
    </div>
  </article>
</template>
