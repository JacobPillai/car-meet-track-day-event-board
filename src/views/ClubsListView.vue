<script setup>
import { ref, reactive, onMounted } from 'vue'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()

const clubs = ref([])
const searchQuery = ref('')
const selectedRegion = ref('All')
const loading = ref(true)
const showCreateForm = ref(false)
const feedback = ref('')
const error = ref('')

const newClub = reactive({
  name: '',
  region: 'Australia',
  city: 'Melbourne, VIC',
  founded_year: 2024,
  logo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop&q=80',
  description: ''
})

async function loadClubs() {
  loading.value = true
  try {
    const res = await api.get('/clubs', {
      region: selectedRegion.value === 'All' ? '' : selectedRegion.value,
      search: searchQuery.value
    })
    clubs.value = res.data || []
  } finally {
    loading.value = false
  }
}

async function handleCreateClub() {
  error.value = ''
  try {
    await api.post('/clubs', { ...newClub })
    feedback.value = `Club "${newClub.name}" registered successfully!`
    showCreateForm.value = false
    newClub.name = ''
    newClub.description = ''
    await loadClubs()
  } catch (err) {
    error.value = err.message || 'Could not create club.'
  }
}

onMounted(() => {
  loadClubs()
})
</script>

<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1">
          <i class="bi bi-shield-check text-warning me-2" aria-hidden="true"></i>
          Official Car Clubs &amp; Track-Day Organizers
        </h1>
        <p class="text-body-secondary small mb-0">
          Verified motorsport organizations hosting regular track days, drift clinics, and car meets
          across Australia &amp; Malaysia
        </p>
      </div>

      <button
        v-if="authStore.isOrganizer"
        type="button"
        class="btn btn-sm btn-apex"
        @click="showCreateForm = !showCreateForm"
      >
        <i class="bi bi-plus-circle me-1" aria-hidden="true"></i>
        {{ showCreateForm ? 'Close Club Form' : 'Register New Club' }}
      </button>
    </div>

    <div v-if="feedback" class="alert alert-success py-2 small">{{ feedback }}</div>
    <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

    <!-- Organizer Register New Club Form -->
    <section v-if="showCreateForm" class="apex-card p-4 mb-4 border-danger">
      <h2 class="h5 fw-bold mb-3">Register a New Motorsport Club / Organizer Profile</h2>
      <form @submit.prevent="handleCreateClub">
        <div class="row g-3">
          <div class="col-12 col-md-5">
            <label for="club-name" class="form-label small fw-semibold">Club Name *</label>
            <input
              id="club-name"
              v-model="newClub.name"
              type="text"
              class="form-control"
              required
              minlength="3"
              placeholder="e.g. Melbourne Time Attack Guild"
            />
          </div>

          <div class="col-6 col-md-3">
            <label for="club-region" class="form-label small fw-semibold">Region *</label>
            <select id="club-region" v-model="newClub.region" class="form-select" required>
              <option value="Australia">Australia</option>
              <option value="Malaysia">Malaysia</option>
            </select>
          </div>

          <div class="col-6 col-md-4">
            <label for="club-city" class="form-label small fw-semibold">Home City / State *</label>
            <input
              id="club-city"
              v-model="newClub.city"
              type="text"
              class="form-control"
              required
              placeholder="e.g. Melbourne, VIC or Kuching, Sarawak"
            />
          </div>

          <div class="col-12 col-md-8">
            <label for="club-logo" class="form-label small fw-semibold">Club Banner / Logo Image URL</label>
            <input
              id="club-logo"
              v-model="newClub.logo"
              type="url"
              class="form-control"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div class="col-12 col-md-4">
            <label for="club-founded" class="form-label small fw-semibold">Founded Year</label>
            <input
              id="club-founded"
              v-model.number="newClub.founded_year"
              type="number"
              min="1960"
              max="2026"
              class="form-control"
            />
          </div>

          <div class="col-12">
            <label for="club-desc" class="form-label small fw-semibold">Club Mission &amp; Focus *</label>
            <textarea
              id="club-desc"
              v-model="newClub.description"
              rows="3"
              class="form-control"
              required
              minlength="15"
              placeholder="Describe your club's track days, car meets, and membership requirements..."
            ></textarea>
          </div>

          <div class="col-12 d-flex justify-content-end gap-2">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="showCreateForm = false"
            >
              Cancel
            </button>
            <button type="submit" class="btn btn-sm btn-apex">
              Create Club Profile
            </button>
          </div>
        </div>
      </form>
    </section>

    <!-- Search & Region Filter -->
    <div class="apex-card p-3 mb-4">
      <div class="row g-2 align-items-center">
        <div class="col-12 col-md-7">
          <label for="club-search" class="visually-hidden">Search clubs</label>
          <input
            id="club-search"
            v-model="searchQuery"
            type="search"
            class="form-control form-control-sm"
            placeholder="Search clubs by name, city (Melbourne, Sepang, Kuching), or discipline..."
            @input="loadClubs"
          />
        </div>
        <div class="col-12 col-md-5 d-flex justify-content-md-end gap-2">
          <div class="btn-group btn-group-sm" role="group" aria-label="Filter clubs by region">
            <button
              type="button"
              class="btn"
              :class="selectedRegion === 'All' ? 'btn-apex' : 'btn-outline-secondary'"
              @click="selectedRegion = 'All'; loadClubs()"
            >
              All Regions
            </button>
            <button
              type="button"
              class="btn"
              :class="selectedRegion === 'Australia' ? 'btn-apex' : 'btn-outline-secondary'"
              @click="selectedRegion = 'Australia'; loadClubs()"
            >
              Australia (VIC)
            </button>
            <button
              type="button"
              class="btn"
              :class="selectedRegion === 'Malaysia' ? 'btn-apex' : 'btn-outline-secondary'"
              @click="selectedRegion = 'Malaysia'; loadClubs()"
            >
              Malaysia (MY)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Clubs Grid -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading clubs...</span>
      </div>
    </div>

    <div v-else class="row g-4">
      <div v-for="club in clubs" :key="club.id" class="col-12 col-md-6 col-lg-4">
        <article class="apex-card apex-card-hover h-100 p-4 d-flex flex-column">
          <div class="d-flex align-items-center gap-3 mb-3">
            <img
              :src="club.logo"
              :alt="club.name"
              width="68"
              height="68"
              class="rounded-3 object-fit-cover border"
            />
            <div>
              <div class="d-flex flex-wrap gap-1 mb-1">
                <span class="badge bg-danger">{{ club.region }}</span>
                <span class="badge bg-secondary-subtle text-body-emphasis">{{ club.city }}</span>
              </div>
              <h2 class="h5 fw-bold mb-0">{{ club.name }}</h2>
              <div class="small text-body-secondary">
                Est. {{ club.founded_year || 2020 }} • Director: {{ club.owner_name }}
              </div>
            </div>
          </div>

          <p class="small text-body-secondary flex-grow-1 mb-3">
            {{ club.description }}
          </p>

          <div class="d-flex align-items-center justify-content-between pt-3 border-top small">
            <div>
              <span class="me-3">
                <i class="bi bi-calendar-check text-danger me-1" aria-hidden="true"></i>
                <strong>{{ club.events_count || 0 }}</strong> Events
              </span>
              <span>
                <i class="bi bi-people text-warning me-1" aria-hidden="true"></i>
                <strong>{{ club.total_rsvps || 0 }}</strong> Going
              </span>
            </div>

            <router-link :to="`/clubs/${club.id}`" class="btn btn-sm btn-apex">
              View Club <i class="bi bi-arrow-right ms-1" aria-hidden="true"></i>
            </router-link>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>
