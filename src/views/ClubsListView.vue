<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
const clubs = ref([])
const searchQuery = ref('')
const selectedRegion = ref('All')
const loading = ref(true)
const loadError = ref(false)
const showCreateForm = ref(false)
const submitting = ref(false)
const feedback = ref('')
const createError = ref('')
const failedPhotos = ref(new Set())
const createToggle = ref(null)
const nameInput = ref(null)
const currentYear = new Date().getFullYear()
const hasFilters = computed(() => Boolean(searchQuery.value || selectedRegion.value !== 'All'))
let disposed = false
let loadVersion = 0

const newClub = reactive({
  name: '',
  region: 'Australia',
  city: 'Melbourne, VIC',
  founded_year: 2024,
  logo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop&q=80',
  description: ''
})

async function loadClubs() {
  if (disposed) return
  const version = ++loadVersion
  loading.value = true
  loadError.value = false
  try {
    const res = await api.get('/clubs', {
      region: selectedRegion.value === 'All' ? '' : selectedRegion.value,
      search: searchQuery.value
    })
    if (disposed || version !== loadVersion) return
    clubs.value = res.data || []
    failedPhotos.value = new Set()
  } catch {
    if (!disposed && version === loadVersion) loadError.value = true
  } finally {
    if (!disposed && version === loadVersion) loading.value = false
  }
}

function clearFilters() {
  searchQuery.value = ''
  selectedRegion.value = 'All'
  loadClubs()
}

function selectRegion(region) {
  if (region === selectedRegion.value) return
  selectedRegion.value = region
  loadClubs()
}

async function toggleCreateForm() {
  if (submitting.value) return
  showCreateForm.value = !showCreateForm.value
  createError.value = ''
  await nextTick()
  if (!disposed) (showCreateForm.value ? nameInput.value : createToggle.value)?.focus()
}

async function handleCreateClub() {
  if (disposed || submitting.value || !authStore.isOrganizer) return
  submitting.value = true
  createError.value = ''
  feedback.value = ''
  const payload = { ...newClub }
  try {
    await api.post('/clubs', payload)
    if (disposed) return
    feedback.value = `Club “${payload.name}” created.`
    showCreateForm.value = false
    newClub.name = ''
    newClub.description = ''
    loadClubs()
  } catch (err) {
    if (!disposed) createError.value = err.message || 'Could not create club. Please try again.'
  } finally {
    if (!disposed) {
      submitting.value = false
      if (!showCreateForm.value) {
        await nextTick()
        if (!disposed) createToggle.value?.focus()
      }
    }
  }
}

watch(() => authStore.isOrganizer, (allowed) => {
  if (!allowed) showCreateForm.value = false
})
onMounted(loadClubs)
onBeforeUnmount(() => {
  disposed = true
  loadVersion++
})
</script>

