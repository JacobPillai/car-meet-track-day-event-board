<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { POPULAR_VEHICLE_MAKES, fetchVehicleModelsForMake } from '../services/externalApis'

const authStore = useAuthStore()

const form = reactive({
  name: '',
  region: 'Australia',
  vehicle: '',
  avatar: '',
  bio: ''
})

const selectedMake = ref('Honda')
const selectedModel = ref('')
const selectedYear = ref('2023')
const vehicleModels = ref([])
const vehicleApiSource = ref('')
const loadingModels = ref(false)
const savedMessage = ref('')

async function loadNhtsaModels(make) {
  loadingModels.value = true
  try {
    const res = await fetchVehicleModelsForMake(make)
    vehicleModels.value = res.models || []
    vehicleApiSource.value = res.source || 'NHTSA vPIC REST API'
    if (vehicleModels.value.length && !selectedModel.value) {
      selectedModel.value = vehicleModels.value[0]
    }
  } finally {
    loadingModels.value = false
  }
}

function applyVerifiedVehicle() {
  if (!selectedMake.value || !selectedModel.value) return
  form.vehicle = `${selectedYear.value || '2023'} ${selectedMake.value} ${selectedModel.value}`.trim()
}

onMounted(() => {
  if (authStore.user) {
    form.name = authStore.user.name || ''
    form.region = authStore.user.region || 'Australia'
    form.vehicle = authStore.user.vehicle || ''
    form.avatar = authStore.user.avatar || ''
    form.bio = authStore.user.bio || ''
  }
  loadNhtsaModels(selectedMake.value)
})

async function handleSaveProfile() {
  savedMessage.value = ''
  await authStore.updateProfile({ ...form })
  savedMessage.value = 'Your driver profile, verified garage vehicle, and regional preferences have been saved.'
}
</script>

