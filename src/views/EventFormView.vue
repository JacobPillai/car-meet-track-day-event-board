<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../services/api'
import { searchVenueGeocode, reverseGeocodeCoords } from '../services/externalApis'
import { VENUE_PRESETS } from '../data/seedData'
import EventMap from '../components/EventMap.vue'

const route = useRoute()
const router = useRouter()

const isEditMode = computed(() => Boolean(route.params.id))
const categories = ref([])
const clubs = ref([])
const loading = ref(false)
const error = ref('')
const geocodeQuery = ref('')
const geocodeResults = ref([])
const geocoding = ref(false)
const geocodeStatus = ref('')

const form = reactive({
  title: '',
  category_id: 1,
  club_id: 1,
  region: 'Australia',
  venue: '',
  address: '',
  organizer_contact: '',
  latitude: -37.9506,
  longitude: 145.1647,
  start_datetime: '2026-11-15T09:00',
  end_datetime: '2026-11-15T17:00',
  price: 150,
  capacity: 60,
  image:
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=900&auto=format&fit=crop&q=80',
  status: 'upcoming',
  description: ''
})

const mapPreviewEvent = computed(() => ({
  id: route.params.id || 999,
  title: form.title || 'New Motorsport Event Pin',
  venue: form.venue || 'Selected Circuit / Meet Venue',
  region: form.region,
  category_name:
    categories.value.find((c) => Number(c.id) === Number(form.category_id))?.name || 'Track Day',
  category_slug:
    categories.value.find((c) => Number(c.id) === Number(form.category_id))?.slug || 'track-day',
  latitude: Number(form.latitude),
  longitude: Number(form.longitude),
  start_datetime: String(form.start_datetime).replace('T', ' '),
  price: Number(form.price),
  capacity: Number(form.capacity),
  going_count: 0
}))

function applyVenuePreset(event) {
  const idx = Number(event.target.value)
  if (Number.isNaN(idx) || !VENUE_PRESETS[idx]) return
  const preset = VENUE_PRESETS[idx]
  form.region = preset.region
  form.venue = preset.venue
  form.address = preset.address
  form.latitude = preset.latitude
  form.longitude = preset.longitude
}

async function handleMapPickCoords({ latitude, longitude }) {
  form.latitude = latitude
  form.longitude = longitude
  geocodeStatus.value = 'Resolving street address via Nominatim Reverse Geocoding API…'
  const rev = await reverseGeocodeCoords(latitude, longitude)
  if (rev) {
    if (!form.venue) form.venue = rev.venue
    form.address = rev.address
    form.region = rev.region
    geocodeStatus.value = `Resolved via ${rev.source}`
  } else {
    geocodeStatus.value = `Coordinates updated (${latitude}, ${longitude})`
  }
}

async function handleNominatimSearch() {
  if (!geocodeQuery.value.trim()) return
  geocoding.value = true
  geocodeStatus.value = ''
  try {
    const results = await searchVenueGeocode(geocodeQuery.value, form.region)
    geocodeResults.value = results
    geocodeStatus.value = results.length
      ? `Found ${results.length} venue(s) via Nominatim OpenStreetMap REST API.`
      : 'No Nominatim matches found — try a broader suburb or circuit name.'
  } finally {
    geocoding.value = false
  }
}

function selectGeocodeResult(item) {
  form.venue = item.venue
  form.address = item.address
  form.latitude = item.latitude
  form.longitude = item.longitude
  form.region = item.region
  geocodeResults.value = []
  geocodeStatus.value = `Applied "${item.venue}" from ${item.source}.`
}

function toDatetimeLocal(sqlStr) {
  if (!sqlStr) return '2026-11-15T09:00'
  return String(sqlStr).replace(' ', 'T').slice(0, 16)
}

function toSqlDatetime(localStr) {
  if (!localStr) return '2026-11-15 09:00:00'
  const formatted = String(localStr).replace('T', ' ')
  return formatted.length === 16 ? `${formatted}:00` : formatted
}

