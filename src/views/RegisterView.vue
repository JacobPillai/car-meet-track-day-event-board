<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'member',
  region: 'Australia',
  bio: ''
})

const validationError = ref('')

async function handleRegister() {
  validationError.value = ''
  if (form.password !== form.confirmPassword) {
    validationError.value = 'Passwords do not match. Please verify both password fields.'
    showToast(validationError.value, 'warning')
    return
  }

  try {
    const user = await authStore.register({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      region: form.region,
      bio: form.bio
    })
    showToast(`Account created! Welcome to ApexGrid, ${user.name}.`, 'success')
    router.push(authStore.roleHomeRoute)
  } catch (err) {
    validationError.value = err.message || 'Registration failed.'
  }
}
</script>

<template>
  <div class="container py-4 py-lg-5">
    <div class="apex-card overflow-hidden shadow-lg">
      <div class="row g-0">
        <!-- Left Visual Telemetry Sidebar -->
        <div class="col-12 col-lg-4 apex-auth-visual p-4 p-md-5 d-flex flex-column justify-content-between">
          <div>
            <span class="badge bg-danger px-3 py-2 mb-3 text-uppercase">
              <i class="bi bi-flag-fill me-1" aria-hidden="true"></i>Season 2026 License
            </span>
            <h2 class="h3 fw-bold text-white mb-3">
              Register Your Driver or Organizer License
            </h2>
            <p class="small text-light opacity-75 mb-4">
              Choose between a <strong>Member Pass</strong> for attending meets and track days, or
              an <strong>Organizer License</strong> to publish sanctioned events across Victoria (AU)
              and Malaysia (MY).
            </p>

            <ul class="list-unstyled small d-flex flex-column gap-3 text-light opacity-90">
              <li class="d-flex gap-2">
                <i class="bi bi-check-circle-fill text-danger mt-1" aria-hidden="true"></i>
                <span>Unlock private paddock gate addresses &amp; Clerk of Course contacts</span>
              </li>
              <li class="d-flex gap-2">
                <i class="bi bi-check-circle-fill text-warning mt-1" aria-hidden="true"></i>
                <span>Pin track days to your Offline PWA Vault for remote circuits</span>
              </li>
              <li class="d-flex gap-2">
                <i class="bi bi-check-circle-fill text-info mt-1" aria-hidden="true"></i>
                <span>Publish events &amp; monitor live Chart.js RSVP capacity telemetry</span>
              </li>
            </ul>
          </div>

          <div class="pt-4 mt-4 border-top border-secondary border-opacity-50 small text-secondary font-monospace">
            COS30043 • WCAG 2.1 AA COMPLIANT FORMS
          </div>
        </div>

        <!-- Right Registration Form -->
        <div class="col-12 col-lg-8 p-4 p-md-5">
          <div class="mb-4">
            <span class="badge bg-danger px-3 py-2 mb-2">
              <i class="bi bi-person-plus-fill me-1" aria-hidden="true"></i>New Account Registration
            </span>
            <h1 class="h3 fw-bold mb-1">Join the ApexGrid Community</h1>
            <p class="text-body-secondary small mb-0">
              Create a <strong>Member</strong> account to RSVP and unlock venue details, or an
              <strong>Organizer</strong> account to host events and view analytics.
            </p>
          </div>

          <div
            v-if="validationError || authStore.error"
            class="alert alert-danger py-2 small"
            role="alert"
          >
            <i class="bi bi-exclamation-triangle-fill me-1" aria-hidden="true"></i>
            {{ validationError || authStore.error }}
          </div>

          <form @submit.prevent="handleRegister">
            <!-- Account Role Selector -->
            <div class="mb-3">
              <label class="form-label small fw-semibold d-block">Select Account Type *</label>
              <div class="row g-2">
                <div class="col-12 col-sm-6">
                  <input
                    id="role-member"
                    v-model="form.role"
                    type="radio"
                    class="btn-check"
                    name="account-role"
                    value="member"
                  />
                  <label class="btn btn-outline-info w-100 text-start p-3" for="role-member">
                    <div class="fw-bold"><i class="bi bi-person-check me-1"></i>Member Pass</div>
                    <div class="small opacity-75">RSVP, comment, rate &amp; unlock addresses</div>
                  </label>
                </div>

                <div class="col-12 col-sm-6">
                  <input
                    id="role-organizer"
                    v-model="form.role"
                    type="radio"
                    class="btn-check"
                    name="account-role"
                    value="organizer"
                  />
                  <label class="btn btn-outline-warning w-100 text-start p-3" for="role-organizer">
                    <div class="fw-bold"><i class="bi bi-flag me-1"></i>Organizer License</div>
                    <div class="small opacity-75">Create/edit events, clubs &amp; view analytics</div>
                  </label>
                </div>
              </div>
            </div>

            <div class="row g-3">
              <div class="col-12 col-md-7 apex-field">
                <label for="reg-name" class="form-label small fw-semibold mb-0">Full Name *</label>
                <span id="reg-name-hint" class="field-hint">Min 3 characters</span>
                <input
                  id="reg-name"
                  v-model="form.name"
                  type="text"
                  class="form-control"
                  required
                  minlength="3"
                  autocomplete="name"
                  aria-describedby="reg-name-hint"
                  aria-errormessage="reg-name-error"
                  placeholder="Alex Mercer"
                />
                <div id="reg-name-error" class="error-msg">
                  <span aria-hidden="true">❌</span> Please enter your full name (at least 3 characters).
                </div>
              </div>

              <div class="col-12 col-md-5 apex-field">
                <label for="reg-region" class="form-label small fw-semibold mb-0">Home Region *</label>
                <span class="field-hint">Sets default map &amp; distance hub</span>
                <select id="reg-region" v-model="form.region" class="form-select" required>
                  <option value="Australia">Australia (VIC)</option>
                  <option value="Malaysia">Malaysia (MY)</option>
                </select>
              </div>

              <div class="col-12 apex-field">
                <label for="reg-email" class="form-label small fw-semibold mb-0">Email Address *</label>
                <span id="reg-email-hint" class="field-hint">Format: driver@example.com</span>
                <input
                  id="reg-email"
                  v-model="form.email"
                  type="email"
                  class="form-control"
                  required
                  autocomplete="email"
                  aria-describedby="reg-email-hint"
                  aria-errormessage="reg-email-error"
                  placeholder="driver@example.com"
                />
                <div id="reg-email-error" class="error-msg">
                  <span aria-hidden="true">❌</span> Please enter a valid email address.
                </div>
              </div>

              <!-- Password with complexity rules above input (Modern Web Guidance) -->
              <div class="col-12 col-md-6 apex-field">
                <label for="reg-password" class="form-label small fw-semibold mb-0">
                  Password *
                </label>
                <ul id="reg-password-rules" class="rules-list small ps-3 mb-1 field-hint">
                  <li>At least 8 characters</li>
                  <li>At least one uppercase &amp; lowercase letter</li>
                  <li>At least one number</li>
                </ul>
                <input
                  id="reg-password"
                  v-model="form.password"
                  type="password"
                  class="form-control"
                  required
                  minlength="8"
                  pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                  autocomplete="new-password"
                  aria-describedby="reg-password-rules"
                  aria-errormessage="reg-password-error"
                  placeholder="Min 8 chars (Aa1...)"
                />
                <div id="reg-password-error" class="error-msg">
                  <span aria-hidden="true">❌</span> Must contain 8+ chars, uppercase, lowercase, and a number.
                </div>
              </div>

              <div class="col-12 col-md-6 apex-field">
                <label for="reg-confirm" class="form-label small fw-semibold mb-0">
                  Confirm Password *
                </label>
                <span id="reg-confirm-hint" class="field-hint">Re-enter the same password</span>
                <input
                  id="reg-confirm"
                  v-model="form.confirmPassword"
                  type="password"
                  class="form-control"
                  required
                  minlength="8"
                  autocomplete="new-password"
                  aria-describedby="reg-confirm-hint"
                  placeholder="Repeat password"
                />
              </div>

              <div class="col-12">
                <label for="reg-bio" class="form-label small fw-semibold">
                  Car Build / Motorsport Bio (Optional)
                </label>
                <input
                  id="reg-bio"
                  v-model="form.bio"
                  type="text"
                  class="form-control"
                  placeholder="e.g. Honda Civic Type R FL5 track build • Regular at Sandown & Sepang"
                />
              </div>
            </div>

            <div class="d-grid mt-4 mb-3">
              <button
                type="submit"
                class="btn btn-apex py-2"
                :disabled="authStore.loading"
              >
                Create {{ form.role === 'organizer' ? 'Organizer' : 'Member' }} Account
              </button>
            </div>
          </form>

          <div class="text-center small text-body-secondary border-top pt-3">
            Already registered?
            <router-link to="/login" class="text-danger fw-semibold text-decoration-none">
              Sign in here
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
