<script setup>
/**
 * ApexGrid — Organizer Analytics Dashboard & Event Management Portal (Gibson's Chart.js Feature)
 * Uses vue-chartjs + chart.js to visualize:
 * 1. Cumulative RSVPs Over Time (Line Chart)
 * 2. Going vs Interested & Likes per Event (Bar Chart)
 * 3. Events & RSVPs Distribution by Motorsport Category (Doughnut Chart)
 */
import { ref, computed, onMounted } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Filler
)

const authStore = useAuthStore()

const statsData = ref({
  events: [],
  rsvp_timeline: [],
  category_breakdown: [],
  summary: {
    total_events: 0,
    total_going: 0,
    total_interested: 0,
    total_likes: 0,
    avg_capacity_pct: 0
  }
})
const scopeAll = ref(true)
const loading = ref(true)
const feedback = ref('')

async function loadDashboard() {
  loading.value = true
  try {
    const res = await api.get('/dashboard/stats', {
      scope: scopeAll.value ? 'all' : 'mine'
    })
    statsData.value = res
  } finally {
    loading.value = false
  }
}

// 1. Line Chart Data: Cumulative RSVPs Over Time
const lineChartData = computed(() => {
  const timeline = statsData.value.rsvp_timeline || []
  return {
    labels: timeline.map((pt) => pt.date),
    datasets: [
      {
        label: 'Cumulative Going RSVPs',
        data: timeline.map((pt) => pt.going),
        borderColor: '#e63946',
        backgroundColor: 'rgba(230, 57, 70, 0.2)',
        fill: true,
        tension: 0.35
      },
      {
        label: 'Cumulative Interested Watchlist',
        data: timeline.map((pt) => pt.interested),
        borderColor: '#f4a261',
        backgroundColor: 'rgba(244, 162, 97, 0.15)',
        fill: true,
        tension: 0.35
      }
    ]
  }
})

// 2. Bar Chart Data: RSVPs & Likes per Event
const barChartData = computed(() => {
  const evs = (statsData.value.events || []).slice(0, 8)
  return {
    labels: evs.map((e) => (e.title.length > 22 ? `${e.title.slice(0, 22)}...` : e.title)),
    datasets: [
      {
        label: 'Going RSVPs',
        backgroundColor: '#e63946',
        data: evs.map((e) => e.going_count || 0)
      },
      {
        label: 'Interested',
        backgroundColor: '#f4a261',
        data: evs.map((e) => e.interested_count || 0)
      },
      {
        label: 'Likes',
        backgroundColor: '#0dcaf0',
        data: evs.map((e) => e.likes_count || 0)
      }
    ]
  }
})