async function handleSubmit() {
  error.value = ''
  if (form.end_datetime < form.start_datetime) {
    error.value = 'End date/time must be after the start date/time.'
    return
  }

  loading.value = true
  try {
    const payload = {
      ...form,
      start_datetime: toSqlDatetime(form.start_datetime),
      end_datetime: toSqlDatetime(form.end_datetime)
    }

    if (isEditMode.value) {
      await api.put(`/events/${route.params.id}`, payload)
      router.push(`/events/${route.params.id}`)
    } else {
      const res = await api.post('/events', payload)
      router.push(`/events/${res.id}`)
    }
  } catch (err) {
    error.value = err.message || 'Failed to save event.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const [catRes, clubRes] = await Promise.all([api.get('/categories'), api.get('/clubs')])
  categories.value = catRes.data || []
  clubs.value = clubRes.data || []

  if (isEditMode.value) {
    const evRes = await api.get(`/events/${route.params.id}`)
    const ev = evRes.data
    if (ev) {
      form.title = ev.title
      form.category_id = ev.category_id
      form.club_id = ev.club_id
      form.region = ev.region
      form.venue = ev.venue
      form.address = ev.address
      form.organizer_contact = ev.organizer_contact
      form.latitude = ev.latitude
      form.longitude = ev.longitude
      form.start_datetime = toDatetimeLocal(ev.start_datetime)
      form.end_datetime = toDatetimeLocal(ev.end_datetime)
      form.price = ev.price
      form.capacity = ev.capacity
      form.image = ev.image
      form.status = ev.status
      form.description = ev.description
    }
  }
})
</script>

