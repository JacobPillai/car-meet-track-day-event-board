<script setup>
/**
 * ApexGrid — Admin Moderation & Role Control Portal (/admin)
 * Restricted to Admin accounts via Vue Router navigation guard + API role check.
 */
import { ref, onMounted } from 'vue'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()

const users = ref([])
const allEvents = ref([])
const comments = ref([])
const stats = ref({})
const activeTab = ref('users')
const loading = ref(true)
const feedback = ref('')
const error = ref('')

async function loadAdminData() {
  loading.value = true
  error.value = ''
  try {
    const [uRes, modRes, evRes] = await Promise.all([
      api.get('/admin/users'),
      api.get('/admin/moderation'),
      api.get('/events', { limit: 50, page: 1 })
    ])
    users.value = uRes.data || []
    comments.value = modRes.comments || []
    stats.value = modRes.stats || {}
    allEvents.value = evRes.data || []
  } catch (err) {
    error.value = err.message || 'Failed to load admin moderation data.'
  } finally {
    loading.value = false
  }
}

async function handleRoleChange(user, newRole) {
  try {
    await api.put(`/admin/users/${user.id}/role`, { role: newRole })
    feedback.value = `Updated role for ${user.name} (${user.email}) to ${newRole.toUpperCase()}.`
    await loadAdminData()
  } catch (err) {
    error.value = err.message
  }
}

async function handleDeleteUser(user) {
  if (Number(user.id) === Number(authStore.user?.id)) {
    error.value = 'You cannot delete your own active Admin account.'
    return
  }
  if (typeof window !== 'undefined' && window.confirm(`Remove user "${user.name}"?`)) {
    await api.delete(`/admin/users/${user.id}`)
    feedback.value = `User ${user.name} removed.`
    await loadAdminData()
  }
}

async function handleModerateEventStatus(ev, status) {
  await api.put(`/events/${ev.id}`, { ...ev, status })
  feedback.value = `Event "${ev.title}" status updated to ${status.toUpperCase()}.`
  await loadAdminData()
}

async function handleDeleteEvent(ev) {
  if (typeof window !== 'undefined' && window.confirm(`Delete event "${ev.title}"?`)) {
    await api.delete(`/events/${ev.id}`)
    feedback.value = `Event "${ev.title}" deleted by Admin.`
    await loadAdminData()
  }
}

async function handleDeleteComment(cm) {
  await api.delete(`/comments/${cm.id}`)
  feedback.value = `Comment #${cm.id} removed by Admin moderation.`
  await loadAdminData()
}

onMounted(() => {
  loadAdminData()
})
</script>