<template>
  <div class="clubs-page">
    <div class="container clubs-shell">
      <header class="clubs-header">
        <div>
          <p class="clubs-eyebrow">The club directory</p>
          <h1>Find your people.<br /><span>Share the drive.</span></h1>
          <p class="clubs-intro">Meet the car clubs and event organizers bringing people together across Australia and Malaysia. Find a familiar scene, or try something new.</p>
        </div>
        <button
          v-if="authStore.isOrganizer"
          ref="createToggle"
          type="button"
          class="clubs-button clubs-button--primary"
          :aria-expanded="showCreateForm"
          aria-controls="club-create-panel"
          :disabled="submitting"
          @click="toggleCreateForm"
        >
          {{ showCreateForm ? 'Close club form' : 'Register a club' }}
          <i class="bi bi-plus-lg" aria-hidden="true"></i>
        </button>
      </header>

      <p v-if="feedback" class="clubs-notice" role="status">{{ feedback }}</p>

      <section v-if="showCreateForm && authStore.isOrganizer" id="club-create-panel" class="clubs-create" aria-labelledby="club-create-title">
        <div class="clubs-section-heading">
          <h2 id="club-create-title">Introduce your club.</h2>
          <p>Tell people where you’re based and what brings you together. Required fields are marked *.</p>
        </div>
        <form class="clubs-create-form" :aria-busy="submitting" @submit.prevent="handleCreateClub">
          <fieldset :disabled="submitting">
            <div class="clubs-form-grid">
              <div class="clubs-field clubs-field--wide">
                <label for="club-name">Club name *</label>
                <input id="club-name" ref="nameInput" v-model="newClub.name" type="text" required minlength="3" />
              </div>
              <div class="clubs-field">
                <label for="club-region">Region *</label>
                <select id="club-region" v-model="newClub.region" required>
                  <option value="Australia">Australia</option>
                  <option value="Malaysia">Malaysia</option>
                </select>
              </div>
              <div class="clubs-field">
                <label for="club-city">Home city / state *</label>
                <input id="club-city" v-model="newClub.city" type="text" required placeholder="e.g. Kuching, Sarawak" />
              </div>
              <div class="clubs-field clubs-field--wide">
                <label for="club-logo">Club photo / logo URL</label>
                <input id="club-logo" v-model="newClub.logo" type="url" aria-describedby="club-photo-help" placeholder="https://…" />
                <small id="club-photo-help">Use an image you have permission to share.</small>
              </div>
              <div class="clubs-field">
                <label for="club-founded">Founded year</label>
                <input id="club-founded" v-model.number="newClub.founded_year" type="number" min="1960" :max="currentYear" />
              </div>
              <div class="clubs-field clubs-field--full">
                <label for="club-desc">About your club *</label>
                <textarea id="club-desc" v-model="newClub.description" rows="4" required minlength="15" placeholder="Your meets, drives, interests, and how newcomers can get involved…"></textarea>
              </div>
            </div>
            <div class="clubs-form-actions">
              <button type="button" class="clubs-button" @click="toggleCreateForm">Cancel</button>
              <button type="submit" class="clubs-button clubs-button--primary">{{ submitting ? 'Creating club…' : 'Create club profile' }}</button>
            </div>
          </fieldset>
          <p v-if="submitting" class="clubs-form-status" role="status">Creating your club profile…</p>
          <p v-if="createError" class="clubs-notice" role="alert">{{ createError }}</p>
        </form>
      </section>

      <form class="clubs-filters" role="search" aria-label="Find clubs" @submit.prevent="loadClubs">
        <div class="clubs-field clubs-search">
          <label for="club-search">Find a club</label>
          <div class="clubs-search-input">
            <i class="bi bi-search" aria-hidden="true"></i>
            <input id="club-search" v-model="searchQuery" type="search" placeholder="Search by name, city or interest" aria-controls="clubs-results" @input="loadClubs" />
          </div>
        </div>
        <div class="clubs-region" role="group" aria-label="Filter clubs by region">
          <span class="clubs-filter-label" aria-hidden="true">Explore by region</span>
          <div class="clubs-region-buttons">
            <button v-for="region in ['All', 'Australia', 'Malaysia']" :key="region" type="button" :aria-pressed="selectedRegion === region" @click="selectRegion(region)">{{ region === 'All' ? 'All regions' : region }}</button>
          </div>
        </div>
      </form>

      <section id="clubs-results" class="clubs-results" aria-labelledby="clubs-results-title" :aria-busy="loading">
        <div class="clubs-results-heading">
          <h2 id="clubs-results-title">The communities</h2>
          <p role="status">{{ loading ? 'Loading clubs…' : loadError ? 'Directory unavailable' : `${clubs.length} ${clubs.length === 1 ? 'club' : 'clubs'} found` }}</p>
        </div>
        <div v-if="loading" class="clubs-state">
          <p>Finding the next good company.</p>
          <span>Loading the club directory…</span>
        </div>
        <div v-else-if="loadError" class="clubs-state" role="alert">
          <h3>We couldn’t load the clubs.</h3>
          <p>Please try again. Your search and region are still selected.</p>
          <button type="button" class="clubs-button" @click="loadClubs">Try again</button>
        </div>
        <div v-else-if="!clubs.length" class="clubs-state clubs-empty">
          <h3>{{ hasFilters ? 'A little further afield?' : 'No clubs just yet.' }}</h3>
          <p>{{ hasFilters ? 'No clubs match this search. Try another name, city or region.' : 'Club profiles will appear here when they’re added.' }}</p>
          <button v-if="hasFilters" type="button" class="clubs-button" @click="clearFilters">Clear filters</button>
        </div>
        <div v-else class="clubs-grid">
          <article v-for="club in clubs" :key="club.id" class="club-entry">
            <div class="club-photo">
              <img v-if="club.logo && !failedPhotos.has(club.id)" :src="club.logo" alt="" width="720" height="450" loading="lazy" decoding="async" @error="failedPhotos.add(club.id)" />
              <div v-else class="club-photo-fallback">
                <i class="bi bi-image" aria-hidden="true"></i>
                <span>Club photo unavailable</span>
              </div>
            </div>
            <div class="club-entry-body">
              <p v-if="club.region || club.city" class="club-location">{{ [club.city, club.region].filter(Boolean).join(' / ') }}</p>
              <h3>{{ club.name }}</h3>
              <p v-if="club.founded_year || club.owner_name" class="club-byline">
                <span v-if="club.founded_year">Est. {{ club.founded_year }}</span>
                <span v-if="club.owner_name">Director: {{ club.owner_name }}</span>
              </p>
              <p class="club-description">{{ club.description || 'Visit the club profile to find out more.' }}</p>
              <div class="club-entry-footer">
                <p class="club-counts">
                  <span v-if="club.events_count != null"><strong>{{ club.events_count }}</strong> {{ Number(club.events_count) === 1 ? 'event' : 'events' }}</span>
                  <span v-if="club.total_rsvps != null"><strong>{{ club.total_rsvps }}</strong> going RSVPs</span>
                </p>
                <router-link :to="`/clubs/${club.id}`" class="club-link" :aria-label="`View club: ${club.name}`">View club <i class="bi bi-arrow-right" aria-hidden="true"></i></router-link>
              </div>
            </div>
          </article>
        </div>
      </section>
      <aside class="clubs-outro" aria-label="Find club events">
        <p>Meet the club. <span>Then make a day of it.</span></p>
        <router-link to="/events" class="clubs-button">Browse events <i class="bi bi-arrow-right" aria-hidden="true"></i></router-link>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.clubs-page {
  --clubs-bg: #181a19;
  --clubs-surface: #222523;
  --clubs-text: #f3f0e9;
  --clubs-muted: #b4b6af;
  --clubs-line: #41443f;
  --clubs-accent: #ed7059;
  --clubs-button: #bc422e;
  --clubs-button-hover: #a93827;
  color: var(--clubs-text);
  background: var(--clubs-bg);
}
[data-bs-theme='light'] .clubs-page {
  --clubs-bg: #f4f1ea;
  --clubs-surface: #e9e6de;
  --clubs-text: #242722;
  --clubs-muted: #5f625a;
  --clubs-line: #c8c9bf;
  --clubs-accent: #ae3d29;
}
.clubs-shell { padding-top: clamp(2.5rem, 6vw, 5rem); padding-bottom: 2rem; }
.clubs-header { display: flex; align-items: end; justify-content: space-between; gap: 2rem; padding-bottom: 2.5rem; }
.clubs-eyebrow { color: var(--clubs-accent); font-size: .75rem; text-transform: uppercase; letter-spacing: .16em; font-weight: 700; margin-bottom: 1.25rem; }
.clubs-header h1 { font-size: clamp(2.6rem, 5.8vw, 5rem); line-height: 1.04; font-weight: 700; letter-spacing: -.055em; margin: 0 0 1.5rem; }
.clubs-header h1 span { color: var(--clubs-muted); }
.clubs-intro { color: var(--clubs-muted); max-width: 60ch; line-height: 1.75; margin: 0; }
.clubs-button { display: inline-flex; align-items: center; justify-content: center; gap: .8rem; min-height: 44px; padding: .7rem 1.1rem; border: 1px solid var(--clubs-line); border-radius: 3px; color: var(--clubs-text); background: transparent; font-size: .875rem; font-weight: 600; text-decoration: none; text-align: center; }
.clubs-header > .clubs-button { flex-shrink: 0; }
.clubs-button:hover { background: var(--clubs-surface); color: var(--clubs-text); }
.clubs-button--primary { color: #fff; background: var(--clubs-button); border-color: var(--clubs-button); }
.clubs-button--primary:hover { color: #fff; background: var(--clubs-button-hover); border-color: var(--clubs-button-hover); }
.clubs-page :is(a, button, input, select, textarea):focus-visible { outline: 3px solid var(--clubs-accent); outline-offset: 4px; box-shadow: none; }
.clubs-page button:disabled, .clubs-page fieldset:disabled { opacity: .65; }
.clubs-page button:disabled { cursor: wait; }
.clubs-create { border-top: 1px solid var(--clubs-line); padding: 2rem 0; }
.clubs-section-heading h2, .clubs-results-heading h2 { font-size: 1.5rem; margin: 0; }
.clubs-section-heading p { color: var(--clubs-muted); margin: .75rem 0 1.5rem; }
.clubs-create fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
.clubs-form-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.25rem; }
.clubs-field { display: flex; flex-direction: column; gap: .5rem; min-width: 0; }
.clubs-field--wide { grid-column: span 2; }
.clubs-field--full { grid-column: 1 / -1; }
.clubs-field label, .clubs-filter-label { font-size: .8rem; font-weight: 600; }
.clubs-field :is(input, select, textarea) { width: 100%; min-width: 0; min-height: 46px; padding: .75rem; color: var(--clubs-text); background: var(--clubs-surface); border: 1px solid var(--clubs-line); border-radius: 3px; font: inherit; font-size: .9rem; color-scheme: dark; }
[data-bs-theme='light'] .clubs-page .clubs-field :is(input, select, textarea) { color-scheme: light; }
.clubs-field input::placeholder, .clubs-field textarea::placeholder { color: var(--clubs-muted); opacity: 1; }
.clubs-field textarea { resize: vertical; }
.clubs-field small, .clubs-form-status { color: var(--clubs-muted); }
.clubs-form-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: .75rem; margin-top: 1.5rem; }
.clubs-notice { padding: 1rem; border-left: 3px solid var(--clubs-accent); background: var(--clubs-surface); overflow-wrap: anywhere; }
.clubs-filters { display: flex; align-items: end; justify-content: space-between; gap: 2rem; padding: 1.5rem 0; border-block: 1px solid var(--clubs-line); }
.clubs-search { width: min(100%, 470px); }
.clubs-search-input { position: relative; }
.clubs-search-input > i { position: absolute; left: .9rem; top: 50%; transform: translateY(-50%); color: var(--clubs-muted); pointer-events: none; }
.clubs-search-input input { padding-left: 2.6rem; }
.clubs-region { display: flex; flex-direction: column; gap: .5rem; }
.clubs-region-buttons { display: flex; flex-wrap: wrap; gap: .25rem; }
.clubs-region button { min-height: 46px; padding: .65rem .9rem; font-size: .85rem; color: var(--clubs-muted); background: transparent; border: 1px solid transparent; border-radius: 3px; }
.clubs-region button:hover { color: var(--clubs-text); border-color: var(--clubs-line); }
.clubs-region button[aria-pressed='true'] { color: var(--clubs-text); background: var(--clubs-surface); border-color: var(--clubs-line); box-shadow: inset 0 -2px var(--clubs-accent); }
.clubs-results { padding-top: 2rem; }
.clubs-results-heading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .75rem; margin-bottom: 1.5rem; }
.clubs-results-heading p { color: var(--clubs-muted); font-size: .85rem; margin: 0; }
.clubs-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2.5rem 1.75rem; }
.club-entry { display: flex; flex-direction: column; min-width: 0; }
.club-photo { aspect-ratio: 8 / 5; background: var(--clubs-surface); overflow: hidden; }
.club-photo img { display: block; width: 100%; height: 100%; object-fit: cover; }
.club-photo-fallback { display: flex; height: 100%; flex-direction: column; align-items: center; justify-content: center; gap: .75rem; color: var(--clubs-muted); font-size: .85rem; }
.club-photo-fallback i { font-size: 1.8rem; }
.club-entry-body { display: flex; flex: 1; flex-direction: column; padding-top: 1.25rem; overflow-wrap: anywhere; }
.club-location { color: var(--clubs-accent); font-size: .75rem; font-weight: 600; margin: 0 0 .65rem; }
.club-entry h3 { font-size: 1.6rem; font-weight: 600; line-height: 1.2; margin: 0 0 .65rem; }
.club-byline { display: flex; flex-wrap: wrap; gap: .25rem 1rem; color: var(--clubs-muted); font-size: .75rem; margin-bottom: 1rem; }
.club-description { color: var(--clubs-muted); line-height: 1.75; font-size: .875rem; margin-bottom: 1.5rem; }
.club-entry-footer { display: flex; align-items: center; flex-wrap: wrap; justify-content: space-between; gap: .6rem; border-top: 1px solid var(--clubs-line); padding-top: .75rem; margin-top: auto; }
.club-counts { display: flex; flex-wrap: wrap; gap: .4rem 1rem; color: var(--clubs-muted); font-size: .75rem; margin: 0; }
.club-counts strong { color: var(--clubs-text); font-weight: 600; }
.club-link { display: inline-flex; align-items: center; gap: .6rem; min-height: 44px; color: var(--clubs-text); font-size: .85rem; font-weight: 600; text-decoration: none; }
.club-link:hover { color: var(--clubs-accent); text-decoration: underline; text-underline-offset: .3em; }
.clubs-state { padding: 4rem 1rem; text-align: center; color: var(--clubs-muted); }
.clubs-state h3 { color: var(--clubs-text); font-size: 1.6rem; }
.clubs-state .clubs-button { margin-top: .5rem; }
.clubs-outro { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; border-top: 1px solid var(--clubs-line); margin-top: 3rem; padding-top: 2rem; }
.clubs-outro p { font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.3rem, 2.5vw, 1.9rem); margin: 0; }
.clubs-outro p span { color: var(--clubs-muted); }
@media (max-width: 991.98px) {
  .clubs-header { align-items: start; flex-direction: column; }
  .clubs-filters { align-items: stretch; flex-direction: column; gap: 1.25rem; }
  .clubs-search { width: 100%; }
  .clubs-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .clubs-form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 575.98px) {
  .clubs-grid, .clubs-form-grid { grid-template-columns: minmax(0, 1fr); }
  .clubs-field--wide { grid-column: auto; }
  .clubs-outro { align-items: start; flex-direction: column; }
  .clubs-region-buttons { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .clubs-region button { padding-inline: .4rem; }
}
</style>
