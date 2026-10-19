<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../composables/useToast'
import EventCard from '../components/EventCard.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const club = ref(null)
const loading = ref(true)
const activeTab = ref('upcoming')
const isEditing = ref(false)
const editForm = ref({})

const upcomingEvents = computed(() =>
  (club.value?.events || []).filter((e) => e.status === 'upcoming')
)
const completedEvents = computed(() =>
  (club.value?.events || []).filter((e) => e.status !== 'upcoming')
)

const canManageClub = computed(() => {
  if (!authStore.isAuthenticated || !club.value) return false
  if (authStore.isAdmin) return true
  return authStore.isOrganizer && Number(club.value.owner_id) === Number(authStore.user?.id)
})

async function loadClubDetail() {
  loading.value = true
  try {
    const res = await api.get(`/clubs/${route.params.id}`)
    club.value = res.data
    editForm.value = { ...res.data }
  } finally {
    loading.value = false
  }
}

async function saveClubEdits() {
  await api.put(`/clubs/${club.value.id}`, editForm.value)
  isEditing.value = false
  showToast(`Updated profile for ${club.value.name}`, 'success')
  await loadClubDetail()
}

async function deleteClub() {
  if (
    typeof window !== 'undefined' &&
    window.confirm(`Are you sure you want to delete "${club.value.name}"? This action cannot be undone.`)
  ) {
    try {
      await api.delete(`/clubs/${club.value.id}`)
      showToast(`Club "${club.value.name}" has been deleted.`, 'warning')
      router.push('/clubs')
    } catch (err) {
      showToast(err.message || 'Failed to delete club.', 'danger')
    }
  }
}

async function handleToggleLike(ev) {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  if (ev.user_liked) {
    await api.delete(`/events/${ev.id}/like`)
  } else {
    await api.post(`/events/${ev.id}/like`)
  }
  await loadClubDetail()
}

onMounted(() => {
  loadClubDetail()
})
</script>

<template>
  <div class="container py-4">
    <nav aria-label="breadcrumb" class="mb-3">
      <ol class="breadcrumb small mb-0">
        <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
        <li class="breadcrumb-item"><router-link to="/clubs">Clubs</router-link></li>
        <li class="breadcrumb-item active" aria-current="page">{{ club?.name || 'Club Detail' }}</li>
      </ol>
    </nav>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading club profile...</span>
      </div>
    </div>

    <div v-else-if="club">
      <!-- Club Hero Card -->
      <div class="apex-card p-4 mb-4">
        <div class="row g-4 align-items-center">
          <div class="col-12 col-md-auto text-center">
            <img
              :src="club.logo"
              :alt="club.name"
              width="120"
              height="120"
              class="rounded-4 object-fit-cover border border-2 border-danger"
            />
          </div>

          <div class="col-12 col-md">
            <div class="d-flex flex-wrap gap-2 mb-2">
              <span class="badge bg-danger">{{ club.region }}</span>
              <span class="badge bg-secondary">{{ club.city }}</span>
              <span class="badge bg-warning text-dark">Founded {{ club.founded_year }}</span>
            </div>
            <h1 class="h3 fw-bold mb-2">{{ club.name }}</h1>
            <p class="text-body-secondary mb-2">{{ club.description }}</p>
            <div class="small text-body-secondary">
              <i class="bi bi-person-badge text-danger me-1" aria-hidden="true"></i>
              Club Director: <strong>{{ club.owner_name }}</strong>
            </div>
          </div>

          <div v-if="canManageClub" class="col-12 col-md-auto d-flex flex-column gap-2">
            <button
              type="button"
              class="btn btn-sm btn-outline-warning"
              @click="isEditing = !isEditing"
            >
              <i class="bi bi-pencil-square me-1" aria-hidden="true"></i>
              {{ isEditing ? 'Cancel Edit' : 'Edit Club Profile' }}
            </button>
            <router-link to="/events/new" class="btn btn-sm btn-apex">
              <i class="bi bi-plus-circle me-1" aria-hidden="true"></i>Host Club Event
            </router-link>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger"
              title="Delete this club and dissociate its events"
              @click="deleteClub"
            >
              <i class="bi bi-trash me-1" aria-hidden="true"></i>Delete Club
            </button>
          </div>
        </div>

        <!-- Inline Edit Form for Organizer/Admin -->
        <form v-if="isEditing" class="mt-4 pt-4 border-top" @submit.prevent="saveClubEdits">
          <div class="row g-3">
            <div class="col-12 col-md-6">
              <label for="edit-club-name" class="form-label small fw-semibold">Club Name</label>
              <input id="edit-club-name" v-model="editForm.name" type="text" class="form-control" required />
            </div>
            <div class="col-6 col-md-3">
              <label for="edit-club-city" class="form-label small fw-semibold">City</label>
              <input id="edit-club-city" v-model="editForm.city" type="text" class="form-control" required />
            </div>
            <div class="col-6 col-md-3">
              <label for="edit-club-year" class="form-label small fw-semibold">Founded Year</label>
              <input id="edit-club-year" v-model.number="editForm.founded_year" type="number" class="form-control" />
            </div>
            <div class="col-12">
              <label for="edit-club-desc" class="form-label small fw-semibold">Description</label>
              <textarea id="edit-club-desc" v-model="editForm.description" rows="2" class="form-control" required></textarea>
            </div>
            <div class="col-12 text-end">
              <button type="submit" class="btn btn-sm btn-apex">Save Changes</button>
            </div>
          </div>
        </form>
      </div>

      <!-- Hosted Events Tabs -->
      <div class="d-flex align-items-center justify-content-between mb-3">
        <ul class="nav nav-pills gap-2">
          <li class="nav-item">
            <button
              type="button"
              class="nav-link"
              :class="{ active: activeTab === 'upcoming', 'bg-danger': activeTab === 'upcoming' }"
              @click="activeTab = 'upcoming'"
            >
              Upcoming Events ({{ upcomingEvents.length }})
            </button>
          </li>
          <li class="nav-item">
            <button
              type="button"
              class="nav-link"
              :class="{ active: activeTab === 'completed', 'bg-danger': activeTab === 'completed' }"
              @click="activeTab = 'completed'"
            >
              Past &amp; Completed Events ({{ completedEvents.length }})
            </button>
          </li>
        </ul>
      </div>

      <div class="row g-4">
        <div
          v-for="ev in activeTab === 'upcoming' ? upcomingEvents : completedEvents"
          :key="ev.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <EventCard :event="ev" @toggle-like="handleToggleLike" />
        </div>

        <div
          v-if="(activeTab === 'upcoming' ? upcomingEvents : completedEvents).length === 0"
          class="col-12"
        >
          <div class="apex-card p-4 text-center text-body-secondary small">
            No {{ activeTab }} events found for this club.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