<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
      <div>
        <span class="badge bg-danger mb-1">
          <i class="bi bi-shield-lock-fill me-1" aria-hidden="true"></i>
          Administrator Control Center
        </span>
        <h1 class="h3 fw-bold mb-1">Platform Moderation &amp; User Role Management</h1>
        <p class="text-body-secondary small mb-0">
          Manage Member, Organizer, and Admin privileges, moderate all club events, and audit
          community reviews
        </p>
      </div>
    </div>

    <div v-if="feedback" class="alert alert-success py-2 small">{{ feedback }}</div>
    <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

    <!-- System Metrics Row -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-3">
        <div class="apex-card p-3">
          <div class="small text-body-secondary">Registered Users</div>
          <div class="h3 fw-bold text-info mb-0">{{ stats.users_count || users.length }}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="apex-card p-3">
          <div class="small text-body-secondary">Total Events</div>
          <div class="h3 fw-bold text-danger mb-0">{{ stats.events_count || allEvents.length }}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="apex-card p-3">
          <div class="small text-body-secondary">Active RSVPs</div>
          <div class="h3 fw-bold text-warning mb-0">{{ stats.rsvps_count || 0 }}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="apex-card p-3">
          <div class="small text-body-secondary">Posted Reviews</div>
          <div class="h3 fw-bold text-success mb-0">{{ stats.comments_count || comments.length }}</div>
        </div>
      </div>
    </div>

    <!-- Moderation Tabs -->
    <ul class="nav nav-pills gap-2 mb-4">
      <li class="nav-item">
        <button
          type="button"
          class="nav-link"
          :class="{ active: activeTab === 'users', 'bg-danger': activeTab === 'users' }"
          @click="activeTab = 'users'"
        >
          <i class="bi bi-people-fill me-1" aria-hidden="true"></i>
          Users &amp; Roles ({{ users.length }})
        </button>
      </li>
      <li class="nav-item">
        <button
          type="button"
          class="nav-link"
          :class="{ active: activeTab === 'events', 'bg-danger': activeTab === 'events' }"
          @click="activeTab = 'events'"
        >
          <i class="bi bi-calendar-range me-1" aria-hidden="true"></i>
          Events Moderation ({{ allEvents.length }})
        </button>
      </li>
      <li class="nav-item">
        <button
          type="button"
          class="nav-link"
          :class="{ active: activeTab === 'comments', 'bg-danger': activeTab === 'comments' }"
          @click="activeTab = 'comments'"
        >
          <i class="bi bi-chat-dots me-1" aria-hidden="true"></i>
          Comments &amp; Ratings ({{ comments.length }})
        </button>
      </li>
    </ul>

    <!-- Tab 1: Users & Role Control -->
    <section v-if="activeTab === 'users'" class="apex-card p-4" aria-label="User role management">
      <h2 class="h5 fw-bold mb-3">Registered Accounts &amp; Role Assignment</h2>
      <div class="table-responsive">
        <table class="table table-hover align-middle small mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Region</th>
              <th>Activity</th>
              <th>Assigned Role</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>#{{ u.id }}</td>
              <td>
                <div class="fw-bold">{{ u.name }}</div>
                <div class="text-body-secondary">{{ u.email }}</div>
              </td>
              <td>{{ u.region }}</td>
              <td>
                {{ u.rsvps_count || 0 }} RSVPs • {{ u.events_organized || 0 }} Hosted
              </td>
              <td>
                <select
                  :value="u.role"
                  class="form-select form-select-sm w-auto"
                  :aria-label="`Change role for ${u.name}`"
                  @change="handleRoleChange(u, $event.target.value)"
                >
                  <option value="member">member</option>
                  <option value="organizer">organizer</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td class="text-end">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  :disabled="Number(u.id) === Number(authStore.user?.id)"
                  @click="handleDeleteUser(u)"
                >
                  <i class="bi bi-trash" aria-hidden="true"></i> Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Tab 2: Events Moderation -->
    <section v-else-if="activeTab === 'events'" class="apex-card p-4" aria-label="Event moderation">
      <h2 class="h5 fw-bold mb-3">Global Event Moderation</h2>
      <div class="table-responsive">
        <table class="table table-hover align-middle small mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Event</th>
              <th>Organizer / Club</th>
              <th>Region</th>
              <th>Status</th>
              <th class="text-end">Moderation</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ev in allEvents" :key="ev.id">
              <td>#{{ ev.id }}</td>
              <td>
                <router-link :to="`/events/${ev.id}`" class="fw-bold text-decoration-none">
                  {{ ev.title }}
                </router-link>
                <div class="text-body-secondary">{{ ev.venue }}</div>
              </td>
              <td>{{ ev.club_name }}</td>
              <td>{{ ev.region }}</td>
              <td>
                <select
                  :value="ev.status"
                  class="form-select form-select-sm w-auto"
                  :aria-label="`Change status for ${ev.title}`"
                  @change="handleModerateEventStatus(ev, $event.target.value)"
                >
                  <option value="upcoming">upcoming</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <router-link :to="`/events/${ev.id}/edit`" class="btn btn-outline-warning">
                    Edit
                  </router-link>
                  <button
                    type="button"
                    class="btn btn-outline-danger"
                    @click="handleDeleteEvent(ev)"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Tab 3: Comments Moderation -->
    <section v-else class="apex-card p-4" aria-label="Comments moderation">
      <h2 class="h5 fw-bold mb-3">Community Comments &amp; Ratings Audit</h2>
      <div class="table-responsive">
        <table class="table table-hover align-middle small mb-0">
          <thead>
            <tr>
              <th>Author</th>
              <th>Event</th>
              <th>Comment &amp; Rating</th>
              <th>Date</th>
              <th class="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cm in comments" :key="cm.id">
              <td>
                <div class="fw-bold">{{ cm.user_name }}</div>
                <div class="text-body-secondary">{{ cm.user_email }}</div>
              </td>
              <td>
                <router-link :to="`/events/${cm.event_id}`" class="text-decoration-none">
                  {{ cm.event_title }}
                </router-link>
              </td>
              <td>
                <span v-if="cm.rating" class="badge bg-warning text-dark me-1">
                  ★ {{ cm.rating }}/5
                </span>
                {{ cm.body }}
              </td>
              <td>{{ cm.created_at }}</td>
              <td class="text-end">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  @click="handleDeleteComment(cm)"
                >
                  <i class="bi bi-trash" aria-hidden="true"></i> Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