<template>
  <div class="container apx-page">
    <div class="profile-shell">
      <header class="apx-head">
        <div class="d-flex align-items-center gap-3 min-w-0">
          <img
            :src="form.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80'"
            :alt="authStore.user?.name"
            width="80"
            height="80"
            class="profile-avatar"
          />
          <div class="min-w-0">
            <p class="apx-eyebrow">Driver profile</p>
            <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
              <h1 class="apx-title mb-0">{{ authStore.user?.name }}</h1>
              <span class="apx-chip apx-chip--accent">{{ authStore.userRole }}</span>
              <span v-if="authStore.user?.oauth_provider" class="apx-chip">
                <i class="bi bi-shield-lock-fill" aria-hidden="true"></i>OAuth 2.0 · {{ authStore.user.oauth_provider }}
              </span>
            </div>
            <div class="small" style="overflow-wrap: anywhere">{{ authStore.user?.email }}</div>
            <div class="small apx-muted mt-1">
              <i class="bi bi-globe-asia-australia me-1" aria-hidden="true"></i>Home Hub: {{ authStore.user?.region || 'Australia' }}
              <span v-if="authStore.user?.vehicle"> · <i class="bi bi-car-front-fill me-1" aria-hidden="true"></i>{{ authStore.user.vehicle }}</span>
            </div>
          </div>
        </div>
        <router-link :to="authStore.roleHomeRoute" class="apx-btn">
          Go to My Role Portal <i class="bi bi-arrow-right" aria-hidden="true"></i>
        </router-link>
      </header>

      <div v-if="savedMessage" class="apx-panel apx-panel--accent mb-4 small" role="status">
        <i class="bi bi-check-circle-fill me-1" style="color: var(--apex-red)" aria-hidden="true"></i>{{ savedMessage }}
      </div>

      <form class="apx-panel apx-tick" @submit.prevent="handleSaveProfile">
        <div class="apx-grid">
          <div class="apx-field">
            <label for="prof-name">Display Name *</label>
            <input id="prof-name" v-model="form.name" type="text" required minlength="3" />
          </div>

          <div class="apx-field">
            <label for="prof-region">Default Region Hub (AU / MY)</label>
            <select id="prof-region" v-model="form.region">
              <option value="Australia">Australia (Melbourne / Victoria)</option>
              <option value="Malaysia">Malaysia (Sepang / Kuching)</option>
            </select>
          </div>

          <fieldset class="profile-lookup is-wide">
            <legend>
              <span class="apx-eyebrow mb-0">Vehicle lookup · NHTSA vPIC</span>
            </legend>
            <p class="small apx-muted mb-3">
              Pick a verified make and model from the public NHTSA vehicle database
              <span class="apx-chip ms-1">{{ vehicleApiSource || 'vpic.nhtsa.dot.gov' }}</span>
            </p>
            <div class="profile-lookup__row">
              <div class="apx-field">
                <label for="prof-veh-year">Year</label>
                <input id="prof-veh-year" v-model="selectedYear" type="number" min="1970" max="2027" />
              </div>
              <div class="apx-field">
                <label for="prof-veh-make">Make</label>
                <select id="prof-veh-make" v-model="selectedMake" @change="loadNhtsaModels(selectedMake)">
                  <option v-for="mk in POPULAR_VEHICLE_MAKES" :key="mk" :value="mk">{{ mk }}</option>
                </select>
              </div>
              <div class="apx-field">
                <label for="prof-veh-model">Verified Model</label>
                <select id="prof-veh-model" v-model="selectedModel" :disabled="loadingModels">
                  <option v-for="md in vehicleModels" :key="md" :value="md">{{ md }}</option>
                </select>
              </div>
              <button type="button" class="apx-btn profile-lookup__apply" @click="applyVerifiedVehicle">Apply</button>
            </div>
            <div class="apx-field mt-3">
              <label for="prof-vehicle">Active Track / Meet Vehicle</label>
              <input id="prof-vehicle" v-model="form.vehicle" type="text" placeholder="e.g. 2023 Honda Civic Type R (FL5)" />
            </div>
          </fieldset>

          <div class="apx-field is-wide">
            <label for="prof-avatar">Avatar Image URL</label>
            <input id="prof-avatar" v-model="form.avatar" type="url" placeholder="https://images.unsplash.com/..." />
          </div>

          <div class="apx-field is-wide">
            <label for="prof-bio">Vehicle Garage &amp; Track Bio</label>
            <textarea id="prof-bio" v-model="form.bio" rows="3" placeholder="Share your current track car, PB lap times, or favorite circuit..."></textarea>
          </div>

          <div class="is-wide text-end">
            <button type="submit" class="apx-btn apx-btn--primary">
              <i class="bi bi-floppy" aria-hidden="true"></i>Save profile settings
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.profile-shell { max-width: 56rem; margin-inline: auto; }
.profile-avatar { flex: none; width: 80px; height: 80px; object-fit: cover; border: 2px solid var(--apex-red); }
.profile-shell .apx-title { font-size: clamp(1.4rem, 3.2vw, 2.2rem); }
.apx-muted { color: var(--apex-text-muted); }
.min-w-0 { min-width: 0; }
.profile-lookup { grid-column: 1 / -1; min-width: 0; margin: 0; padding: 1.25rem; border: 1px solid var(--apex-border-strong); background: var(--apex-bg-elevated); }
.profile-lookup legend { float: none; width: auto; margin: 0; padding: 0 0.5rem; font-size: inherit; }
.profile-lookup__row { display: grid; grid-template-columns: 6.5rem minmax(0, 1fr) minmax(0, 1.4fr) auto; gap: 0.75rem; align-items: end; }
.profile-lookup__apply { min-height: 48px; }
@media (max-width: 767.98px) {
  .profile-lookup__row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .profile-lookup__row .apx-field:nth-child(3) { grid-column: 1 / -1; }
  .profile-lookup__apply { grid-column: 1 / -1; }
}
</style>
