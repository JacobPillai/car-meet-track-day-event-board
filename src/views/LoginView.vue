<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../composables/useToast'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const email = ref('')
const password = ref('')
const showCredentialsHelp = ref(true)

function fillSeedAccount(seedEmail) {
  email.value = seedEmail
  password.value = 'Password123!'
  showToast(`Filled credentials for ${seedEmail}`, 'info', 2200)
}

async function handleSubmit() {
  try {
    const user = await authStore.login(email.value, password.value)
    showToast(`Welcome back, ${user.name} (${user.role.toUpperCase()})!`, 'success')
    const redirectPath = route.query.redirect || authStore.roleHomeRoute
    router.push(String(redirectPath))
  } catch {
    // error is stored in authStore.error
  }
}
</script>

<template>
  <div class="container py-4 py-lg-5">
    <div class="apex-card overflow-hidden shadow-lg">
      <div class="row g-0">
        <!-- Left Split Visual Panel (Motorsport Telemetry Showcase) -->
        <div class="col-12 col-lg-5 apex-auth-visual p-4 p-md-5 d-flex flex-column justify-content-between">
          <div>
            <div class="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-danger bg-opacity-25 border border-danger border-opacity-50 text-uppercase small fw-bold mb-3">
              <span class="live-dot" aria-hidden="true"></span>
              <span>Paddock Access Control</span>
            </div>
            <h2 class="h3 fw-bold text-white mb-3">
              Enter the <span class="text-danger">ApexGrid</span> Telemetry Network
            </h2>
            <p class="small text-light opacity-75 mb-4">
              Authenticate your driver, club organizer, or race control credentials to unlock
              restricted gate addresses, RSVP capacity telemetry, and analytics dashboards.
            </p>

            <div class="d-flex flex-column gap-3 small">
              <div class="p-3 rounded-3 bg-black bg-opacity-50 border border-secondary border-opacity-50">
                <div class="fw-bold text-info mb-1">
                  <i class="bi bi-person-check-fill me-1" aria-hidden="true"></i>Member Portal (`/my-events`)
                </div>
                <div class="text-light opacity-75">
                  Unlock private meet gate addresses, RSVP Going/Interested, rate completed track days, and pin events to your Offline PWA Vault.
                </div>
              </div>

              <div class="p-3 rounded-3 bg-black bg-opacity-50 border border-secondary border-opacity-50">
                <div class="fw-bold text-warning mb-1">
                  <i class="bi bi-bar-chart-line-fill me-1" aria-hidden="true"></i>Organizer Portal (`/dashboard`)
                </div>
                <div class="text-light opacity-75">
                  Host sanctioned track days or meets, manage club rosters, and inspect Chart.js RSVP &amp; capacity utilization telemetry.
                </div>
              </div>

              <div class="p-3 rounded-3 bg-black bg-opacity-50 border border-secondary border-opacity-50">
                <div class="fw-bold text-danger mb-1">
                  <i class="bi bi-shield-lock-fill me-1" aria-hidden="true"></i>Admin Control (`/admin`)
                </div>
                <div class="text-light opacity-75">
                  Audit registered accounts, promote/demote Organizer privileges, and moderate platform-wide events and reviews.
                </div>
              </div>
            </div>
          </div>

          <div class="pt-4 mt-4 border-top border-secondary border-opacity-50 small text-secondary font-monospace d-flex justify-content-between">
            <span>HUBS: MELBOURNE (AU) • SEPANG (MY)</span>
            <span>JWT HMAC-SHA256</span>
          </div>
        </div>

        <!-- Right Form Column -->
        <div class="col-12 col-lg-7 p-4 p-md-5">
          <div class="mb-4">
            <span class="badge bg-danger px-3 py-2 mb-2">
              <i class="bi bi-key-fill me-1" aria-hidden="true"></i>Driver &amp; Organizer Sign In
            </span>
            <h1 class="h3 fw-bold mb-1">Sign In to Your Account</h1>
            <p class="text-body-secondary small mb-0">
              Enter your registered email and password below, or click a test account pill to pre-fill.
            </p>
          </div>

          <div
            v-if="route.query.notice === 'auth_required'"
            class="alert alert-warning py-2 small"
            role="alert"
          >
            <i class="bi bi-info-circle-fill me-1" aria-hidden="true"></i>
            Please sign in to access that protected role portal.
          </div>

          <div
            v-if="authStore.error"
            class="alert alert-danger py-2 small"
            role="alert"
          >
            <i class="bi bi-exclamation-octagon-fill me-1" aria-hidden="true"></i>
            {{ authStore.error }}
          </div>

          <form @submit.prevent="handleSubmit">
            <div class="mb-3 apex-field">
              <label for="login-email" class="form-label small fw-semibold mb-0">
                Email Address *
              </label>
              <span id="login-email-hint" class="field-hint">
                Format: driver@apexgrid.com
              </span>
              <input
                id="login-email"
                v-model="email"
                type="email"
                name="email"
                class="form-control"
                required
                autocomplete="email"
                aria-describedby="login-email-hint"
                aria-errormessage="login-email-error"
                placeholder="you@apexgrid.com"
              />
              <div id="login-email-error" class="error-msg">
                <span aria-hidden="true">❌</span> Please enter a valid email address.
              </div>
            </div>

            <div class="mb-4 apex-field">
              <label for="login-password" class="form-label small fw-semibold mb-0">
                Password *
              </label>
              <span id="login-password-hint" class="field-hint">
                Enter your account password (min 6 characters)
              </span>
              <input
                id="login-password"
                v-model="password"
                type="password"
                name="password"
                class="form-control"
                required
                minlength="6"
                autocomplete="current-password"
                aria-describedby="login-password-hint"
                aria-errormessage="login-password-error"
                placeholder="••••••••••••"
              />
              <div id="login-password-error" class="error-msg">
                <span aria-hidden="true">❌</span> Password must be at least 6 characters.
              </div>
            </div>

            <div class="d-grid mb-3">
              <button
                type="submit"
                class="btn btn-apex py-2"
                :disabled="authStore.loading"
              >
                <span
                  v-if="authStore.loading"
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Sign In to Account Portal
              </button>
            </div>
          </form>

          <div class="text-center small text-body-secondary border-top pt-3">
            Don't have an account yet?
            <router-link to="/register" class="text-danger fw-semibold text-decoration-none">
              Register as a Member or Event Organizer
            </router-link>
          </div>

          <!-- Seeded Accounts Quick-Fill & Reference Table for Marking -->
          <div class="mt-3 pt-3 border-top">
            <button
              type="button"
              class="btn btn-sm btn-link text-body-secondary text-decoration-none w-100 d-flex justify-content-between align-items-center px-0"
              :aria-expanded="showCredentialsHelp"
              @click="showCredentialsHelp = !showCredentialsHelp"
            >
              <span class="small fw-semibold">
                <i class="bi bi-lightning-charge-fill me-1 text-warning" aria-hidden="true"></i>
                Quick-Fill Seeded Test Accounts (Password: <code>Password123!</code>)
              </span>
              <i :class="showCredentialsHelp ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
            </button>

            <div v-if="showCredentialsHelp" class="mt-2 p-3 rounded-3 border small" style="background-color: var(--apex-bg-elevated)">
              <div class="d-flex flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-info"
                  @click="fillSeedAccount('member@apexgrid.com')"
                >
                  Fill Member (Gibson)
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-warning"
                  @click="fillSeedAccount('organizer@apexgrid.com')"
                >
                  Fill Organizer AU (Syed)
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-warning"
                  @click="fillSeedAccount('naveed@apexgrid.com')"
                >
                  Fill Organizer MY (Naveed)
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  @click="fillSeedAccount('admin@apexgrid.com')"
                >
                  Fill Admin (Jacob)
                </button>
              </div>

              <div class="table-responsive">
                <table class="table table-sm mb-0 align-middle" style="font-size: 0.76rem">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Email</th>
                      <th>Default Portal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span class="badge bg-info text-dark">Member</span></td>
                      <td><code>member@apexgrid.com</code></td>
                      <td><code>/my-events</code></td>
                    </tr>
                    <tr>
                      <td><span class="badge bg-warning text-dark">Organizer (AU)</span></td>
                      <td><code>organizer@apexgrid.com</code></td>
                      <td><code>/dashboard</code></td>
                    </tr>
                    <tr>
                      <td><span class="badge bg-warning text-dark">Organizer (MY)</span></td>
                      <td><code>naveed@apexgrid.com</code></td>
                      <td><code>/dashboard</code></td>
                    </tr>
                    <tr>
                      <td><span class="badge bg-danger">Admin</span></td>
                      <td><code>admin@apexgrid.com</code></td>
                      <td><code>/admin</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
