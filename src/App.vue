<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import ToastContainer from './components/ToastContainer.vue'
import { useOfflineEvents } from './composables/useOfflineEvents'
import { useAuthStore } from './stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { isOnline, savedEvents } = useOfflineEvents()

const accessDeniedPath = computed(() => route.query.denied || null)

function dismissDeniedBanner() {
  const nextQuery = { ...route.query }
  delete nextQuery.denied
  router.replace({ path: route.path, query: nextQuery })
}
</script>

<template>
  <div class="d-flex flex-column min-vh-100">
    <!-- Skip to main content link for keyboard/screen-reader accessibility -->
    <a
      href="#main-content"
      class="visually-hidden-focusable position-absolute top-0 start-0 m-2 btn btn-sm btn-warning z-3"
    >
      Skip to main content
    </a>

    <Navbar />

    <!-- Offline Mode PWA Telemetry Banner (Jacob's PWA Feature) -->
    <div
      v-if="!isOnline"
      class="bg-warning text-dark py-2 px-3 border-bottom border-dark-subtle"
      role="status"
      aria-live="polite"
    >
      <div class="container d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div class="small fw-semibold">
          <i class="bi bi-wifi-off me-2" aria-hidden="true"></i>
          Offline Mode Active — Serving cached data &amp; {{ savedEvents.length }} offline-pinned
          event(s) via Service Worker.
        </div>
        <router-link to="/my-events" class="btn btn-sm btn-dark">
          View Offline Saved Events ({{ savedEvents.length }})
        </router-link>
      </div>
    </div>

    <!-- Role Guard Redirect Alert -->
    <div
      v-if="accessDeniedPath"
      class="alert alert-danger rounded-0 mb-0 py-2 border-0 border-bottom"
      role="alert"
    >
      <div class="container d-flex align-items-center justify-content-between">
        <span class="small">
          <i class="bi bi-shield-lock-fill me-2" aria-hidden="true"></i>
          Access restricted: Your current role (<strong>{{ authStore.userRole }}</strong>) does not
          have permission to view <code>{{ accessDeniedPath }}</code>.
        </span>
        <button
          type="button"
          class="btn-close btn-sm"
          aria-label="Dismiss alert"
          @click="dismissDeniedBanner"
        ></button>
      </div>
    </div>

    <!-- Main Router View with Compositor-Friendly Page Transition -->
    <main id="main-content" class="flex-grow-1">
      <router-view v-slot="{ Component }">
        <transition name="apex-page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Global Toast Notification Stack -->
    <ToastContainer />

    <Footer />
  </div>
</template>
