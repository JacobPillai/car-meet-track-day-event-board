<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
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
const { isEventSavedOffline, toggleSaveOffline, getOfflineEventById } = useOfflineEvents()
const event = ref(null)
const comments = ref([])
const loading = ref(true)
const error = ref('')
const commentsError = ref('')
const commentsLoading = ref(false)
const actionError = ref('')
const actionFeedback = ref('')
const offlineSnapshot = ref(false)
const imageFailed = ref(false)
const pending = ref({})
const newCommentBody = ref('')
const newCommentRating = ref(5)
const includeRating = ref(false)
let loadVersion = 0
let commentsVersion = 0
let pageVersion = 0

const eventId = computed(() => Number(route.params.id))
const isSavedOffline = computed(() => event.value && isEventSavedOffline(event.value.id))
const canManageEvent = computed(() => authStore.isAuthenticated && event.value && (
  authStore.isAdmin || (authStore.isOrganizer && Number(event.value.organizer_id) === Number(authStore.user?.id))
))
const capacityPercent = computed(() => Math.max(0, Math.min(100,
  Math.round((Number(event.value?.going_count) || 0) / Math.max(1, Number(event.value?.capacity) || 1) * 100)
)))
const price = computed(() => Number(event.value?.price) <= 0
  ? 'Free'
  : `${event.value?.region === 'Malaysia' ? 'RM ' : 'A$'}${Number(event.value?.price).toFixed(2)}`)

function formatDate(value) {
  if (!value) return 'Not provided'
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
  })
}

async function loadComments(id = eventId.value, version = loadVersion) {
  const request = ++commentsVersion
  commentsLoading.value = true
  commentsError.value = ''
  try {
    const res = await api.get(`/events/${id}/comments`)
    if (version === loadVersion && request === commentsVersion) comments.value = res.data || []
  } catch {
    if (version === loadVersion && request === commentsVersion) commentsError.value = 'Comments couldn’t load.'
  } finally {
    if (version === loadVersion && request === commentsVersion) commentsLoading.value = false
  }
}

async function loadEventDetails(reset = true) {
  const id = eventId.value
  const version = ++loadVersion
  ++commentsVersion
  commentsLoading.value = false
  error.value = ''
  if (reset) {
    ++pageVersion
    loading.value = true
    event.value = null
    comments.value = []
    commentsError.value = ''
    commentsLoading.value = false
    offlineSnapshot.value = false
    imageFailed.value = false
    newCommentBody.value = ''
    includeRating.value = false
    newCommentRating.value = 5
    actionError.value = ''
    actionFeedback.value = ''
    pending.value = {}
  }
  try {
    const res = await api.get(`/events/${id}`)
    if (version !== loadVersion) return
    event.value = res.data
    offlineSnapshot.value = false
    if (reset) includeRating.value = event.value.status === 'completed'
  } catch (err) {
    if (version !== loadVersion) return
    // Never substitute an old snapshot for an explicit authorization/not-found response.
    const cached = (!err.status || err.status === 503) && getOfflineEventById(id)
    if (cached) {
      event.value = cached
      offlineSnapshot.value = true
      comments.value = []
      commentsError.value = 'Comments are unavailable in this saved snapshot.'
      if (reset) includeRating.value = cached.status === 'completed'
    } else if (!reset && event.value) {
      actionError.value = 'Your change was saved, but the latest event details couldn’t load. Refresh to check the current details.'
    } else {
      error.value = err.message || 'Could not load event details.'
    }
  } finally {
    if (version === loadVersion) loading.value = false
  }
  if (version === loadVersion && event.value && !offlineSnapshot.value && !actionError.value) {
    await loadComments(id, version)
  }
}

function requireSignIn(action) {
  if (authStore.isAuthenticated) return false
  showToast(`Please sign in to ${action}.`, 'info')
  router.push({ path: '/login', query: { redirect: route.fullPath } })
  return true
}

async function performAction(key, task, success, refresh = true) {
  if (pending.value[key]) return
  const page = pageVersion
  pending.value[key] = true
  actionError.value = ''
  actionFeedback.value = ''
  try {
    await task()
    if (page !== pageVersion) return
    actionFeedback.value = success
    showToast(success, 'success')
    if (refresh) await loadEventDetails(false)
  } catch (err) {
    if (page !== pageVersion) return
    actionError.value = err.message || 'Something went wrong. Please try again.'
    showToast(actionError.value, 'danger')
  } finally {
    if (page === pageVersion) pending.value[key] = false
  }
}

