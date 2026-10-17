<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()

const form = reactive({
  name: '',
  region: 'Australia',
  avatar: '',
  bio: ''
})

const savedMessage = ref('')

onMounted(() => {
  if (authStore.user) {
    form.name = authStore.user.name || ''
    form.region = authStore.user.region || 'Australia'
    form.avatar = authStore.user.avatar || ''
    form.bio = authStore.user.bio || ''
  }
})

async function handleSaveProfile() {
  savedMessage.value = ''
  await authStore.updateProfile({ ...form })
  savedMessage.value = 'Your driver profile and regional preferences have been saved.'
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
                <div class="d-flex align-items-center gap-2">
                  <h1 class="h4 fw-bold mb-0">{{ authStore.user?.name }}</h1>
                  <span class="badge bg-danger text-uppercase">{{ authStore.userRole }}</span>
                </div>
                <div class="text-body-secondary small">{{ authStore.user?.email }}</div>
                <div class="small text-warning mt-1">
                  <i class="bi bi-globe-asia-australia me-1" aria-hidden="true"></i>
                  Home Hub: {{ authStore.user?.region || 'Australia' }}
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
