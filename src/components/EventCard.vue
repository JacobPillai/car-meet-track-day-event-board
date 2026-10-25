<script setup>
import { computed, ref, watch } from 'vue'
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
const imageFailed = ref(false)

watch(() => [props.event.id, props.event.image], () => {
  imageFailed.value = false
})

const parsedDate = computed(() => {
  if (!props.event.start_datetime) return null
  const iso = String(props.event.start_datetime).replace(' ', 'T')
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
})

const formattedDate = computed(() => {
  if (!parsedDate.value) return 'Date to be announced'
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
  const raw = props.event.price
  const price = Number(raw)
  if (raw === null || raw === undefined || raw === '' || !Number.isFinite(price) || price < 0) {
    return 'Price to be announced'
  }
  const currency = props.event.region === 'Malaysia' ? 'RM ' : 'A$'
  const amount = price.toLocaleString('en-AU', { maximumFractionDigits: 2 })
  return price === 0 ? `Free entry · ${currency}0` : `${currency}${amount}`
})

const statusLabel = computed(() => {
  if (props.event.status === 'cancelled') return 'Cancelled'
  if (props.event.status === 'completed') return 'Completed'
  const capacity = Number(props.event.capacity)
  const going = Number(props.event.going_count)
  const atCapacity = Number.isFinite(capacity) && capacity > 0 &&
    Number.isFinite(going) && going >= capacity
  if (props.event.status === 'full' || (props.event.status === 'upcoming' && atCapacity)) {
    return 'Full'
  }
  return ''
})

const attendanceLabel = computed(() => {
  if (props.event.status === 'cancelled') return ''
  const parts = []
  const going = Number(props.event.going_count)
  const interested = Number(props.event.interested_count)
  if (Number.isFinite(going) && going > 0) {
    parts.push(`${going} ${props.event.status === 'completed' ? 'marked as going' : 'going'}`)
  }
  if (Number.isFinite(interested) && interested > 0) parts.push(`${interested} interested`)
  return parts.join(' · ')
})

const isPinnedOffline = computed(() => isEventSavedOffline(props.event.id))

function handlePinClick() {
  const saved = toggleSaveOffline(props.event)
  showToast(
    saved
      ? `"${props.event.title}" saved for offline.`
      : `"${props.event.title}" removed from saved offline events.`,
    saved ? 'success' : 'info'
  )
}
</script>

<template>
  <article class="event-card">
    <router-link
      :to="`/events/${event.id}`"
      class="event-card__photo"
      :aria-label="`View ${event.title}`"
    >
      <img
        v-if="event.image && !imageFailed"
        :src="event.image"
        :alt="event.title"
        loading="lazy"
        decoding="async"
        @error="imageFailed = true"
      />
      <span v-else class="event-card__placeholder">
        <i class="bi bi-image" aria-hidden="true"></i>
        Photo not available
      </span>
    </router-link>

    <div class="event-card__body">
      <h3 class="event-card__title">
        <router-link :to="`/events/${event.id}`">{{ event.title }}</router-link>
      </h3>
      <div class="event-card__details">
        <time v-if="parsedDate" :datetime="parsedDate.toISOString()">{{ formattedDate }}</time>
        <span v-else>{{ formattedDate }}</span>
        <p>{{ event.venue || 'Venue to be announced' }}<span v-if="event.region"> · {{ event.region }}</span></p>
      </div>

      <div class="event-card__price-row">
        <span class="event-card__price">{{ priceLabel }}</span>
        <span
          v-if="statusLabel"
          class="event-card__status"
          :class="{ 'event-card__status--cancelled': event.status === 'cancelled' }"
        >{{ statusLabel }}</span>
      </div>

      <div class="event-card__context">
        <p v-if="event.category_name || event.club_name">
          <span v-if="event.category_name">{{ event.category_name }}</span>
          <span v-if="event.category_name && event.club_name"> · </span>
          <span v-if="event.club_name">{{ event.club_name }}</span>
        </p>
        <p v-if="event.distance_km !== null && event.distance_km !== undefined">{{ event.distance_km }} km away</p>
        <p v-if="attendanceLabel" class="event-card__attendance">{{ attendanceLabel }}</p>
      </div>

      <div class="event-card__actions">
        <button
          type="button"
          class="event-card__toggle"
          :aria-label="`Like ${event.title}`"
          :aria-pressed="Boolean(event.user_liked)"
          @click.stop="emit('toggle-like', event)"
        >
          <i :class="event.user_liked ? 'bi bi-heart-fill' : 'bi bi-heart'" aria-hidden="true"></i>
          <span>{{ event.likes_count || 0 }}</span>
        </button>
        <button
          v-if="showOfflineToggle"
          type="button"
          class="event-card__toggle event-card__save"
          :aria-label="isPinnedOffline ? 'Remove from saved offline events' : 'Save for offline'"
          :aria-pressed="isPinnedOffline"
          @click.stop="handlePinClick"
        >
          <i
            :class="isPinnedOffline ? 'bi bi-cloud-check-fill' : 'bi bi-cloud-arrow-down'"
            aria-hidden="true"
          ></i>
          <span>{{ isPinnedOffline ? 'Saved offline' : 'Save offline' }}</span>
        </button>
        <router-link :to="`/events/${event.id}`" class="event-card__view" :aria-label="`View event: ${event.title}`">
          View event <i class="bi bi-arrow-right" aria-hidden="true"></i>
        </router-link>
      </div>
    </div>
  </article>
