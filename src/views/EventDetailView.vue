<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { useOfflineEvents } from '../composables/useOfflineEvents'
import { useToast } from '../composables/useToast'
import EventMap from '../components/EventMap.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()
const {
  isEventSavedOffline,
  toggleSaveOffline,
  getOfflineEventById
} = useOfflineEvents()

const event = ref(null)
const comments = ref([])
const loading = ref(true)
const error = ref(null)
const actionFeedback = ref('')

// Comment & Rating form state
const newCommentBody = ref('')
const newCommentRating = ref(5)
const includeRating = ref(false)
const submittingComment = ref(false)

const eventId = computed(() => Number(route.params.id))
const isSavedOffline = computed(() => event.value && isEventSavedOffline(event.value.id))

const canManageEvent = computed(() => {
  if (!authStore.isAuthenticated || !event.value) return false
  if (authStore.isAdmin) return true
  return (
    authStore.isOrganizer &&
    Number(event.value.organizer_id) === Number(authStore.user?.id)
  )
})

const capacityPercent = computed(() => {
  if (!event.value) return 0
  return Math.min(
    100,
    Math.round(((event.value.going_count || 0) / Math.max(1, event.value.capacity || 100)) * 100)
  )
})

// Generate structured Track-Day Run-Sheet / Session Timeline from start_datetime & end_datetime
const runSheetSteps = computed(() => {
  if (!event.value || !event.value.start_datetime) return []
  const startRaw = event.value.start_datetime.replace(' ', 'T')
  const endRaw = (event.value.end_datetime || event.value.start_datetime).replace(' ', 'T')
  const startDate = new Date(startRaw)
  const endDate = new Date(endRaw)

  const fmtTime = (dt) => {
    if (Number.isNaN(dt.getTime())) return 'TBA'
    return dt.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const plusMins = (dt, mins) => new Date(dt.getTime() + mins * 60000)

  const isTrackOrDrift = ['track-day', 'drift', 'drag', 'touge'].includes(
    event.value.category_slug
  )

  if (isTrackOrDrift) {
    return [
      {
        time: fmtTime(startDate),
        title: 'Gates Open, Garage Allocation & Scrutineering',
        desc: 'Transponder pickup, helmet/brake fluid inspection, and sound test (<95dB static).'
      },
      {
        time: fmtTime(plusMins(startDate, 35)),
        title: 'Compulsory Drivers & Marshals Briefing',
        desc: 'Flag signals, overtaking zones, recovery procedures, and roll-call sign-on.'
      },
      {
        time: fmtTime(plusMins(startDate, 60)),
        title: 'Green Track — Sighting Laps & Timed Sessions',
        desc: 'Grouped 15-minute sessions (Novice, Intermediate, Open Pitlane / Tandem Runs).'
      },
      {
        time: fmtTime(endDate),
        title: 'Chequered Flag, Lap Telemetry Export & Paddock Pack-Down',
        desc: 'Return timing transponders to Race Control and post your review below.'
      }
    ]
  }

  return [
    {
      time: fmtTime(startDate),
      title: 'Paddock Gates Open & Show Bay Roll-In',
      desc: 'Marshals direct clubs and individual builds into designated display bays.'
    },
    {
      time: fmtTime(plusMins(startDate, 45)),
      title: 'Main Showcase, Photography & Community Meet',
      desc: 'Coffee vans open, club networking, and Peoples Choice voting.'
    },
    {
      time: fmtTime(endDate),
      title: 'Peaceful Dispersion & Venue Pack-Down',
      desc: 'Respect local venue noise limits on exit — zero hooning or excessive revving.'
    }
  ]
})

async function copyToClipboard(text, label) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      showToast(`Copied ${label} to clipboard!`, 'success')
    }
  } catch {
    showToast(`Could not copy ${label}.`, 'warning')
  }
}