<template>
  <div class="container py-4">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
      <div>
        <span class="badge bg-warning text-dark mb-1">
          <i class="bi bi-flag-fill me-1" aria-hidden="true"></i>Organizer Event Submission Portal
        </span>
        <h1 class="h3 fw-bold mb-0">
          {{ isEditMode ? `Edit Event #${route.params.id}` : 'Host a New Track Day or Car Meet' }}
        </h1>
      </div>
      <router-link to="/dashboard" class="btn btn-sm btn-outline-secondary">
        <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>Back to Organizer Dashboard
      </router-link>
    </div>

    <div v-if="error" class="alert alert-danger py-2 small" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-1" aria-hidden="true"></i>{{ error }}
    </div>

    <form class="row g-4" @submit.prevent="handleSubmit">
      <!-- Left Column: Event Details & Schedule -->
      <div class="col-12 col-lg-7">
        <div class="apex-card p-4">
          <h2 class="h5 fw-bold mb-3">1. Event Information &amp; Classification</h2>

          <div class="row g-3">
            <div class="col-12 apex-field">
              <label for="ev-title" class="form-label small fw-semibold mb-0">Event Title *</label>
              <span id="ev-title-hint" class="field-hint">
                Include venue and event round/type (min 5 characters)
              </span>
              <input
                id="ev-title"
                v-model="form.title"
                type="text"
                class="form-control"
                required
                minlength="5"
                aria-describedby="ev-title-hint"
                aria-errormessage="ev-title-err"
                placeholder="e.g. Sandown Twilight Time Attack — Round 5"
              />
              <div id="ev-title-err" class="error-msg">
                <span aria-hidden="true">❌</span> Event title must be at least 5 characters.
              </div>
            </div>

            <div class="col-12 col-md-4">
              <label for="ev-category" class="form-label small fw-semibold">Discipline / Category *</label>
              <select id="ev-category" v-model.number="form.category_id" class="form-select" required>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <div class="col-12 col-md-5">
              <label for="ev-club" class="form-label small fw-semibold">Hosting Club / Organization</label>
              <select id="ev-club" v-model="form.club_id" class="form-select">
                <option :value="null">Independent Organizer</option>
                <option v-for="cl in clubs" :key="cl.id" :value="cl.id">
                  {{ cl.name }} ({{ cl.region }})
                </option>
              </select>
            </div>

            <div class="col-12 col-md-3">
              <label for="ev-status" class="form-label small fw-semibold">Event Status *</label>
              <select id="ev-status" v-model="form.status" class="form-select" required>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div class="col-12 col-md-6">
              <label for="ev-start" class="form-label small fw-semibold">Start Date &amp; Time *</label>
              <input
                id="ev-start"
                v-model="form.start_datetime"
                type="datetime-local"
                class="form-control"
                required
              />
            </div>

            <div class="col-12 col-md-6">
              <label for="ev-end" class="form-label small fw-semibold">End Date &amp; Time *</label>
              <input
                id="ev-end"
                v-model="form.end_datetime"
                type="datetime-local"
                class="form-control"
                required
              />
            </div>

            <div class="col-6 col-md-4">
              <label for="ev-price" class="form-label small fw-semibold">
                Entry Price ({{ form.region === 'Malaysia' ? 'RM' : 'A$' }}) *
              </label>
              <input
                id="ev-price"
                v-model.number="form.price"
                type="number"
                min="0"
                max="5000"
                step="1"
                class="form-control"
                required
              />
            </div>

            <div class="col-6 col-md-4">
              <label for="ev-capacity" class="form-label small fw-semibold">Driver / Car Capacity *</label>
              <input
                id="ev-capacity"
                v-model.number="form.capacity"
                type="number"
                min="5"
                max="2000"
                class="form-control"
                required
              />
            </div>

            <div class="col-12 col-md-4">
              <label for="ev-region" class="form-label small fw-semibold">Country / Region *</label>
              <select id="ev-region" v-model="form.region" class="form-select" required>
                <option value="Australia">Australia</option>
                <option value="Malaysia">Malaysia</option>
              </select>
            </div>

            <div class="col-12">
              <label for="ev-image" class="form-label small fw-semibold">Cover Banner Image URL</label>
              <input
                id="ev-image"
                v-model="form.image"
                type="url"
                class="form-control"
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div class="col-12 apex-field">
              <label for="ev-desc" class="form-label small fw-semibold mb-0">
                Scrutineering Rules, Schedule &amp; Description *
              </label>
              <span id="ev-desc-hint" class="field-hint">
                Detail helmet/apparel rules, session format, and noise limits (min 20 characters)
              </span>
              <textarea
                id="ev-desc"
                v-model="form.description"
                rows="4"
                class="form-control"
                required
                minlength="20"
                aria-describedby="ev-desc-hint"
                aria-errormessage="ev-desc-err"
                placeholder="Include driver briefing time, scrutineering requirements, and session format..."
              ></textarea>
              <div id="ev-desc-err" class="error-msg">
                <span aria-hidden="true">❌</span> Please provide at least 20 characters of event description.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Venue, Member-Only Address & Interactive Map Coordinate Picker -->
      <div class="col-12 col-lg-5">
        <div class="apex-card p-4 h-100 d-flex flex-column">
          <h2 class="h5 fw-bold mb-3">2. Circuit / Venue &amp; Member-Only Details</h2>

          <div class="mb-3 p-2 rounded border border-secondary bg-dark bg-opacity-25">
            <label for="nominatim-search" class="form-label small fw-semibold text-info mb-1">
              <i class="bi bi-globe2 me-1" aria-hidden="true"></i>
              Live Venue &amp; Address Search (Nominatim OSM REST API)
            </label>
            <div class="input-group input-group-sm">
              <input
                id="nominatim-search"
                v-model="geocodeQuery"
                type="search"
                class="form-control"
                placeholder="Search circuit or suburb (e.g. Sandown, Sepang, Docklands)..."
                @keydown.enter.prevent="handleNominatimSearch"
              />
              <button
                type="button"
                class="btn btn-outline-info"
                :disabled="geocoding"
                @click="handleNominatimSearch"
              >
                {{ geocoding ? 'Searching…' : 'Geocode' }}
              </button>
            </div>
            <div v-if="geocodeStatus" class="small text-body-secondary mt-1 font-monospace">
              {{ geocodeStatus }}
            </div>
            <ul v-if="geocodeResults.length" class="list-group list-group-flush mt-2 small">
              <li
                v-for="(item, gIdx) in geocodeResults"
                :key="gIdx"
                class="list-group-item list-group-item-action bg-transparent text-light border-secondary py-1 px-2"
                style="cursor: pointer"
                @click="selectGeocodeResult(item)"
              >
                <div class="fw-bold text-warning">{{ item.venue }} ({{ item.region }})</div>
                <div class="text-body-secondary text-truncate">{{ item.address }}</div>
              </li>
            </ul>
          </div>

          <div class="mb-3">
            <label for="venue-preset" class="form-label small fw-semibold text-warning">
              <i class="bi bi-lightning-charge me-1" aria-hidden="true"></i>
              Quick-Fill Famous Circuit / Meet Preset (AU &amp; MY)
            </label>
            <select id="venue-preset" class="form-select form-select-sm" @change="applyVenuePreset">
              <option value="">— Select a circuit preset or click map below —</option>
              <option v-for="(preset, idx) in VENUE_PRESETS" :key="preset.label" :value="idx">
                {{ preset.label }}
              </option>
            </select>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-12">
              <label for="ev-venue" class="form-label small fw-semibold">Public Venue Name *</label>
              <input
                id="ev-venue"
                v-model="form.venue"
                type="text"
                class="form-control"
                required
                placeholder="e.g. Sandown International Raceway or Sepang North Paddock"
              />
            </div>

            <div class="col-12">
              <label for="ev-address" class="form-label small fw-semibold">
                Exact Gate / Street Address (Members-Only Visibility) *
              </label>
              <input
                id="ev-address"
                v-model="form.address"
                type="text"
                class="form-control"
                required
                placeholder="e.g. Gate 2 Pit Paddock Entry, 591 Princes Hwy, Springvale"
              />
            </div>

            <div class="col-12">
              <label for="ev-contact" class="form-label small fw-semibold">
                Direct Organizer Contact (Members-Only Visibility) *
              </label>
              <input
                id="ev-contact"
                v-model="form.organizer_contact"
                type="text"
                class="form-control"
                required
                placeholder="e.g. Syed Rahman — track@victimeattack.com.au | +61 412 889 102"
              />
            </div>

            <div class="col-6">
              <label for="ev-lat" class="form-label small fw-semibold">Latitude *</label>
              <input
                id="ev-lat"
                v-model.number="form.latitude"
                type="number"
                step="any"
                class="form-control form-control-sm"
                required
              />
            </div>

            <div class="col-6">
              <label for="ev-lng" class="form-label small fw-semibold">Longitude *</label>
              <input
                id="ev-lng"
                v-model.number="form.longitude"
                type="number"
                step="any"
                class="form-control form-control-sm"
                required
              />
            </div>
          </div>

          <div class="small text-body-secondary mb-2">
            <i class="bi bi-cursor-fill text-danger me-1" aria-hidden="true"></i>
            Click anywhere on the map to set exact GPS coordinates:
          </div>

          <EventMap
            :events="[mapPreviewEvent]"
            height="230px"
            :show-region-controls="false"
            :selectable="true"
            @pick-coordinates="handleMapPickCoords"
          />

          <div class="mt-auto pt-4 d-flex justify-content-end gap-2">
            <router-link to="/dashboard" class="btn btn-outline-secondary">
              Cancel
            </router-link>
            <button type="submit" class="btn btn-apex px-4" :disabled="loading">
              <i class="bi bi-check2-circle me-1" aria-hidden="true"></i>
              {{ isEditMode ? 'Save Event Updates' : 'Publish Motorsport Event' }}
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