</template>

<style scoped>
.event-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  color: var(--apex-text-primary, #f8fafc);
  background: var(--apex-bg-surface, #11151f);
  border: 1px solid var(--apex-border-strong, #38404d);
  border-radius: 0;
}

.event-card__photo {
  display: grid;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  color: var(--apex-text-muted, #94a3b8);
  background: var(--apex-bg-elevated, #171c29);
  text-decoration: none;
}

.event-card__photo img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
}

.event-card__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 1.5rem;
  font-size: 0.875rem;
}

.event-card__placeholder i { font-size: 1.75rem; }

.event-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.85rem;
  padding: clamp(1rem, 3vw, 1.4rem);
  overflow-wrap: anywhere;
}

.event-card__title {
  margin: 0;
  font-family: 'JetBrains Mono', ui-monospace, monospace; text-transform: uppercase;
  font-size: clamp(1rem, 1.6vw, 1.15rem);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.025em;
}

.event-card__title a { color: inherit; text-decoration: none; }
.event-card__title a:hover { text-decoration: underline; text-underline-offset: 0.2em; }

.event-card__details { font-size: 0.9rem; line-height: 1.6; }
.event-card__details p { margin: 0.15rem 0 0; color: var(--apex-text-muted, #94a3b8); }

.event-card__price-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}

.event-card__price { font-size: 1rem; font-weight: 600; }
.event-card__status { font-size: 0.8rem; font-weight: 600; }
.event-card__status--cancelled { color: var(--apex-red, #ff2a4b); }

.event-card__context {
  margin-bottom: 0.25rem;
  color: var(--apex-text-muted, #94a3b8);
  font-size: 0.8rem;
  line-height: 1.6;
}
.event-card__context p { margin: 0; }

.event-card__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.65rem;
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid var(--apex-border-strong, #38404d);
}

.event-card__toggle,
.event-card__view {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 44px;
  padding: 0.4rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  font-size: 0.8rem;
  line-height: 1.4;
  text-decoration: none;
}

.event-card__toggle { cursor: pointer; }
.event-card__toggle[aria-pressed='true'] { color: var(--apex-red, #ff2a4b); }
.event-card__toggle:hover,
.event-card__view:hover { background: var(--apex-bg-elevated, #171c29); border-color: var(--apex-border-strong, #38404d); }
.event-card__view { margin-left: auto; font-weight: 600; }

.event-card a:focus-visible,
.event-card button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}
.event-card__photo:focus-visible { outline-offset: -4px; }

@media (max-width: 360px) {
  .event-card__actions { gap: 0.25rem; }
  .event-card__toggle,
  .event-card__view { padding-inline: 0.35rem; }
}
</style>