function handleRsvp(status) {
  if (requireSignIn('RSVP to this event')) return
  const id = event.value.id
  const cancelling = event.value.user_rsvp_status === status
  return performAction('rsvp', () => cancelling
    ? api.delete(`/events/${id}/rsvp`)
    : api.post(`/events/${id}/rsvp`, { status }),
  cancelling ? 'Your RSVP has been cancelled.' : status === 'going' ? 'You’re going to this event.' : 'You’re interested in this event.')
}

function handleToggleLike() {
  if (requireSignIn('like this event')) return
  const id = event.value.id
  const liked = event.value.user_liked
  return performAction('like', () => liked ? api.delete(`/events/${id}/like`) : api.post(`/events/${id}/like`),
    liked ? 'Like removed.' : 'Event liked.')
}

function handleOfflinePin() {
  if (!event.value) return
  actionError.value = ''
  actionFeedback.value = ''
  try {
    const saved = toggleSaveOffline(event.value)
    actionFeedback.value = saved ? 'Event saved for offline viewing.' : 'Offline save removed.'
    showToast(actionFeedback.value, 'info')
  } catch {
    actionError.value = 'Could not update the offline save. Please try again.'
    showToast(actionError.value, 'danger')
  }
}

function submitComment() {
  if (requireSignIn('post a comment') || !newCommentBody.value.trim()) return
  const id = event.value.id
  const page = pageVersion
  const body = newCommentBody.value.trim()
  const rating = includeRating.value ? Number(newCommentRating.value) : null
  return performAction('comment', async () => {
    await api.post(`/events/${id}/comments`, { body, rating })
    if (page === pageVersion) newCommentBody.value = ''
  }, 'Comment posted.')
}

function deleteComment(commentId) {
  return performAction(`comment-${commentId}`, () => api.delete(`/comments/${commentId}`), 'Comment removed.')
}

function handleDeleteEvent() {
  if (!window.confirm(`Are you sure you want to delete "${event.value.title}"?`)) return
  const id = event.value.id
  const page = pageVersion
  return performAction('delete', async () => {
    await api.delete(`/events/${id}`)
    if (page === pageVersion) router.push('/events')
  }, 'Event deleted.', false)
}

async function copyToClipboard(text, label) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
    await navigator.clipboard.writeText(text)
    showToast(`Copied ${label} to clipboard.`, 'success')
  } catch {
    showToast(`Could not copy ${label}. Please select and copy it manually.`, 'warning')
  }
}

watch(() => route.params.id, () => loadEventDetails())
onMounted(() => loadEventDetails())
onBeforeUnmount(() => {
  ++pageVersion
  ++loadVersion
  ++commentsVersion
})
</script>