// 3. Doughnut Chart Data: RSVPs by Discipline Category
const doughnutChartData = computed(() => {
  const cats = statsData.value.category_breakdown || []
  return {
    labels: cats.map((c) => c.category),
    datasets: [
      {
        backgroundColor: ['#e63946', '#f4a261', '#0dcaf0', '#3b82f6', '#198754', '#a855f7'],
        data: cats.map((c) => Math.max(1, c.rsvps_count || c.events_count))
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#9ca3af'
      }
    }
  },
  scales: {
    x: {
      ticks: { color: '#9ca3af' },
      grid: { color: 'rgba(255,255,255,0.06)' }
    },
    y: {
      beginAtZero: true,
      ticks: { color: '#9ca3af', precision: 0 },
      grid: { color: 'rgba(255,255,255,0.06)' }
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#9ca3af' }
    }
  }
}

async function updateEventStatus(ev, newStatus) {
  await api.put(`/events/${ev.id}`, { ...ev, status: newStatus })
  feedback.value = `Event "${ev.title}" marked as ${newStatus.toUpperCase()}.`
  await loadDashboard()
}

async function deleteEvent(ev) {
  if (
    typeof window !== 'undefined' &&
    window.confirm(`Delete "${ev.title}" permanently?`)
  ) {
    await api.delete(`/events/${ev.id}`)
    feedback.value = `Event "${ev.title}" deleted.`
    await loadDashboard()
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <div class="container py-4">
    <!-- Dashboard Header -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div>
        <span class="badge bg-warning text-dark mb-1">
          <i class="bi bi-bar-chart-fill me-1" aria-hidden="true"></i>
          Organizer Telemetry &amp; Chart.js Analytics Portal
        </span>
        <h1 class="h3 fw-bold mb-1">Organizer Analytics Dashboard</h1>
        <p class="text-body-secondary small mb-0">
          Real-time RSVP growth, discipline popularity, capacity utilization, and event CRUD management
        </p>
      </div>

      <div class="d-flex flex-wrap align-items-center gap-2">
        <div class="btn-group btn-group-sm" role="group" aria-label="Analytics scope">
          <button
            type="button"
            class="btn"
            :class="scopeAll ? 'btn-apex' : 'btn-outline-secondary'"
            @click="scopeAll = true; loadDashboard()"
          >
            All Platform Events
          </button>
          <button
            type="button"
            class="btn"
            :class="!scopeAll ? 'btn-apex' : 'btn-outline-secondary'"
            @click="scopeAll = false; loadDashboard()"
          >
            My Hosted Events ({{ authStore.user?.name }})
          </button>
        </div>

        <router-link to="/events/new" class="btn btn-sm btn-apex">
          <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Host New Event
        </router-link>
      </div>
    </div>

    <div v-if="feedback" class="alert alert-success py-2 small">{{ feedback }}</div>

    <!-- KPI Telemetry Cards -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-lg-3">
        <div class="apex-card p-3">
          <div class="small text-body-secondary">Tracked Events</div>
          <div class="h2 fw-bold text-danger mb-0">{{ statsData.summary?.total_events || 0 }}</div>
          <div class="small text-body-secondary">AU &amp; MY Circuits</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="apex-card p-3">
          <div class="small text-body-secondary">Confirmed "Going" RSVPs</div>
          <div class="h2 fw-bold text-warning mb-0">{{ statsData.summary?.total_going || 0 }}</div>
          <div class="small text-body-secondary">
            +{{ statsData.summary?.total_interested || 0 }} Interested
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="apex-card p-3">
          <div class="small text-body-secondary">Community Likes</div>
          <div class="h2 fw-bold text-info mb-0">{{ statsData.summary?.total_likes || 0 }}</div>
          <div class="small text-body-secondary">Total Event Hearts</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="apex-card p-3">
          <div class="small text-body-secondary">Avg Grid Capacity Fill</div>
          <div class="h2 fw-bold text-success mb-0">
            {{ statsData.summary?.avg_capacity_pct || 0 }}%
          </div>
          <div class="small text-body-secondary">Across Active Sessions</div>
        </div>
      </div>
    </div>

    <!-- Chart.js Visualizations Row -->
    <div class="row g-4 mb-4">
      <!-- Chart 1: RSVPs Over Time Line Chart -->
      <div class="col-12 col-lg-7">
        <div class="apex-card p-4 h-100">
          <h2 class="h6 fw-bold text-uppercase mb-3">
            <i class="bi bi-graph-up text-danger me-2" aria-hidden="true"></i>
            Cumulative RSVPs Over Time (Going vs Interested)
          </h2>
          <div style="height: 270px">
            <Line :data="lineChartData" :options="chartOptions" />
          </div>
        </div>
      </div>

      <!-- Chart 2: Discipline Breakdown Doughnut -->
      <div class="col-12 col-lg-5">
        <div class="apex-card p-4 h-100">
          <h2 class="h6 fw-bold text-uppercase mb-3">
            <i class="bi bi-pie-chart-fill text-warning me-2" aria-hidden="true"></i>
            Engagement by Motorsport Discipline
          </h2>
          <div style="height: 270px">
            <Doughnut :data="doughnutChartData" :options="doughnutOptions" />
          </div>
        </div>
      </div>

      <!-- Chart 3: Event-by-Event Bar Comparison -->
      <div class="col-12">
        <div class="apex-card p-4">
          <h2 class="h6 fw-bold text-uppercase mb-3">
            <i class="bi bi-bar-chart-steps text-info me-2" aria-hidden="true"></i>
            Event Comparison — Going RSVPs, Interested Watchlist &amp; Likes
          </h2>
          <div style="height: 280px">
            <Bar :data="barChartData" :options="chartOptions" />
          </div>
        </div>
      </div>
    </div>

    <!-- Organizer Event CRUD Management Table -->
    <section class="apex-card p-4" aria-label="Organizer event management table">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h2 class="h5 fw-bold mb-0">
          <i class="bi bi-table text-danger me-2" aria-hidden="true"></i>
          Event Roster &amp; Quick Status Control
        </h2>
        <router-link to="/events/new" class="btn btn-sm btn-outline-light">
          + Create Event
        </router-link>
      </div>

      <div class="table-responsive">
        <table class="table table-hover align-middle small mb-0">
          <thead>
            <tr>
              <th>Event Title</th>
              <th>Discipline</th>
              <th>Region &amp; Venue</th>
              <th>Date</th>
              <th>RSVPs / Cap</th>
              <th>Status</th>
              <th class="text-end">Organizer Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ev in statsData.events" :key="ev.id">
              <td class="fw-semibold">
                <router-link :to="`/events/${ev.id}`" class="text-decoration-none text-body">
                  {{ ev.title }}
                </router-link>
              </td>
              <td>
                <span class="badge" :class="`bg-${ev.badge_color || 'danger'}`">
                  {{ ev.category_name }}
                </span>
              </td>
              <td>
                <span class="badge bg-secondary me-1">{{ ev.region === 'Malaysia' ? 'MY' : 'AU' }}</span>
                {{ ev.venue }}
              </td>
              <td>{{ String(ev.start_datetime).slice(0, 16) }}</td>
              <td>
                <strong>{{ ev.going_count }}</strong> / {{ ev.capacity }}
                <span class="text-body-secondary">(+{{ ev.interested_count }} int)</span>
              </td>
              <td>
                <span
                  class="badge text-uppercase"
                  :class="{
                    'bg-success': ev.status === 'upcoming',
                    'bg-secondary': ev.status === 'completed',
                    'bg-danger': ev.status === 'cancelled'
                  }"
                >
                  {{ ev.status }}
                </span>
              </td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <router-link
                    :to="`/events/${ev.id}/edit`"
                    class="btn btn-outline-warning"
                    title="Edit Event"
                  >
                    <i class="bi bi-pencil" aria-hidden="true"></i>
                  </router-link>
                  <button
                    v-if="ev.status !== 'cancelled'"
                    type="button"
                    class="btn btn-outline-secondary"
                    title="Mark Cancelled"
                    @click="updateEventStatus(ev, 'cancelled')"
                  >
                    Cancel
                  </button>
                  <button
                    v-else
                    type="button"
                    class="btn btn-outline-success"
                    title="Re-activate as Upcoming"
                    @click="updateEventStatus(ev, 'upcoming')"
                  >
                    Reopen
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-danger"
                    title="Delete Event"
                    @click="deleteEvent(ev)"
                  >
                    <i class="bi bi-trash" aria-hidden="true"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
