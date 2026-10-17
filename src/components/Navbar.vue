<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'
import { useOfflineEvents } from '../composables/useOfflineEvents'
import { useToast } from '../composables/useToast'
import CommandSearchModal from './CommandSearchModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const { isOnline, savedEvents } = useOfflineEvents()
const { showToast } = useToast()

const searchOpen = ref(false)

function handleLogout() {
  authStore.logout()
  showToast('Signed out of your account.', 'info')
  router.push('/login')
}

function handleGlobalShortcut(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchOpen.value = !searchOpen.value
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalShortcut)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalShortcut)
})
</script>

<template>
  <header class="sticky-top apex-navbar-glass">
    <div class="apex-kerb-strip" aria-hidden="true"></div>
    <nav class="navbar navbar-expand-lg py-2" aria-label="Primary Navigation">
      <div class="container">
        <!-- Brand -->
        <router-link class="navbar-brand d-flex align-items-center gap-2 fw-bold font-display" to="/">
          <span
            class="d-inline-flex align-items-center justify-content-center rounded-3 bg-danger text-white px-2 py-1 shadow-sm"
            aria-hidden="true"
          >
            <i class="bi bi-speedometer2"></i>
          </span>
          <span class="fs-5 tracking-tight">
            APEX<span class="text-danger">GRID</span>
          </span>
          <span class="badge apex-badge-accent ms-1 d-none d-sm-inline-block font-mono" style="font-size: 0.7rem">
            AU • MY
          </span>
        </router-link>

        <!-- Mobile Right Quick Actions -->
        <div class="d-flex align-items-center gap-2 d-lg-none">
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            aria-label="Open quick search"
            @click="searchOpen = true"
          >
            <i class="bi bi-search" aria-hidden="true"></i>
          </button>
          <button
            class="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#apexNavbar"
            aria-controls="apexNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation menu"
          >
            <span class="navbar-toggler-icon"></span>
          </button>
        </div>

        <!-- Nav Links -->
        <div id="apexNavbar" class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0 gap-lg-1">
            <li class="nav-item">
              <router-link class="nav-link" to="/" exact-active-class="active fw-semibold">
                <i class="bi bi-house-door me-1" aria-hidden="true"></i>Home
              </router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/events" active-class="active fw-semibold">
                <i class="bi bi-flag me-1" aria-hidden="true"></i>Events
              </router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/explore" active-class="active fw-semibold">
                <i class="bi bi-geo-alt me-1" aria-hidden="true"></i>Map &amp; Calendar
              </router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/clubs" active-class="active fw-semibold">
                <i class="bi bi-shield-check me-1" aria-hidden="true"></i>Clubs
              </router-link>
            </li>

            <!-- Member / Authenticated Portal Link -->
            <li v-if="authStore.isAuthenticated" class="nav-item">
              <router-link class="nav-link" to="/my-events" active-class="active fw-semibold">
                <i class="bi bi-bookmark-star me-1" aria-hidden="true"></i>My Vault
                <span
                  v-if="savedEvents.length > 0"
                  class="badge rounded-pill bg-warning text-dark font-mono ms-1"
                  :title="`${savedEvents.length} events saved for offline PWA access`"
                >
                  {{ savedEvents.length }}
                </span>
              </router-link>
            </li>

            <!-- Organizer Portal Links -->
            <li v-if="authStore.isOrganizer" class="nav-item">
              <router-link class="nav-link" to="/dashboard" active-class="active fw-semibold">
                <i class="bi bi-bar-chart-line me-1 text-warning" aria-hidden="true"></i>Telemetry
              </router-link>
            </li>
            <li v-if="authStore.isOrganizer" class="nav-item">
              <router-link class="nav-link" to="/events/new" active-class="active fw-semibold">
                <i class="bi bi-plus-circle me-1 text-danger" aria-hidden="true"></i>Host Event
              </router-link>
            </li>

            <!-- Admin Portal Link -->
            <li v-if="authStore.isAdmin" class="nav-item">
              <router-link class="nav-link" to="/admin" active-class="active fw-semibold">
                <i class="bi bi-sliders me-1 text-info" aria-hidden="true"></i>Admin
              </router-link>
            </li>
          </ul>

          <!-- Right Actions: Ctrl+K Search, PWA Status, Theme Switcher, Auth Controls -->
          <div class="d-flex flex-wrap align-items-center gap-2">
            <!-- Command Search Trigger Button -->
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary d-none d-lg-inline-flex align-items-center gap-2 px-2.5"
              title="Quick jump to any circuit, event, or club (Ctrl+K)"
              @click="searchOpen = true"
            >
              <i class="bi bi-search text-danger" aria-hidden="true"></i>
              <span class="small text-body-secondary">Quick Jump...</span>
              <kbd class="badge bg-secondary-subtle text-body-secondary font-mono border">Ctrl K</kbd>
            </button>

            <!-- Network / PWA Status Pill -->
            <span
              class="badge rounded-pill d-inline-flex align-items-center gap-1 py-2 px-2 font-mono"
              :class="isOnline ? 'bg-success-subtle text-success-emphasis' : 'bg-warning text-dark'"
              :title="isOnline ? 'PWA Connected & Service Worker Ready' : 'Offline Mode Active'"
              style="font-size: 0.72rem"
            >
              <span v-if="isOnline" class="live-dot me-1" aria-hidden="true"></span>
              <i v-else class="bi bi-wifi-off me-1" aria-hidden="true"></i>
              <span class="d-none d-xl-inline">{{ isOnline ? 'PWA LIVE' : 'OFFLINE' }}</span>
            </span>

            <!-- Accessible Dark / Light Theme Toggle -->
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              :aria-label="
                themeStore.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
              "
              :title="
                themeStore.theme === 'dark' ? 'Switch to Daylight Paddock Mode' : 'Switch to Night-Run Carbon Mode'
              "
              @click="themeStore.toggleTheme()"
            >
              <i
                :class="themeStore.theme === 'dark' ? 'bi bi-sun-fill text-warning' : 'bi bi-moon-stars-fill'"
                aria-hidden="true"
              ></i>
            </button>

            <!-- Guest Account Buttons -->
            <template v-if="authStore.isGuest">
              <router-link to="/login" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-box-arrow-in-right me-1" aria-hidden="true"></i>Sign In
              </router-link>
              <router-link to="/register" class="btn btn-sm btn-apex">
                <i class="bi bi-person-plus me-1" aria-hidden="true"></i>Register
              </router-link>
            </template>

            <!-- Logged-in Account Menu -->
            <template v-else>
              <div class="dropdown">
                <button
                  id="userAccountDropdown"
                  class="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <img
                    v-if="authStore.user?.avatar"
                    :src="authStore.user.avatar"
                    :alt="authStore.user.name"
                    width="22"
                    height="22"
                    class="rounded-circle object-fit-cover"
                  />
                  <span class="fw-semibold">{{ authStore.user?.name }}</span>
                  <span
                    class="badge text-uppercase font-mono"
                    :class="{
                      'bg-danger': authStore.userRole === 'admin',
                      'bg-warning text-dark': authStore.userRole === 'organizer',
                      'bg-info text-dark': authStore.userRole === 'member'
                    }"
                  >
                    {{ authStore.userRole }}
                  </span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-lg" aria-labelledby="userAccountDropdown">
                  <li class="px-3 py-2 border-bottom small">
                    <div class="fw-bold">{{ authStore.user?.name }}</div>
                    <div class="text-body-secondary font-mono" style="font-size: 0.75rem">
                      {{ authStore.user?.email }}
                    </div>
                  </li>
                  <li>
                    <router-link class="dropdown-item" to="/profile">
                      <i class="bi bi-person-gear me-2" aria-hidden="true"></i>Profile &amp; Garage
                    </router-link>
                  </li>
                  <li>
                    <router-link class="dropdown-item" to="/my-events">
                      <i class="bi bi-calendar2-check me-2" aria-hidden="true"></i>My RSVPs &amp; Offline Vault
                    </router-link>
                  </li>
                  <li v-if="authStore.isOrganizer">
                    <router-link class="dropdown-item" to="/dashboard">
                      <i class="bi bi-graph-up-arrow me-2 text-warning" aria-hidden="true"></i>Organizer Analytics
                    </router-link>
                  </li>
                  <li v-if="authStore.isOrganizer">
                    <router-link class="dropdown-item" to="/events/new">
                      <i class="bi bi-plus-square me-2 text-danger" aria-hidden="true"></i>Host New Event
                    </router-link>
                  </li>
                  <li v-if="authStore.isAdmin">
                    <router-link class="dropdown-item" to="/admin">
                      <i class="bi bi-shield-lock me-2 text-info" aria-hidden="true"></i>Admin Moderation Panel
                    </router-link>
                  </li>
                  <li><hr class="dropdown-divider" /></li>
                  <li>
                    <button type="button" class="dropdown-item text-danger" @click="handleLogout">
                      <i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i>Sign Out
                    </button>
                  </li>
                </ul>
              </div>
            </template>
          </div>
        </div>
      </div>
    </nav>
  </header>

  <!-- Mobile PWA Bottom Navigation Dock -->
  <nav
    class="d-lg-none fixed-bottom apex-navbar-glass border-top py-1 px-2"
    style="z-index: 1040"
    aria-label="Mobile quick navigation"
  >
    <div class="d-flex justify-content-around align-items-center text-center">
      <router-link to="/" class="text-decoration-none text-body-secondary py-1 px-2 small" exact-active-class="text-danger fw-bold">
        <i class="bi bi-house-door d-block fs-5" aria-hidden="true"></i>
        <span style="font-size: 0.68rem">Home</span>
      </router-link>
      <router-link to="/events" class="text-decoration-none text-body-secondary py-1 px-2 small" active-class="text-danger fw-bold">
        <i class="bi bi-flag d-block fs-5" aria-hidden="true"></i>
        <span style="font-size: 0.68rem">Events</span>
      </router-link>
      <router-link to="/explore" class="text-decoration-none text-body-secondary py-1 px-2 small" active-class="text-danger fw-bold">
        <i class="bi bi-geo-alt d-block fs-5" aria-hidden="true"></i>
        <span style="font-size: 0.68rem">Map/Cal</span>
      </router-link>
      <router-link to="/clubs" class="text-decoration-none text-body-secondary py-1 px-2 small" active-class="text-danger fw-bold">
        <i class="bi bi-shield-check d-block fs-5" aria-hidden="true"></i>
        <span style="font-size: 0.68rem">Clubs</span>
      </router-link>
      <router-link
        :to="authStore.isAuthenticated ? authStore.roleHomeRoute : '/login'"
        class="text-decoration-none text-body-secondary py-1 px-2 small"
        active-class="text-danger fw-bold"
      >
        <i
          :class="[authStore.isAuthenticated ? 'bi-person-check-fill' : 'bi-box-arrow-in-right', 'd-block fs-5']"
          aria-hidden="true"
        ></i>
        <span style="font-size: 0.68rem">{{ authStore.isAuthenticated ? 'Portal' : 'Sign In' }}</span>
      </router-link>
    </div>
  </nav>

  <!-- Command Palette Search Modal -->
  <CommandSearchModal :open="searchOpen" @close="searchOpen = false" />
</template>