<template>
  <div class="detail-page">
    <div class="container">
      <nav class="detail-breadcrumb" aria-label="Breadcrumb">
        <router-link to="/events"><i class="bi bi-arrow-left" aria-hidden="true"></i> All events</router-link>
        <span aria-current="page">Event details</span>
      </nav>

      <div v-if="loading" class="detail-state" role="status">
        <div class="spinner-border" aria-hidden="true"></div>
        <p>Loading event details…</p>
      </div>
      <div v-else-if="error" class="detail-state" role="alert">
        <h1>We couldn’t load this event.</h1>
        <p>{{ error }}</p>
        <button class="detail-button" type="button" @click="loadEventDetails()">Try again</button>
      </div>

      <template v-else-if="event">
        <header class="detail-heading">
          <p class="detail-eyebrow">{{ event.category_name }} <span aria-hidden="true">/</span> {{ event.region }}</p>
          <h1>{{ event.title }}</h1>
          <div class="detail-heading__meta">
            <span class="detail-status" :class="{ 'detail-status--cancelled': event.status === 'cancelled' }">{{ event.status }}</span>
            <span>Hosted by <router-link v-if="event.club_id" :to="`/clubs/${event.club_id}`">{{ event.club_name }}</router-link><strong v-else>{{ event.organizer_name }}</strong></span>
            <span v-if="event.avg_rating"><i class="bi bi-star-fill" aria-hidden="true"></i> {{ event.avg_rating }} / 5</span>
          </div>
          <div v-if="canManageEvent" class="detail-management">
            <router-link class="detail-button" :to="`/events/${event.id}/edit`">Edit event</router-link>
            <button type="button" class="detail-button" :disabled="pending.delete" @click="handleDeleteEvent">Delete event</button>
          </div>
        </header>

        <div class="detail-photo" :class="{ 'detail-photo--empty': !event.image || imageFailed }">
          <img v-if="event.image && !imageFailed" :src="event.image" :alt="event.title" fetchpriority="high" @error="imageFailed = true" />
          <p v-else><i class="bi bi-image" aria-hidden="true"></i> Event photo unavailable</p>
        </div>

        <div v-if="offlineSnapshot" class="detail-notice" role="status">
          <strong>Saved offline</strong>
          <p>You’re viewing a saved snapshot. Event details and attendance may have changed. Comments and map tiles may need a connection.</p>
          <button type="button" class="detail-button" @click="loadEventDetails()">Try loading latest details</button>
        </div>
        <div v-if="actionError" class="detail-notice detail-notice--error" role="alert">
          <p>{{ actionError }}</p>
          <button type="button" class="detail-button" @click="actionError = ''">Dismiss error</button>
        </div>
        <p v-if="actionFeedback" class="detail-feedback" role="status">{{ actionFeedback }}</p>

        <div class="detail-layout">
          <!-- On small screens the practical details and RSVP come before the longer description. -->
          <aside class="detail-summary" aria-label="Event information and RSVP">
            <div class="detail-summary__price"><div><span class="detail-eyebrow">Entry</span><p>{{ price }}</p></div>
              <button type="button" class="detail-button" :aria-label="event.user_liked ? 'Unlike event' : 'Like event'" :aria-pressed="!!event.user_liked" :disabled="pending.like" @click="handleToggleLike">
                <i :class="event.user_liked ? 'bi bi-heart-fill' : 'bi bi-heart'" aria-hidden="true"></i> {{ event.likes_count || 0 }}
              </button>
            </div>
            <dl class="detail-facts">
              <div><dt>Starts</dt><dd><time :datetime="event.start_datetime?.replace(' ', 'T')">{{ formatDate(event.start_datetime) }}</time></dd></div>
              <div><dt>Ends</dt><dd><time :datetime="event.end_datetime?.replace(' ', 'T')">{{ formatDate(event.end_datetime) }}</time></dd></div>
              <div><dt>Venue</dt><dd>{{ event.venue }}<span class="detail-facts__region">{{ event.region }}</span></dd></div>
            </dl>
            <div class="detail-attendance">
              <p><strong>{{ event.going_count || 0 }} going</strong><span>{{ event.interested_count || 0 }} interested</span></p>
              <template v-if="Number(event.capacity) > 0">
                <progress :value="capacityPercent" max="100" :aria-label="`${event.going_count || 0} going out of ${event.capacity} capacity`"></progress>
                <p class="detail-small">Capacity: {{ event.capacity }}</p>
              </template>
            </div>
            <div class="detail-rsvp">
              <button type="button" class="detail-button detail-button--primary" :disabled="pending.rsvp" :aria-pressed="event.user_rsvp_status === 'going'" @click="handleRsvp('going')">{{ event.user_rsvp_status === 'going' ? 'Cancel going RSVP' : 'I’m going' }}</button>
              <button type="button" class="detail-button" :disabled="pending.rsvp" :aria-pressed="event.user_rsvp_status === 'interested'" @click="handleRsvp('interested')">{{ event.user_rsvp_status === 'interested' ? 'Cancel interested RSVP' : 'Interested' }}</button>
            </div>
            <div class="detail-offline">
              <button type="button" class="detail-button" :aria-pressed="!!isSavedOffline" @click="handleOfflinePin"><i :class="isSavedOffline ? 'bi bi-cloud-check' : 'bi bi-download'" aria-hidden="true"></i>{{ isSavedOffline ? 'Remove offline save' : 'Save for offline' }}</button>
              <p class="detail-small">Keep a copy of the event details in this browser. Live updates, comments and map tiles aren’t included in this save.</p>
            </div>
          </aside>

          <div class="detail-content">
            <section class="detail-section" aria-labelledby="about-event">
              <p class="detail-eyebrow">The plan</p>
              <h2 id="about-event">What to expect.</h2>
              <p class="detail-description">{{ event.description || 'The organizer hasn’t added a description yet.' }}</p>
              <p class="detail-small">The start and end times shown are provided by the organizer. Check with them for session times or entry requirements.</p>
            </section>

            <section class="detail-section" aria-labelledby="member-details">
              <p class="detail-eyebrow">Before you go</p>
              <h2 id="member-details">Address &amp; contact.</h2>
              <template v-if="authStore.isAuthenticated">
                <dl class="detail-contact">
                  <div><dt>Street / entry address</dt><dd><span>{{ event.address || 'Not provided' }}</span><button v-if="event.address" type="button" class="detail-button" aria-label="Copy address" @click="copyToClipboard(event.address, 'address')"><i class="bi bi-clipboard" aria-hidden="true"></i></button></dd></div>
                  <div><dt>Coordinates</dt><dd v-if="event.latitude != null && event.longitude != null"><span>{{ event.latitude }}, {{ event.longitude }}</span><button type="button" class="detail-button" aria-label="Copy coordinates" @click="copyToClipboard(`${event.latitude}, ${event.longitude}`, 'coordinates')"><i class="bi bi-clipboard" aria-hidden="true"></i></button></dd><dd v-else>Not provided</dd></div>
                  <div><dt>Organizer contact</dt><dd>{{ event.organizer_contact || 'Not provided' }}</dd></div>
                </dl>
              </template>
              <div v-else class="detail-member-gate">
                <p>Sign in to see the exact address and direct organizer contact.</p>
                <router-link class="detail-button" :to="{ path: '/login', query: { redirect: route.fullPath } }">Sign in for details</router-link>
              </div>
            </section>

            <section class="detail-section" aria-labelledby="venue-map">
              <h2 id="venue-map">Find the venue.</h2>
              <p class="detail-small">{{ event.venue }} · {{ event.region }}</p>
              <EventMap :key="event.id" :events="[event]" height="300px" :show-region-controls="false" />
            </section>

            <section class="detail-section" aria-labelledby="event-discussion">
              <p class="detail-eyebrow">The conversation</p>
              <h2 id="event-discussion">Questions &amp; comments<span v-if="comments.length"> ({{ comments.length }})</span>.</h2>
              <form v-if="authStore.isAuthenticated && !offlineSnapshot" class="detail-comment-form" @submit.prevent="submitComment">
                <label for="comment-body">Join the conversation as <strong>{{ authStore.user?.name }}</strong></label>
                <textarea id="comment-body" v-model="newCommentBody" rows="4" required placeholder="Ask a question or share your experience…"></textarea>
                <div class="detail-comment-form__actions">
                  <div class="detail-rating">
                    <label for="include-rating-check"><input id="include-rating-check" v-model="includeRating" type="checkbox" /> Include a rating</label>
                    <select v-if="includeRating" v-model="newCommentRating" aria-label="Rating out of five"><option v-for="n in [5, 4, 3, 2, 1]" :key="n" :value="n">{{ n }} / 5</option></select>
                  </div>
                  <button type="submit" class="detail-button detail-button--primary" :disabled="pending.comment">{{ pending.comment ? 'Posting…' : 'Post comment' }}</button>
                </div>
              </form>
              <p v-else-if="!authStore.isAuthenticated" class="detail-small"><router-link :to="{ path: '/login', query: { redirect: route.fullPath } }">Sign in</router-link> or <router-link to="/register">create an account</router-link> to join the conversation or leave a rating.</p>
              <p v-if="commentsLoading" role="status">Loading comments…</p>
              <div v-else-if="commentsError" class="detail-notice" role="status"><p>{{ commentsError }}</p><button v-if="!offlineSnapshot" type="button" class="detail-button" @click="loadComments()">Retry comments</button></div>
              <p v-else-if="!comments.length" class="detail-small detail-no-comments">No comments yet. Start the conversation.</p>
              <div v-for="cm in comments" :key="cm.id" class="detail-comment">
                <div class="detail-comment__header">
                  <div><strong>{{ cm.user_name }}</strong><span class="detail-small">{{ cm.user_role || 'member' }} · {{ formatDate(cm.created_at) }}</span></div>
                  <span v-if="cm.rating" class="detail-comment__rating">{{ cm.rating }} / 5</span>
                  <button v-if="authStore.isAdmin || (authStore.user && Number(authStore.user.id) === Number(cm.user_id))" type="button" class="detail-button" :aria-label="`Delete comment by ${cm.user_name}`" :disabled="pending[`comment-${cm.id}`]" @click="deleteComment(cm.id)"><i class="bi bi-trash" aria-hidden="true"></i></button>
                </div>
                <p>{{ cm.body }}</p>
              </div>
            </section>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.detail-page {
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
  min-height: 70vh;
  padding-bottom: 4rem;
  background: var(--scene-bg);
  color: var(--scene-text);
  overflow-wrap: anywhere;
}
:global([data-bs-theme='light']) .detail-page {
  --scene-bg: #f7f6f2;
  --scene-surface: #eeeee7;
  --scene-text: #1c211d;
  --scene-muted: #575e55;
  --scene-border: #cdd0c6;
  --scene-accent: #a52e20;
}
.detail-page a:not(.detail-button) { color: var(--scene-accent); text-underline-offset: 0.2em; }
.detail-breadcrumb { display: flex; flex-wrap: wrap; gap: 1rem; padding: 1.5rem 0; font-size: 0.8rem; color: var(--scene-muted); border-bottom: 1px solid var(--scene-border); }
.detail-breadcrumb a { display: inline-flex; gap: 0.65rem; align-items: center; min-height: 44px; }
.detail-breadcrumb span { align-self: center; }
.detail-heading { padding: 2.5rem 0 2rem; max-width: 65rem; }
.detail-eyebrow { display: block; margin: 0 0 1rem; color: var(--scene-muted); font-size: 0.7rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
.detail-eyebrow > span { margin: 0 0.5rem; }
.detail-heading h1 { margin: 0 0 1.5rem; font-family: 'Space Grotesk', system-ui, sans-serif; font-size: clamp(2.5rem, 5.5vw, 5rem); line-height: 1.06; font-weight: 700; letter-spacing: -0.055em; }
.detail-heading__meta { display: flex; flex-wrap: wrap; gap: 0.75rem 1.5rem; align-items: center; color: var(--scene-muted); font-size: 0.85rem; }
.detail-status { padding: 0.35rem 0.65rem; border: 1px solid var(--scene-border); border-radius: 0.2rem; text-transform: capitalize; color: var(--scene-text); }
.detail-status--cancelled { color: var(--scene-accent); border-color: var(--scene-accent); }
.detail-management { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.5rem; }
.detail-photo { aspect-ratio: 2.6 / 1; overflow: hidden; background: var(--scene-surface); }
.detail-photo img { width: 100%; height: 100%; display: block; object-fit: cover; }
.detail-photo--empty { display: grid; place-items: center; color: var(--scene-muted); }
.detail-photo--empty p { margin: 1rem; }
.detail-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(18rem, 22rem); gap: clamp(2rem, 5vw, 5rem); align-items: start; margin-top: 3rem; }
.detail-content { grid-column: 1; grid-row: 1; min-width: 0; }
.detail-summary { grid-column: 2; grid-row: 1; position: sticky; top: 100px; padding: 1.5rem; background: var(--scene-surface); border-top: 2px solid var(--scene-accent); }
.detail-summary__price { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.detail-summary__price .detail-eyebrow { margin-bottom: 0.5rem; }
.detail-summary__price p { margin: 0; font-size: 2rem; font-weight: 600; letter-spacing: -0.04em; }
.detail-button { display: inline-flex; align-items: center; justify-content: center; gap: 0.6rem; min-width: 44px; min-height: 48px; padding: 0.7rem 1rem; border: 1px solid var(--scene-border); border-radius: 0.25rem; background: transparent; color: var(--scene-text); font: inherit; font-size: 0.85rem; font-weight: 600; line-height: 1.4; text-align: center; text-decoration: none; }
.detail-button:hover { background: var(--scene-bg); }
.detail-button[aria-pressed='true']:not(.detail-button--primary) { border-color: var(--scene-accent); color: var(--scene-accent); }
.detail-button--primary { color: #fff; background: #bb3827; border-color: #bb3827; }
.detail-button--primary:hover { color: #fff; background: #a12d1e; border-color: #a12d1e; }
.detail-button:disabled { opacity: 0.6; cursor: wait; }
.detail-page :is(a, button, textarea, select, input):focus-visible { outline: 3px solid var(--scene-accent); outline-offset: 4px; box-shadow: none; }
.detail-facts { margin: 1.75rem 0; }
.detail-facts > div { padding: 0.8rem 0; border-bottom: 1px solid var(--scene-border); }
.detail-facts dt, .detail-contact dt { color: var(--scene-muted); font-size: 0.75rem; font-weight: 400; margin-bottom: 0.4rem; }
.detail-facts dd { margin: 0; font-size: 0.9rem; line-height: 1.7; }
.detail-facts__region { display: block; color: var(--scene-muted); }
.detail-attendance p { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; font-size: 0.8rem; margin: 0 0 0.5rem; }
.detail-attendance p > span { color: var(--scene-muted); }
.detail-attendance progress { display: block; width: 100%; height: 5px; margin: 0.75rem 0; border: 0; background: var(--scene-border); accent-color: var(--scene-accent); }
.detail-attendance progress::-webkit-progress-bar { background: var(--scene-border); }
.detail-attendance progress::-webkit-progress-value { background: var(--scene-accent); }
.detail-attendance progress::-moz-progress-bar { background: var(--scene-accent); }
.detail-rsvp { display: grid; gap: 0.65rem; margin: 1.5rem 0; }
.detail-offline { padding-top: 1.5rem; border-top: 1px solid var(--scene-border); }
.detail-offline .detail-button { width: 100%; margin-bottom: 0.75rem; }
.detail-small { color: var(--scene-muted); font-size: 0.8rem; line-height: 1.8; }
.detail-offline .detail-small { margin: 0; }
.detail-section { padding: 2rem 0; border-top: 1px solid var(--scene-border); }
.detail-section:first-child { padding-top: 0; border-top: 0; }
.detail-section h2 { margin: 0 0 1.5rem; font-family: 'Space Grotesk', system-ui, sans-serif; font-size: clamp(1.7rem, 3vw, 2.35rem); font-weight: 600; letter-spacing: -0.045em; }
.detail-description { white-space: pre-line; line-height: 1.9; margin-bottom: 1.5rem; }
.detail-contact { margin: 0; }
.detail-contact > div { margin-top: 1.25rem; }
.detail-contact dd { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 0; line-height: 1.8; }
.detail-member-gate p { color: var(--scene-muted); line-height: 1.8; }
.detail-comment-form { margin: 1.5rem 0 2rem; }
.detail-comment-form > label { display: block; font-size: 0.85rem; margin-bottom: 0.75rem; }
.detail-comment-form textarea, .detail-rating select { width: 100%; border: 1px solid var(--scene-border); border-radius: 0.25rem; background: var(--scene-bg); color: var(--scene-text); padding: 0.75rem; font: inherit; font-size: 0.9rem; color-scheme: dark; }
.detail-comment-form textarea { display: block; resize: vertical; }
.detail-comment-form textarea::placeholder { color: var(--scene-muted); opacity: 1; }
:global([data-bs-theme='light']) .detail-rating select { color-scheme: light; }
.detail-comment-form__actions, .detail-rating { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
.detail-comment-form__actions { justify-content: space-between; margin-top: 0.75rem; }
.detail-rating label { display: flex; align-items: center; gap: 0.6rem; min-height: 48px; font-size: 0.85rem; }
.detail-rating input { width: 1.1rem; height: 1.1rem; accent-color: #bb3827; }
.detail-rating select { width: auto; min-height: 48px; }
.detail-comment { padding: 1.5rem 0; border-top: 1px solid var(--scene-border); }
.detail-comment__header { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
.detail-comment__header > div { flex: 1; min-width: 0; }
.detail-comment__header .detail-small { display: block; }
.detail-comment__rating { color: var(--scene-accent); font-size: 0.85rem; }
.detail-comment > p { white-space: pre-line; margin: 0.75rem 0 0; line-height: 1.8; }
.detail-notice { margin: 1.5rem 0; padding: 1.25rem; border: 1px solid var(--scene-border); background: var(--scene-surface); line-height: 1.8; }
.detail-notice p { margin: 0 0 0.75rem; }
.detail-notice p:last-child { margin-bottom: 0; }
.detail-notice--error { border-left: 3px solid var(--scene-accent); }
.detail-feedback { margin: 1.5rem 0; color: var(--scene-accent); }
.detail-state { padding: 5rem 0; text-align: center; }
.detail-state p { margin: 1rem 0; color: var(--scene-muted); }
@media (max-width: 991.98px) {
  .detail-layout { grid-template-columns: minmax(0, 1fr); gap: 2.5rem; margin-top: 2rem; }
  .detail-summary, .detail-content { grid-column: 1; grid-row: auto; }
  .detail-summary { position: static; }
  .detail-photo { aspect-ratio: 16 / 9; }
}
@media (max-width: 575.98px) {
  .detail-heading { padding: 2rem 0 1.5rem; }
  .detail-heading__meta { gap: 0.75rem; }
  .detail-summary { padding: 1.25rem; }
  .detail-comment-form__actions > .detail-button { width: 100%; }
}
</style>
