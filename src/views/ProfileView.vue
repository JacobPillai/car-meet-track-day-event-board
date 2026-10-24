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
  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <div class="apex-card p-4">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 mb-4 border-bottom">
            <div class="d-flex align-items-center gap-3">
              <img
                :src="
                  form.avatar ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80'
                "
                :alt="authStore.user?.name"
                width="72"
                height="72"
                class="rounded-circle object-fit-cover border border-2 border-danger"
              />
              <div>
                <div class="d-flex flex-wrap align-items-center gap-2">
                  <h1 class="h4 fw-bold mb-0">{{ authStore.user?.name }}</h1>
                  <span class="badge bg-danger text-uppercase">{{ authStore.userRole }}</span>
                  <span v-if="authStore.user?.oauth_provider" class="badge bg-dark border border-secondary text-uppercase">
                    <i class="bi bi-shield-lock-fill text-warning me-1" aria-hidden="true"></i>
                    OAuth 2.0 · {{ authStore.user.oauth_provider }}
                  </span>
                </div>
                <div class="text-body-secondary small">{{ authStore.user?.email }}</div>
                <div class="small text-warning mt-1">
                  <i class="bi bi-globe-asia-australia me-1" aria-hidden="true"></i>
                  Home Hub: {{ authStore.user?.region || 'Australia' }}
                  <span v-if="authStore.user?.vehicle" class="ms-2 text-info">
                    · <i class="bi bi-car-front-fill me-1" aria-hidden="true"></i>{{ authStore.user.vehicle }}
                  </span>
                </div>
              </div>
            </div>

            <router-link :to="authStore.roleHomeRoute" class="btn btn-sm btn-outline-secondary">
              Go to My Role Portal <i class="bi bi-arrow-right ms-1" aria-hidden="true"></i>
            </router-link>
          </div>

          <div v-if="savedMessage" class="alert alert-success py-2 small" role="status">
            <i class="bi bi-check-circle-fill me-1" aria-hidden="true"></i>{{ savedMessage }}
          </div>

          <form @submit.prevent="handleSaveProfile">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label for="prof-name" class="form-label small fw-semibold">Display Name *</label>
                <input
                  id="prof-name"
                  v-model="form.name"
                  type="text"
                  class="form-control"
                  required
                  minlength="3"
                />
              </div>

              <div class="col-12 col-md-6">
                <label for="prof-region" class="form-label small fw-semibold">
                  Default Region Hub (AU / MY)
                </label>
                <select id="prof-region" v-model="form.region" class="form-select">
                  <option value="Australia">Australia (Melbourne / Victoria)</option>
                  <option value="Malaysia">Malaysia (Sepang / Kuching)</option>
                </select>
              </div>

              <div class="col-12">
                <div class="p-3 rounded border border-secondary bg-dark bg-opacity-25">
                  <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                    <span class="small fw-bold text-uppercase text-warning">
                      <i class="bi bi-cpu me-1" aria-hidden="true"></i>
                      NHTSA vPIC Vehicle Make &amp; Model Lookup (External REST API)
                    </span>
                    <span class="badge bg-secondary font-monospace">{{ vehicleApiSource || 'vpic.nhtsa.dot.gov' }}</span>
                  </div>
                  <div class="row g-2 align-items-end">
                    <div class="col-4 col-md-2">
                      <label for="prof-veh-year" class="form-label small mb-1">Year</label>
                      <input id="prof-veh-year" v-model="selectedYear" type="number" min="1970" max="2027" class="form-control form-control-sm" />
                    </div>
                    <div class="col-8 col-md-4">
                      <label for="prof-veh-make" class="form-label small mb-1">Make</label>
                      <select id="prof-veh-make" v-model="selectedMake" class="form-select form-select-sm" @change="loadNhtsaModels(selectedMake)">
                        <option v-for="mk in POPULAR_VEHICLE_MAKES" :key="mk" :value="mk">{{ mk }}</option>
                      </select>
                    </div>
                    <div class="col-8 col-md-4">
                      <label for="prof-veh-model" class="form-label small mb-1">Verified Model</label>
                      <select id="prof-veh-model" v-model="selectedModel" class="form-select form-select-sm" :disabled="loadingModels">
                        <option v-for="md in vehicleModels" :key="md" :value="md">{{ md }}</option>
                      </select>
                    </div>
                    <div class="col-4 col-md-2">
                      <button type="button" class="btn btn-sm btn-outline-warning w-100" @click="applyVerifiedVehicle">
                        Apply
                      </button>
                    </div>
                  </div>
                  <div class="mt-2">
                    <label for="prof-vehicle" class="form-label small fw-semibold mb-1">Active Track / Meet Vehicle</label>
                    <input
                      id="prof-vehicle"
                      v-model="form.vehicle"
                      type="text"
                      class="form-control form-control-sm"
                      placeholder="e.g. 2023 Honda Civic Type R (FL5)"
                    />
                  </div>
                </div>
              </div>

              <div class="col-12">
                <label for="prof-avatar" class="form-label small fw-semibold">Avatar Image URL</label>
                <input
                  id="prof-avatar"
                  v-model="form.avatar"
                  type="url"
                  class="form-control"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div class="col-12">
                <label for="prof-bio" class="form-label small fw-semibold">
                  Vehicle Garage &amp; Track Bio
                </label>
                <textarea
                  id="prof-bio"
                  v-model="form.bio"
                  rows="3"
                  class="form-control"
                  placeholder="Share your current track car, PB lap times, or favorite circuit..."
                ></textarea>
              </div>

              <div class="col-12 text-end">
                <button type="submit" class="btn btn-apex">
                  <i class="bi bi-floppy me-1" aria-hidden="true"></i>Save Profile Settings
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