async function loadEventDetails() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get(`/events/${eventId.value}`)
    event.value = res.data
    if (event.value.status === 'completed') {
      includeRating.value = true
    }
    const cRes = await api.get(`/events/${eventId.value}/comments`)
    comments.value = cRes.data || []
  } catch (err) {
    // Fallback to offline saved cache if network is down
    const cached = getOfflineEventById(eventId.value)
    if (cached) {
      event.value = cached
      actionFeedback.value = 'Loaded from your Offline PWA Saved Events cache.'
      showToast('Loaded event from Offline PWA Vault.', 'info')
    } else {
      error.value = err.message || 'Could not load event details.'
    }
  } finally {
    loading.value = false
  }
}

async function handleRsvp(status) {
  if (!authStore.isAuthenticated) {
    showToast('Please sign in to RSVP to this event.', 'info')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  try {
    if (event.value.user_rsvp_status === status) {
      await api.delete(`/events/${event.value.id}/rsvp`)
      actionFeedback.value = 'Your RSVP has been cancelled.'
      showToast('Your RSVP has been cancelled.', 'info')
    } else {
      await api.post(`/events/${event.value.id}/rsvp`, { status })
      actionFeedback.value =
        status === 'going'
          ? 'You are locked in as GOING for this event!'
          : 'Event added to your Interested watchlist.'
      showToast(actionFeedback.value, 'success')
    }
    await loadEventDetails()
  } catch (err) {
    error.value = err.message
    showToast(err.message, 'danger')
  }
}

async function handleToggleLike() {
  if (!authStore.isAuthenticated) {
    showToast('Please sign in to like this event.', 'info')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (event.value.user_liked) {
    await api.delete(`/events/${event.value.id}/like`)
    showToast('Removed from your liked events.', 'info')
  } else {
    await api.post(`/events/${event.value.id}/like`)
    showToast('Added to your liked events!', 'success')
  }
  await loadEventDetails()
}

function handleOfflinePin() {
  if (!event.value) return
  const saved = toggleSaveOffline(event.value)
  actionFeedback.value = saved
    ? 'Event pinned to Offline PWA Cache — accessible without internet!'
    : 'Event removed from Offline PWA Cache.'
  showToast(actionFeedback.value, saved ? 'success' : 'info')
}

async function submitComment() {
  if (!newCommentBody.value.trim()) return
  submittingComment.value = true
  try {
    await api.post(`/events/${event.value.id}/comments`, {
      body: newCommentBody.value.trim(),
      rating: includeRating.value ? Number(newCommentRating.value) : null
    })
    newCommentBody.value = ''
    actionFeedback.value = 'Comment posted successfully.'
    showToast('Your driver review / comment has been published!', 'success')
    await loadEventDetails()
  } catch (err) {
    error.value = err.message
    showToast(err.message, 'danger')
  } finally {
    submittingComment.value = false
  }
}

async function deleteComment(commentId) {
  await api.delete(`/comments/${commentId}`)
  showToast('Comment removed.', 'info')
  await loadEventDetails()
}

async function handleDeleteEvent() {
  if (
    typeof window !== 'undefined' &&
    window.confirm(`Are you sure you want to delete "${event.value.title}"?`)
  ) {
    await api.delete(`/events/${event.value.id}`)
    showToast(`Event "${event.value.title}" deleted.`, 'warning')
    router.push('/events')
  }
}

watch(
  () => route.params.id,
  () => {
    loadEventDetails()
  }
)

onMounted(() => {
  loadEventDetails()
})
</script>

<template>
  <div class="container py-4">
    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb" class="mb-3">
      <ol class="breadcrumb small mb-0">
        <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
        <li class="breadcrumb-item"><router-link to="/events">Events</router-link></li>
        <li class="breadcrumb-item active" aria-current="page">
          {{ event?.title || 'Event Detail' }}
        </li>
      </ol>
    </nav>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading event telemetry...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      <i class="bi bi-exclamation-triangle-fill me-2" aria-hidden="true"></i>{{ error }}
    </div>

    <div v-else-if="event">
      <!-- Feedback Banner -->
      <div
        v-if="actionFeedback"
        class="alert alert-success alert-dismissible fade show py-2 small"
        role="status"
      >
        <i class="bi bi-check-circle-fill me-2" aria-hidden="true"></i>{{ actionFeedback }}
        <button
          type="button"
          class="btn-close btn-sm"
          aria-label="Close notification"
          @click="actionFeedback = ''"
        ></button>
      </div>

      <div class="row g-4">
        <!-- Left Column: Main Event Info, Schedule Timeline, Map & Comments -->
        <div class="col-12 col-lg-8">
          <div class="apex-card overflow-hidden mb-4">
            <div class="position-relative" style="max-height: 360px; overflow: hidden">
              <img
                :src="event.image"
                :alt="event.title"
                class="w-100 object-fit-cover"
                style="height: 340px"
              />
              <div
                class="position-absolute bottom-0 start-0 w-100 p-3"
                style="background: linear-gradient(0deg, rgba(9,11,16,0.95) 12%, transparent 100%)"
              >
                <div class="d-flex flex-wrap gap-2 mb-2">
                  <span class="badge" :class="`bg-${event.badge_color || 'danger'}`">
                    <i :class="[event.category_icon, 'me-1']" aria-hidden="true"></i>
                    {{ event.category_name }}
                  </span>
                  <span class="badge bg-dark border border-secondary">
                    {{ event.region }}
                  </span>
                  <span
                    class="badge text-uppercase"
                    :class="{
                      'bg-success': event.status === 'upcoming',
                      'bg-secondary': event.status === 'completed',
                      'bg-danger': event.status === 'cancelled'
                    }"
                  >
                    {{ event.status }}
                  </span>
                  <span v-if="event.avg_rating" class="badge bg-warning text-dark font-monospace">
                    <i class="bi bi-star-fill me-1" aria-hidden="true"></i>
                    {{ event.avg_rating }} / 5.0 Rating
                  </span>
                </div>
                <h1 class="h3 fw-bold text-white mb-0">{{ event.title }}</h1>
              </div>
            </div>

            <div class="p-4">
              <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-3 mb-3 border-bottom">
                <div class="small">
                  Sanctioned &amp; Hosted by
                  <router-link
                    v-if="event.club_id"
                    :to="`/clubs/${event.club_id}`"
                    class="fw-bold text-danger text-decoration-none"
                  >
                    {{ event.club_name }}
                  </router-link>
                  <strong v-else>{{ event.organizer_name }}</strong>
                </div>

                <!-- Organizer / Admin Edit & Delete Controls -->
                <div v-if="canManageEvent" class="d-flex gap-2">
                  <router-link
                    :to="`/events/${event.id}/edit`"
                    class="btn btn-sm btn-outline-warning"
                  >
                    <i class="bi bi-pencil-square me-1" aria-hidden="true"></i>Edit Event
                  </router-link>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    @click="handleDeleteEvent"
                  >
                    <i class="bi bi-trash me-1" aria-hidden="true"></i>Delete
                  </button>
                </div>
              </div>

              <h2 class="h5 fw-bold mb-2">Driver Briefing &amp; Event Details</h2>
              <p class="text-body-secondary mb-4" style="line-height: 1.65">
                {{ event.description }}
              </p>

              <!-- Visual Track-Day Run-Sheet / Session Timeline -->
              <div class="mb-4 p-3 rounded-3 border" style="background-color: var(--apex-bg-elevated)">
                <h3 class="h6 fw-bold text-uppercase mb-3 d-flex align-items-center gap-2">
                  <i class="bi bi-stopwatch-fill text-danger" aria-hidden="true"></i>
                  <span>Official Run-Sheet &amp; Session Schedule</span>
                </h3>
                <div class="apex-timeline">
                  <div
                    v-for="(step, idx) in runSheetSteps"
                    :key="idx"
                    class="apex-timeline-item"
                  >
                    <div class="d-flex flex-wrap align-items-baseline gap-2 mb-1">
                      <span class="badge bg-danger-subtle text-danger font-monospace">
                        {{ step.time }}
                      </span>
                      <strong class="small">{{ step.title }}</strong>
                    </div>
                    <div class="small text-body-secondary">
                      {{ step.desc }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Member-Gated Exact Location & Contact Box (Rubric Auth Visibility Requirement) -->
              <div class="p-3 rounded-3 border mb-4" style="background-color: var(--apex-bg-elevated)">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <h3 class="h6 fw-bold mb-0">
                    <i class="bi bi-shield-lock-fill text-danger me-2" aria-hidden="true"></i>
                    Paddock Entry Address &amp; Race Control Contact
                  </h3>
                  <span
                    class="badge"
                    :class="authStore.isAuthenticated ? 'bg-success' : 'bg-warning text-dark'"
                  >
                    {{ authStore.isAuthenticated ? 'Unlocked (Member Pass)' : 'Locked (Guest View)' }}
                  </span>
                </div>

                <div v-if="authStore.isAuthenticated" class="row g-3 small mt-1">
                  <div class="col-12 col-md-7">
                    <div class="text-body-secondary">Exact Venue / Gate Address:</div>
                    <div class="fw-semibold d-flex align-items-center justify-content-between gap-2 mt-1">
                      <span>{{ event.address }}</span>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary py-0 px-2"
                        title="Copy gate address"
                        @click="copyToClipboard(event.address, 'gate address')"
                      >
                        <i class="bi bi-clipboard" aria-hidden="true"></i>
                      </button>
                    </div>
                    <div class="text-body-secondary mt-2 d-flex align-items-center justify-content-between gap-2">
                      <span>
                        GPS Telemetry: <code class="font-monospace">{{ event.latitude }}, {{ event.longitude }}</code>
                      </span>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary py-0 px-2"
                        title="Copy GPS coordinates"
                        @click="copyToClipboard(`${event.latitude}, ${event.longitude}`, 'GPS coordinates')"
                      >
                        <i class="bi bi-geo" aria-hidden="true"></i>
                      </button>
                    </div>
                  </div>
                  <div class="col-12 col-md-5">
                    <div class="text-body-secondary">Direct Clerk of Course / Contact:</div>
                    <div class="fw-semibold font-monospace mt-1">{{ event.organizer_contact }}</div>
                  </div>
                </div>

                <div v-else class="alert alert-warning mb-0 mt-2 py-2 small d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div>
                    <i class="bi bi-lock-fill me-1" aria-hidden="true"></i>
                    Exact gate/street address and direct organizer contact info are visible to
                    registered members only to prevent overcrowding at private meets.
                  </div>
                  <router-link
                    :to="{ path: '/login', query: { redirect: route.fullPath } }"
                    class="btn btn-sm btn-dark"
                  >
                    Sign In to Unlock
                  </router-link>
                </div>
              </div>

              <!-- Interactive Venue Leaflet Map -->
              <h2 class="h5 fw-bold mb-2">
                <i class="bi bi-geo-alt-fill text-danger me-2" aria-hidden="true"></i>
                Circuit &amp; Meet Location Map
              </h2>
              <EventMap
                :events="[event]"
                height="300px"
                :show-region-controls="false"
              />
            </div>
          </div>

          <!-- Comments & Past Event Ratings Section -->
          <section class="apex-card p-4" aria-label="Event comments and driver ratings">
            <h2 class="h5 fw-bold mb-3">
              <i class="bi bi-chat-square-quote-fill text-warning me-2" aria-hidden="true"></i>
              Driver Discussion &amp; Event Ratings ({{ comments.length }})
            </h2>

            <!-- Post Comment Form (Members Only) -->
            <form
              v-if="authStore.isAuthenticated"
              class="mb-4 p-3 rounded-3 border"
              @submit.prevent="submitComment"
            >
              <div class="mb-2">
                <label for="comment-body" class="form-label small fw-semibold">
                  Post a question, convoy time, or track review as
                  <strong>{{ authStore.user?.name }}</strong>
                </label>
                <textarea
                  id="comment-body"
                  v-model="newCommentBody"
                  rows="3"
                  class="form-control"
                  required
                  placeholder="Share paddock tips, lap times, or convoy meetup spots..."
                ></textarea>
              </div>

              <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div class="d-flex align-items-center gap-3">
                  <div class="form-check">
                    <input
                      id="include-rating-check"
                      v-model="includeRating"
                      type="checkbox"
                      class="form-check-input"
                    />
                    <label for="include-rating-check" class="form-check-label small">
                      Include Star Rating
                    </label>
                  </div>

                  <select
                    v-if="includeRating"
                    v-model="newCommentRating"
                    class="form-select form-select-sm w-auto"
                    aria-label="Select rating from 1 to 5 stars"
                  >
                    <option :value="5">★★★★★ (5/5 — Outstanding)</option>
                    <option :value="4">★★★★☆ (4/5 — Great)</option>
                    <option :value="3">★★★☆☆ (3/5 — Good)</option>
                    <option :value="2">★★☆☆☆ (2/5 — Fair)</option>
                    <option :value="1">★☆☆☆☆ (1/5 — Poor)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  class="btn btn-sm btn-apex"
                  :disabled="submittingComment"
                >
                  <i class="bi bi-send me-1" aria-hidden="true"></i>Post Comment
                </button>
              </div>
            </form>

            <div v-else class="alert alert-secondary small">
              <router-link :to="{ path: '/login', query: { redirect: route.fullPath } }" class="fw-bold">
                Sign in
              </router-link>
              or <router-link to="/register" class="fw-bold">register a Member account</router-link>
              to RSVP, post comments, or rate this event.
            </div>

            <!-- Comments List -->
            <div v-if="comments.length === 0" class="text-body-secondary small py-3 text-center">
              No comments yet. Be the first driver to start the discussion!
            </div>

            <div v-else class="d-flex flex-column gap-3">
              <div
                v-for="cm in comments"
                :key="cm.id"
                class="p-3 rounded-3 border"
              >
                <div class="d-flex justify-content-between align-items-start mb-1">
                  <div class="d-flex align-items-center gap-2">
                    <img
                      v-if="cm.user_avatar"
                      :src="cm.user_avatar"
                      :alt="cm.user_name"
                      width="32"
                      height="32"
                      class="rounded-circle object-fit-cover"
                    />
                    <div>
                      <span class="fw-bold small">{{ cm.user_name }}</span>
                      <span class="badge bg-secondary-subtle text-body-secondary ms-2 text-uppercase" style="font-size: 0.68rem">
                        {{ cm.user_role || 'member' }}
                      </span>
                      <div class="text-body-secondary font-monospace" style="font-size: 0.72rem">
                        {{ cm.created_at }}
                      </div>
                    </div>
                  </div>

                  <div class="d-flex align-items-center gap-2">
                    <span v-if="cm.rating" class="badge bg-warning text-dark font-monospace">
                      <i class="bi bi-star-fill me-1" aria-hidden="true"></i>{{ cm.rating }}/5
                    </span>
                    <button
                      v-if="
                        authStore.isAdmin ||
                        (authStore.user && Number(authStore.user.id) === Number(cm.user_id))
                      "
                      type="button"
                      class="btn btn-sm btn-outline-danger py-0 px-2"
                      title="Delete comment"
                      @click="deleteComment(cm.id)"
                    >
                      <i class="bi bi-trash" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
                <p class="small mb-0 mt-2">{{ cm.body }}</p>
              </div>
            </div>
          </section>
        </div>

        <!-- Right Column: Sticky Telemetry, RSVP, Likes & Offline PWA Card -->
        <div class="col-12 col-lg-4">
          <div class="apex-card p-4 position-sticky" style="top: 84px">
            <div class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
              <div>
                <div class="small text-body-secondary text-uppercase fw-semibold" style="font-size: 0.72rem">
                  Entry Fee
                </div>
                <div class="h3 fw-bold text-warning font-monospace mb-0">
                  {{
                    Number(event.price) <= 0
                      ? 'FREE'
                      : `${event.region === 'Malaysia' ? 'RM ' : 'A$'}${Number(event.price).toFixed(2)}`
                  }}
                </div>
              </div>
              <button
                type="button"
                class="btn"
                :class="event.user_liked ? 'btn-danger' : 'btn-outline-secondary'"
                @click="handleToggleLike"
              >
                <i :class="event.user_liked ? 'bi bi-heart-fill' : 'bi bi-heart'" aria-hidden="true"></i>
                <span class="ms-1 fw-bold font-monospace">{{ event.likes_count || 0 }}</span>
              </button>
            </div>

            <!-- Schedule & Venue Summary -->
            <ul class="list-unstyled small d-flex flex-column gap-2 mb-4">
              <li>
                <i class="bi bi-calendar-check text-danger me-2" aria-hidden="true"></i>
                <strong>Start:</strong> <span class="font-monospace">{{ event.start_datetime }}</span>
              </li>
              <li>
                <i class="bi bi-clock-history text-danger me-2" aria-hidden="true"></i>
                <strong>Finish:</strong> <span class="font-monospace">{{ event.end_datetime }}</span>
              </li>
              <li>
                <i class="bi bi-geo-alt text-danger me-2" aria-hidden="true"></i>
                <strong>Venue:</strong> {{ event.venue }} ({{ event.region }})
              </li>
            </ul>

            <!-- Capacity Bar -->
            <div class="mb-4">
              <div class="d-flex justify-content-between small mb-1 font-monospace">
                <span><strong>{{ event.going_count }}</strong> / {{ event.capacity }} Going ({{ capacityPercent }}%)</span>
                <span>{{ event.interested_count }} Interested</span>
              </div>
              <div class="progress" style="height: 8px">
                <div
                  class="progress-bar"
                  :class="capacityPercent >= 80 ? 'bg-danger' : 'bg-warning'"
                  :style="{ width: `${capacityPercent}%` }"
                ></div>
              </div>
            </div>

            <!-- RSVP Buttons -->
            <div class="d-grid gap-2 mb-3">
              <button
                type="button"
                class="btn"
                :class="event.user_rsvp_status === 'going' ? 'btn-success' : 'btn-apex'"
                @click="handleRsvp('going')"
              >
                <i class="bi bi-check2-circle me-1" aria-hidden="true"></i>
                {{
                  event.user_rsvp_status === 'going'
                    ? 'You are Going (Click to Cancel)'
                    : 'RSVP — I Am Going'
                }}
              </button>

              <button
                type="button"
                class="btn"
                :class="
                  event.user_rsvp_status === 'interested'
                    ? 'btn-info text-dark fw-semibold'
                    : 'btn-outline-secondary'
                "
                @click="handleRsvp('interested')"
              >
                <i class="bi bi-star me-1" aria-hidden="true"></i>
                {{
                  event.user_rsvp_status === 'interested'
                    ? 'Marked Interested (Click to Cancel)'
                    : 'Mark as Interested'
                }}
              </button>
            </div>

            <!-- Offline PWA Save Button (Jacob's Feature) -->
            <div class="pt-3 border-top">
              <button
                type="button"
                class="btn btn-sm w-100"
                :class="isSavedOffline ? 'btn-warning text-dark fw-semibold' : 'btn-outline-secondary'"
                @click="handleOfflinePin"
              >
                <i
                  :class="isSavedOffline ? 'bi bi-cloud-check-fill me-1' : 'bi bi-cloud-arrow-down me-1'"
                  aria-hidden="true"
                ></i>
                {{
                  isSavedOffline
                    ? 'Saved in Offline PWA Vault'
                    : 'Save Event for Offline Track Access'
                }}
              </button>
              <div class="text-body-secondary mt-2" style="font-size: 0.76rem">
                Pinning this event caches the schedule, venue coordinates, and paddock details in
                your browser so you can open it at remote circuits with zero reception.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
