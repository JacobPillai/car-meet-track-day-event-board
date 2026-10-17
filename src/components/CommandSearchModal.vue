<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getDb } from '../services/localDb'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])
const router = useRouter()
const query = ref('')
const inputRef = ref(null)

const dbSnapshot = computed(() => {
  if (!props.open) return { events: [], clubs: [] }
  return getDb()
})

const matchedEvents = computed(() => {
  const q = query.value.trim().toLowerCase()
  const all = dbSnapshot.value.events || []
  if (!q) return all.slice(0, 5)
  return all
    .filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.region.toLowerCase().includes(q)
    )
    .slice(0, 6)
})

const matchedClubs = computed(() => {
  const q = query.value.trim().toLowerCase()
  const all = dbSnapshot.value.clubs || []
  if (!q) return all.slice(0, 3)
  return all
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q)
    )
    .slice(0, 4)
})

function goTo(path) {
  emit('close')
  query.value = ''
  router.push(path)
}

function handleKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    if (props.open) emit('close')
  } else if (e.key === 'Escape' && props.open) {
    emit('close')
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && typeof window !== 'undefined') {
      window.setTimeout(() => {
        inputRef.value?.focus()
      }, 50)
    }
  }
)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    v-if="open"
    class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-start justify-content-center pt-5 px-3"
    style="z-index: 1090; background: rgba(9, 11, 16, 0.78); backdrop-filter: blur(6px)"
    role="dialog"
    aria-modal="true"
    aria-label="Quick command search"
    @click.self="emit('close')"
  >
    <div class="apex-card w-100 overflow-hidden shadow-lg" style="max-width: 620px">
      <div class="p-3 border-bottom d-flex align-items-center gap-2">
        <i class="bi bi-search text-danger fs-5" aria-hidden="true"></i>
        <input
          ref="inputRef"
          v-model="query"
          type="search"
          class="form-control border-0 bg-transparent shadow-none"
          placeholder="Jump to any circuit, track day, club, or region (Sandown, Sepang, Kuching...)"
          aria-label="Search events and clubs"
        />
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary font-mono"
          @click="emit('close')"
        >
          ESC
        </button>
      </div>

      <div class="p-3 overflow-auto" style="max-height: 420px">
        <!-- Events Matches -->
        <div class="small text-uppercase fw-bold text-body-secondary mb-2">
          Motorsport Events ({{ matchedEvents.length }})
        </div>
        <div class="list-group list-group-flush mb-3">
          <button
            v-for="ev in matchedEvents"
            :key="ev.id"
            type="button"
            class="list-group-item list-group-item-action bg-transparent d-flex justify-content-between align-items-center py-2 px-2 rounded-2"
            @click="goTo(`/events/${ev.id}`)"
          >
            <div>
              <div class="fw-semibold small">{{ ev.title }}</div>
              <div class="text-body-secondary" style="font-size: 0.76rem">
                <i class="bi bi-geo-alt text-danger me-1"></i>{{ ev.venue }} ({{ ev.region }})
              </div>
            </div>
            <span class="badge bg-danger font-mono">
              {{ Number(ev.price) <= 0 ? 'FREE' : `$${ev.price}` }}
            </span>
          </button>
        </div>

        <!-- Clubs Matches -->
        <div class="small text-uppercase fw-bold text-body-secondary mb-2">
          Verified Clubs ({{ matchedClubs.length }})
        </div>
        <div class="list-group list-group-flush">
          <button
            v-for="cl in matchedClubs"
            :key="cl.id"
            type="button"
            class="list-group-item list-group-item-action bg-transparent d-flex justify-content-between align-items-center py-2 px-2 rounded-2"
            @click="goTo(`/clubs/${cl.id}`)"
          >
            <div>
              <div class="fw-semibold small">{{ cl.name }}</div>
              <div class="text-body-secondary" style="font-size: 0.76rem">
                {{ cl.city }} • {{ cl.region }}
              </div>
            </div>
            <i class="bi bi-arrow-right text-body-secondary"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
