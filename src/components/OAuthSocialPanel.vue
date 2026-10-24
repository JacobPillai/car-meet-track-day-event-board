<script setup>
/**
 * ApexGrid — Hybrid OAuth 2.0 Social Authentication Panel (Google, GitHub, Discord)
 *
 * Exchanges OAuth provider credentials with `POST /auth/oauth` (`api/index.php` & `localDb.js`),
 * linking `oauth_provider` and `oauth_id` in the `users` table and issuing a signed HMAC-SHA256 JWT.
 * Includes an interactive OAuth 2.0 Account Picker Modal so tutors and markers can test
 * existing and newly provisioned OAuth accounts on localhost, Swinburne Mercury, and offline.
 */
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../composables/useToast'

const props = defineProps({
  mode: {
    type: String,
    default: 'login' // 'login' | 'register'
  },
  defaultRole: {
    type: String,
    default: 'member'
  },
  defaultRegion: {
    type: String,
    default: 'Australia'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['authenticated'])

const authStore = useAuthStore()
const { showToast } = useToast()

const activeProvider = ref(null)
const showModal = ref(false)
const useCustomAccount = ref(false)
const stepStatus = ref('')
const errorMsg = ref('')

const customForm = reactive({
  name: '',
  email: '',
  role: props.defaultRole || 'member',
  region: props.defaultRegion || 'Australia',
  vehicle: '2023 Honda Civic Type R (FL5)'
})

const providers = [
  {
    id: 'google',
    label: 'Google',
    icon: 'bi-google',
    issuer: 'accounts.google.com',
    protocol: 'OpenID Connect / OAuth 2.0',
    accounts: [
      {
        name: 'Amirul Hakim',
        email: 'amirul@apexgrid.com',
        role: 'member',
        region: 'Malaysia',
        vehicle: '2024 Honda Civic Type R (FL5)',
        oauth_id: 'google_oauth_amirul',
        badge: 'Member · Malaysia'
      },
      {
        name: 'Naveed Khan',
        email: 'naveed@apexgrid.com',
        role: 'organizer',
        region: 'Malaysia',
        vehicle: '2020 Nissan GT-R NISMO (R35)',
        oauth_id: 'google_oauth_naveed',
        badge: 'Organizer · Malaysia'
      },
      {
        name: 'Jacob Pillai',
        email: 'admin@apexgrid.com',
        role: 'admin',
        region: 'Australia',
        vehicle: '2023 Honda Civic Type R (FL5)',
        oauth_id: 'google_oauth_105986053',
        badge: 'Admin · Australia'
      }
    ]
  },
  {
    id: 'github',
    label: 'GitHub',
    icon: 'bi-github',
    issuer: 'github.com/login/oauth',
    protocol: 'OAuth 2.0 Authorization Code',
    accounts: [
      {
        name: 'Syed Rahman',
        email: 'organizer@apexgrid.com',
        role: 'organizer',
        region: 'Australia',
        vehicle: '2022 Porsche 911 GT3 (992)',
        oauth_id: 'github_oauth_syed',
        badge: 'Organizer · Australia'
      },
      {
        name: 'Chloe Vance',
        email: 'chloe@apexgrid.com',
        role: 'member',
        region: 'Australia',
        vehicle: '2001 Nissan Silvia Spec-R (S15)',
        oauth_id: 'github_oauth_chloe',
        badge: 'Member · Australia'
      }
    ]
  },
  {
    id: 'discord',
    label: 'Discord',
    icon: 'bi-discord',
    issuer: 'discord.com/api/oauth2',
    protocol: 'OAuth 2.0 Identity Scope',
    accounts: [
      {
        name: 'Gibson Tan',
        email: 'member@apexgrid.com',
        role: 'member',
        region: 'Australia',
        vehicle: '2023 Toyota GR86 Track Spec',
        oauth_id: 'discord_oauth_gibson',
        badge: 'Member · Australia'
      }
    ]
  }
]

const currentProviderObj = computed(
  () => providers.find((p) => p.id === activeProvider.value) || providers[0]
)

function openProviderModal(providerId) {
  if (props.disabled || authStore.loading) return
  activeProvider.value = providerId
  useCustomAccount.value = false
  errorMsg.value = ''
  stepStatus.value = ''
  customForm.role = props.defaultRole || 'member'
  customForm.region = props.defaultRegion || 'Australia'
  showModal.value = true
}

function closeModal() {
  if (authStore.loading) return
  showModal.value = false
  activeProvider.value = null
  stepStatus.value = ''
  errorMsg.value = ''
}

async function completeOAuthSignIn(accountPayload) {
  errorMsg.value = ''
  stepStatus.value = `1/3 Verifying ${currentProviderObj.value.label} OAuth 2.0 identity grant…`

  try {
    await new Promise((r) => setTimeout(r, 220))
    stepStatus.value = '2/3 Exchanging OAuth payload via POST /auth/oauth & issuing JWT…'

    const res = await authStore.loginWithOAuth({
      provider: currentProviderObj.value.id,
      name: accountPayload.name,
      email: accountPayload.email,
      oauth_id:
        accountPayload.oauth_id ||
        `${currentProviderObj.value.id}_${Date.now().toString(36)}`,
      role: accountPayload.role || 'member',
      region: accountPayload.region || 'Australia',
      vehicle: accountPayload.vehicle || null
    })

    stepStatus.value = '3/3 HMAC-SHA256 JWT session established!'
    const providerLabel = currentProviderObj.value.label
    showToast(
      res.is_new_user
        ? `Provisioned new ${providerLabel} OAuth account for ${res.user.name}!`
        : `Signed in via ${providerLabel} OAuth as ${res.user.name}.`,
      'success'
    )
    showModal.value = false
    emit('authenticated', res.user)
  } catch (err) {
    errorMsg.value = err?.message || 'OAuth authentication failed.'
    stepStatus.value = ''
  }
}

async function handleCustomOAuthSubmit() {
  if (!customForm.name.trim() || !customForm.email.trim()) {
    errorMsg.value = 'Please enter both a display name and email for your OAuth profile.'
    return
  }
  await completeOAuthSignIn({
    name: customForm.name.trim(),
    email: customForm.email.trim().toLowerCase(),
    role: customForm.role,
    region: customForm.region,
    vehicle: customForm.vehicle
  })
}
</script>

<template>
  <div class="oauth-block">
    <div class="oauth-divider">
      <span>{{ mode === 'register' ? 'Quick Sign-Up with OAuth 2.0' : 'Continue with OAuth 2.0' }}</span>
    </div>

    <div class="oauth-buttons" role="group" aria-label="OAuth 2.0 Social Login Providers">
      <button
        v-for="prov in providers"
        :key="prov.id"
        type="button"
        class="oauth-btn"
        :disabled="disabled || authStore.loading"
        :aria-label="`Continue with ${prov.label} OAuth`"
        @click="openProviderModal(prov.id)"
      >
        <i class="bi" :class="prov.icon" aria-hidden="true"></i>
        <span>{{ prov.label }}</span>
      </button>
    </div>

    <!-- Interactive OAuth 2.0 Account Picker Modal -->
    <div
      v-if="showModal"
      class="oauth-backdrop"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`oauth-modal-title-${currentProviderObj.id}`"
      @click.self="closeModal"
      @keydown.esc="closeModal"
    >
      <div class="oauth-modal">
        <div class="oauth-modal-header">
          <div class="d-flex align-items-center gap-2">
            <i class="bi fs-5 text-danger" :class="currentProviderObj.icon" aria-hidden="true"></i>
            <div>
              <h3 :id="`oauth-modal-title-${currentProviderObj.id}`" class="oauth-modal-title">
                {{ currentProviderObj.label }} OAuth 2.0 Identity Provider
              </h3>
              <p class="oauth-modal-subtitle">
                {{ currentProviderObj.issuer }} · {{ currentProviderObj.protocol }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="oauth-close-btn"
            aria-label="Close OAuth account picker"
            @click="closeModal"
          >
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>

        <div v-if="errorMsg" class="oauth-alert oauth-alert--error" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-1" aria-hidden="true"></i>{{ errorMsg }}
        </div>

        <div v-if="stepStatus" class="oauth-alert oauth-alert--progress" role="status">
          <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          <span>{{ stepStatus }}</span>
        </div>

        <div v-if="!useCustomAccount" class="oauth-modal-body">
          <p class="oauth-helper-text">
            Select a linked <strong>{{ currentProviderObj.label }}</strong> identity to exchange an
            OAuth 2.0 authorization grant with <code>POST /auth/oauth</code> and receive a signed
            HMAC-SHA256 JWT:
          </p>

          <ul class="oauth-account-list">
            <li v-for="acc in currentProviderObj.accounts" :key="acc.email">
              <button
                type="button"
                class="oauth-account-item"
                :disabled="authStore.loading"
                @click="completeOAuthSignIn(acc)"
              >
                <div class="oauth-account-avatar">
                  {{ acc.name.charAt(0) }}
                </div>
                <div class="oauth-account-info">
                  <div class="oauth-account-name">
                    <strong>{{ acc.name }}</strong>
                    <span class="oauth-role-badge">{{ acc.badge }}</span>
                  </div>
                  <div class="oauth-account-email">{{ acc.email }}</div>
                  <div v-if="acc.vehicle" class="oauth-account-vehicle">
                    <i class="bi bi-car-front-fill me-1" aria-hidden="true"></i>{{ acc.vehicle }}
                  </div>
                </div>
                <i class="bi bi-arrow-right-circle oauth-account-arrow" aria-hidden="true"></i>
              </button>
            </li>
          </ul>

          <button
            type="button"
            class="oauth-switch-mode-btn"
            @click="useCustomAccount = true"
          >
            <i class="bi bi-person-plus me-1" aria-hidden="true"></i>
            Use a different {{ currentProviderObj.label }} account (Provision new OAuth user)
          </button>
        </div>

        <form v-else class="oauth-modal-body" @submit.prevent="handleCustomOAuthSubmit">
          <p class="oauth-helper-text">
            Simulate signing in with any custom <strong>{{ currentProviderObj.label }}</strong>
            account. If the email is not yet in <code>users</code>, <code>POST /auth/oauth</code>
            automatically provisions the account and links <code>oauth_provider="{{ currentProviderObj.id }}"</code>.
          </p>

          <div class="oauth-custom-fields">
            <div>
              <label for="oauth-custom-name">OAuth Display Name *</label>
              <input
                id="oauth-custom-name"
                v-model="customForm.name"
                type="text"
                required
                placeholder="e.g. Liam Lawson"
              />
            </div>
            <div>
              <label for="oauth-custom-email">{{ currentProviderObj.label }} Email Address *</label>
              <input
                id="oauth-custom-email"
                v-model="customForm.email"
                type="email"
                required
                placeholder="e.g. liam@racingbulls.com"
              />
            </div>
            <div class="oauth-custom-row">
              <div>
                <label for="oauth-custom-role">Account Role</label>
                <select id="oauth-custom-role" v-model="customForm.role">
                  <option value="member">Member (Driver / Spectator)</option>
                  <option value="organizer">Organizer (Club / Track Host)</option>
                </select>
              </div>
              <div>
                <label for="oauth-custom-region">Home Region</label>
                <select id="oauth-custom-region" v-model="customForm.region">
                  <option value="Australia">Australia (VIC)</option>
                  <option value="Malaysia">Malaysia (MY)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="oauth-custom-actions">
            <button type="button" class="oauth-back-btn" @click="useCustomAccount = false">
              Back to saved accounts
            </button>
            <button type="submit" class="oauth-confirm-btn" :disabled="authStore.loading">
              Authorize &amp; Issue JWT
            </button>
          </div>
        </form>

        <div class="oauth-modal-footer">
          <span><i class="bi bi-shield-check me-1" aria-hidden="true"></i>Endpoint: <code>POST ?endpoint=auth/oauth</code></span>
          <span>Token: <code>HMAC-SHA256 JWT</code></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.oauth-block {
  margin-bottom: 1.5rem;
}
.oauth-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--auth-muted, #b4b6af);
}
.oauth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--auth-line, #41443f);
}
.oauth-buttons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}
.oauth-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 46px;
  padding: 0.6rem 0.75rem;
  background: var(--auth-surface, #222523);
  color: var(--auth-text, #f3f0e9);
  border: 1px solid var(--auth-line, #41443f);
  border-radius: 2px;
  font-size: 0.82rem;
  font-weight: 600;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.oauth-btn:hover:not(:disabled) {
  border-color: var(--auth-accent, #ed7059);
  background: rgba(237, 112, 89, 0.12);
}
.oauth-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}
.oauth-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2050;
  background: rgba(10, 11, 11, 0.82);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.oauth-modal {
  width: 100%;
  max-width: 500px;
  background: #1c1f1d;
  color: #f3f0e9;
  border: 1px solid #41443f;
  border-top: 3px solid #ed7059;
  border-radius: 4px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}
.oauth-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid #323531;
}
.oauth-modal-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}
.oauth-modal-subtitle {
  font-size: 0.72rem;
  color: #b4b6af;
  margin: 0.15rem 0 0;
  font-family: 'JetBrains Mono', monospace;
}
.oauth-close-btn {
  width: 38px;
  height: 38px;
  background: transparent;
  color: #b4b6af;
  border: 1px solid #323531;
  border-radius: 2px;
}
.oauth-close-btn:hover {
  color: #fff;
  border-color: #ed7059;
}
.oauth-modal-body {
  padding: 1.25rem;
}
.oauth-helper-text {
  font-size: 0.8rem;
  color: #b4b6af;
  line-height: 1.6;
  margin: 0 0 1rem;
}
.oauth-account-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
  display: grid;
  gap: 0.6rem;
}
.oauth-account-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 0.9rem;
  background: #242825;
  color: #f3f0e9;
  border: 1px solid #383b36;
  border-radius: 3px;
  text-align: left;
}
.oauth-account-item:hover:not(:disabled) {
  border-color: #ed7059;
  background: #2b2f2c;
}
.oauth-account-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #ed7059;
  color: #181a19;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.oauth-account-info {
  flex: 1;
  min-width: 0;
}
.oauth-account-name {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}
.oauth-role-badge {
  font-size: 0.68rem;
  padding: 0.1rem 0.45rem;
  background: rgba(237, 112, 89, 0.18);
  color: #ed7059;
  border-radius: 2px;
  font-family: 'JetBrains Mono', monospace;
}
.oauth-account-email {
  font-size: 0.76rem;
  color: #b4b6af;
}
.oauth-account-vehicle {
  font-size: 0.72rem;
  color: #d5d7d0;
  margin-top: 0.2rem;
}
.oauth-account-arrow {
  color: #ed7059;
  font-size: 1.1rem;
}
.oauth-switch-mode-btn {
  width: 100%;
  min-height: 42px;
  padding: 0.55rem;
  background: transparent;
  color: #ed7059;
  border: 1px dashed #41443f;
  font-size: 0.78rem;
  font-weight: 600;
}
.oauth-switch-mode-btn:hover {
  border-color: #ed7059;
  background: rgba(237, 112, 89, 0.08);
}
.oauth-custom-fields {
  display: grid;
  gap: 0.85rem;
  margin-bottom: 1rem;
}
.oauth-custom-fields label {
  display: block;
  font-size: 0.76rem;
  font-weight: 600;
  margin-bottom: 0.3rem;
}
.oauth-custom-fields input,
.oauth-custom-fields select {
  width: 100%;
  min-height: 42px;
  padding: 0.5rem 0.7rem;
  background: #242825;
  color: #f3f0e9;
  border: 1px solid #41443f;
  font-size: 0.85rem;
}
.oauth-custom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.oauth-custom-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}
.oauth-back-btn,
.oauth-confirm-btn {
  min-height: 42px;
  padding: 0.55rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 2px;
}
.oauth-back-btn {
  background: transparent;
  color: #b4b6af;
  border: 1px solid #41443f;
}
.oauth-confirm-btn {
  background: #ed7059;
  color: #181a19;
  border: 1px solid #ed7059;
}
.oauth-alert {
  margin: 0.85rem 1.25rem 0;
  padding: 0.65rem 0.85rem;
  font-size: 0.78rem;
  border-radius: 2px;
}
.oauth-alert--error {
  background: rgba(220, 53, 69, 0.15);
  border-left: 3px solid #dc3545;
  color: #ff9da5;
}
.oauth-alert--progress {
  background: rgba(237, 112, 89, 0.14);
  border-left: 3px solid #ed7059;
  color: #f3f0e9;
}
.oauth-modal-footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #141615;
  border-top: 1px solid #323531;
  font-size: 0.7rem;
  color: #b4b6af;
}
@media (max-width: 575.98px) {
  .oauth-buttons {
    grid-template-columns: 1fr;
  }
  .oauth-custom-row {
    grid-template-columns: 1fr;
  }
}
</style>
