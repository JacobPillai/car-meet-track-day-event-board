<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../composables/useToast'
import OAuthSocialPanel from '../components/OAuthSocialPanel.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()
const email = ref('')
const password = ref('')
const showCredentialsHelp = ref(false)
const pending = ref(false)
const completed = ref(false)
const submissionError = ref('')
const errorSummary = ref(null)
const emailInput = ref(null)
const busy = computed(() => pending.value || completed.value || authStore.loading)
let disposed = false
onBeforeUnmount(() => { disposed = true })

const seedAccounts = [
  { label: 'Member', name: 'Gibson', email: 'member@apexgrid.com', home: '/my-events' },
  { label: 'Organizer · Australia', name: 'Syed', email: 'organizer@apexgrid.com', home: '/dashboard' },
  { label: 'Organizer · Malaysia', name: 'Naveed', email: 'naveed@apexgrid.com', home: '/dashboard' },
  { label: 'Admin', name: 'Jacob', email: 'admin@apexgrid.com', home: '/admin' }
]

async function fillSeedAccount(seedEmail) {
  if (disposed || busy.value) return
  email.value = seedEmail
  password.value = 'Password123!'
  submissionError.value = ''
  showToast(`Filled credentials for ${seedEmail}`, 'info', 2200)
  await nextTick()
  if (!disposed) emailInput.value?.focus()
}

async function handleSubmit() {
  if (disposed || busy.value) return
  pending.value = true
  submissionError.value = ''

  try {
    const user = await authStore.login(email.value, password.value)
    if (disposed) return
    completed.value = true
    showToast(`Welcome back, ${user.name}!`, 'success')
    router.push(String(route.query.redirect || authStore.roleHomeRoute))
  } catch (err) {
    if (disposed) return
    submissionError.value = err?.message || authStore.error || 'Sign-in failed. Please try again.'
    await nextTick()
    if (!disposed) errorSummary.value?.focus()
  } finally {
    if (!disposed) pending.value = false
  }
}
function handleOAuthSuccess() {
  if (disposed) return
  completed.value = true
  router.push(String(route.query.redirect || authStore.roleHomeRoute))
}
</script>

<template>
  <div class="auth-page">
    <div class="container auth-shell">
      <div class="auth-layout">
        <header class="auth-intro">
          <p class="auth-eyebrow">Welcome back / ApexGrid</p>
          <h1>Less scrolling.<br /><span>More showing up.</span></h1>
          <p class="auth-lede">Pick up where you left off. Make plans for your next meet, weekend cruise or day at the track.</p>
          <div class="auth-note">
            <span aria-hidden="true">01 / Your next gathering</span>
            <p>Sign in to RSVP, view venue details and join the conversation. Your offline-saved events stay separate from your RSVPs.</p>
          </div>
          <dl class="auth-roles">
            <div><dt>Members</dt><dd>Keep track of RSVPs, likes and saved events.</dd></div>
            <div><dt>Organizers</dt><dd>Manage events and clubs, and view engagement.</dd></div>
            <div><dt>Admins</dt><dd>Manage accounts, roles and moderation.</dd></div>
          </dl>
        </header>

        <section class="auth-form-section" aria-labelledby="login-heading">
          <div class="auth-form-heading">
            <p class="auth-eyebrow">Your account</p>
            <h2 id="login-heading">Sign in to ApexGrid</h2>
            <p>Enter your email and password. New here? There’s room for you too.</p>
          </div>
          <p v-if="route.query.notice === 'auth_required'" class="auth-notice" role="status">Please sign in to continue to the page you requested. Account-role restrictions still apply.</p>

          <OAuthSocialPanel mode="login" :disabled="busy" @authenticated="handleOAuthSuccess" />

          <form :aria-busy="busy" @submit.prevent="handleSubmit">
            <div v-if="submissionError" ref="errorSummary" class="auth-error-summary" role="alert" tabindex="-1">{{ submissionError }}</div>
            <fieldset class="auth-fields" :disabled="busy">
              <legend class="auth-sr-only">Sign-in details</legend>
              <div class="auth-field">
                <label for="login-email">Email address</label>
                <span id="login-email-hint" class="auth-hint">Use the email you registered with.</span>
                <input id="login-email" ref="emailInput" v-model="email" type="email" name="email" required autocomplete="email" aria-describedby="login-email-hint login-email-error" placeholder="you@example.com" />
                <span id="login-email-error" class="auth-native-error">Please enter a valid email address.</span>
              </div>
              <div class="auth-field">
                <label for="login-password">Password</label>
                <span id="login-password-hint" class="auth-hint">Enter your account password (at least 6 characters).</span>
                <input id="login-password" v-model="password" type="password" name="password" required minlength="6" autocomplete="current-password" aria-describedby="login-password-hint login-password-error" />
                <span id="login-password-error" class="auth-native-error">Password must be at least 6 characters.</span>
              </div>
            </fieldset>
            <button type="submit" class="auth-submit" :disabled="busy"><span>{{ busy ? 'Signing in…' : 'Sign in' }}</span><i v-if="!busy" class="bi bi-arrow-right" aria-hidden="true"></i></button>
            <p v-if="busy" class="auth-status" role="status">Signing in to your account…</p>
          </form>
          <p class="auth-register">Don’t have an account? <router-link to="/register">Join ApexGrid</router-link></p>

          <div class="auth-demo">
            <button type="button" class="auth-demo-toggle" :aria-expanded="showCredentialsHelp" aria-controls="login-demo-accounts" @click="showCredentialsHelp = !showCredentialsHelp">
              <span>Try a demo account</span><i class="bi" :class="showCredentialsHelp ? 'bi-dash' : 'bi-plus'" aria-hidden="true"></i>
            </button>
            <section v-if="showCredentialsHelp" id="login-demo-accounts" aria-labelledby="login-demo-title">
              <h3 id="login-demo-title">Seeded test accounts</h3>
              <p>For the project demonstration. Choose an account to fill the form, then sign in. These accounts must exist in the active database.</p>
              <p>Demo password: <code>Password123!</code></p>
              <ul class="auth-demo-accounts">
                <li v-for="account in seedAccounts" :key="account.email">
                  <button type="button" :disabled="busy" :aria-label="`Fill ${account.label} demo account (${account.name})`" @click="fillSeedAccount(account.email)">
                    <span class="auth-demo-name">{{ account.label }} <span>{{ account.name }}</span></span>
                    <span class="auth-demo-email">{{ account.email }}</span>
                    <span class="auth-demo-home">Default page: {{ account.home }} <i class="bi bi-arrow-up-left" aria-hidden="true"></i></span>
                  </button>
                </li>
              </ul>
            </section>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  --auth-bg: #181a19;
  --auth-surface: #222523;
  --auth-text: #f3f0e9;
  --auth-muted: #b4b6af;
  --auth-line: #41443f;
  --auth-accent: #ed7059;
  color: var(--auth-text);
  background: var(--auth-bg);
  color-scheme: dark;
}
[data-bs-theme='light'] .auth-page {
  --auth-bg: #f4f1ea;
  --auth-surface: #e9e6de;
  --auth-text: #242722;
  --auth-muted: #5f625a;
  --auth-line: #c8c9bf;
  --auth-accent: #ae3d29;
  color-scheme: light;
}
.auth-shell { padding-top: clamp(2rem, 5vw, 4.5rem); padding-bottom: clamp(3rem, 6vw, 5rem); }
.auth-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: clamp(2rem, 6vw, 6rem); align-items: start; }
.auth-intro { padding-top: .5rem; }
.auth-eyebrow { color: var(--auth-accent); font-size: .72rem; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; margin: 0 0 1.2rem; }
.auth-intro h1 { font-size: clamp(2.5rem, 4.6vw, 4.6rem); line-height: 1.06; letter-spacing: -.055em; font-weight: 700; margin: 0 0 1.5rem; }
.auth-intro h1 span { color: var(--auth-muted); }
.auth-lede { max-width: 40ch; color: var(--auth-muted); line-height: 1.8; margin: 0; }
.auth-note { max-width: 40ch; border-top: 1px solid var(--auth-line); margin-top: 3rem; padding-top: 1.5rem; }
.auth-note > span { color: var(--auth-accent); font-size: .72rem; letter-spacing: .05em; }
.auth-note p { color: var(--auth-muted); font-size: .875rem; line-height: 1.8; margin: .75rem 0 0; }
.auth-roles { margin: 1.75rem 0 0; max-width: 40ch; }
.auth-roles > div { display: grid; grid-template-columns: 6rem minmax(0, 1fr); gap: .75rem; margin-top: 1rem; font-size: .8rem; }
.auth-roles dt { font-weight: 600; }
.auth-roles dd { margin: 0; color: var(--auth-muted); line-height: 1.7; }
.auth-form-section { min-width: 0; border-left: 1px solid var(--auth-line); padding-left: clamp(1.5rem, 3vw, 3rem); }
.auth-form-heading h2 { font-size: clamp(1.65rem, 2.5vw, 2.2rem); line-height: 1.15; font-weight: 600; margin: 0 0 .75rem; }
.auth-form-heading > p:last-child { color: var(--auth-muted); font-size: .875rem; line-height: 1.7; margin: 0 0 2rem; }
.auth-fields { min-width: 0; padding: 0; margin: 0; border: 0; display: grid; gap: 1.25rem; }
.auth-field { display: flex; flex-direction: column; gap: .4rem; min-width: 0; }
.auth-field label { color: var(--auth-text); font-size: .85rem; font-weight: 600; margin: 0; }
.auth-hint { color: var(--auth-muted); font-size: .75rem; line-height: 1.6; }
.auth-field input { width: 100%; min-width: 0; min-height: 48px; border: 1px solid var(--auth-line); border-radius: 2px; background: var(--auth-surface); color: var(--auth-text); padding: .7rem .8rem; font: inherit; font-size: .875rem; box-shadow: none; }
.auth-field input::placeholder { color: var(--auth-muted); opacity: 1; }
.auth-page :is(a, button, input, [tabindex]):focus-visible { outline: 3px solid var(--auth-accent); outline-offset: 4px; box-shadow: none; }
.auth-native-error { display: none; color: var(--auth-accent); font-size: .8rem; line-height: 1.6; }
.auth-field input:user-invalid { border-color: var(--auth-accent); box-shadow: none; }
.auth-field input:user-invalid + .auth-native-error { display: block; }
.auth-notice, .auth-error-summary { border-left: 3px solid var(--auth-accent); padding: 1rem; margin-bottom: 1.5rem; background: var(--auth-surface); color: var(--auth-text); font-size: .875rem; line-height: 1.7; overflow-wrap: anywhere; }
.auth-submit { display: flex; justify-content: space-between; align-items: center; gap: .75rem; width: 100%; min-height: 50px; margin-top: 1.75rem; padding: .85rem 1rem; border: 1px solid var(--auth-accent); border-radius: 2px; background: var(--auth-accent); color: var(--auth-bg); font: inherit; font-size: .875rem; font-weight: 700; }
.auth-submit:hover:not(:disabled) { background: var(--auth-text); border-color: var(--auth-text); }
.auth-submit:disabled, .auth-demo-accounts button:disabled { cursor: wait; opacity: .7; }
.auth-status { color: var(--auth-muted); font-size: .8rem; margin: 1rem 0 0; }
.auth-register { margin: 1.75rem 0 0; padding-top: 1.25rem; border-top: 1px solid var(--auth-line); color: var(--auth-muted); font-size: .875rem; }
.auth-register a { color: var(--auth-accent); font-weight: 600; text-underline-offset: .25em; margin-left: .35rem; }
.auth-register a:hover { color: var(--auth-text); }
.auth-demo { margin-top: 1.5rem; border-top: 1px solid var(--auth-line); }
.auth-demo-toggle { display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 48px; width: 100%; padding: .75rem 0; background: transparent; color: var(--auth-muted); border: 0; font-size: .8rem; text-align: left; }
.auth-demo-toggle:hover { color: var(--auth-text); }
.auth-demo h3 { font-size: 1rem; margin: 1rem 0 .75rem; }
.auth-demo p { color: var(--auth-muted); font-size: .8rem; line-height: 1.7; }
.auth-demo code { color: var(--auth-text); }
.auth-demo-accounts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; padding: 0; margin: 1rem 0 0; list-style: none; }
.auth-demo-accounts button { width: 100%; height: 100%; min-height: 100px; padding: .85rem; text-align: left; color: var(--auth-text); background: transparent; border: 1px solid var(--auth-line); }
.auth-demo-accounts button:hover:not(:disabled) { background: var(--auth-surface); border-color: var(--auth-accent); }
.auth-demo-name { display: block; font-size: .8rem; font-weight: 600; line-height: 1.6; }
.auth-demo-name > span { color: var(--auth-muted); font-weight: 400; }
.auth-demo-email { display: block; overflow-wrap: anywhere; margin-top: .35rem; font-size: .75rem; color: var(--auth-muted); }
.auth-demo-home { display: flex; justify-content: space-between; gap: .5rem; margin-top: .6rem; font-size: .65rem; color: var(--auth-muted); }
.auth-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
@media (max-width: 991.98px) {
  .auth-layout { grid-template-columns: minmax(0, 1fr); gap: 2rem; }
  .auth-intro h1 { font-size: clamp(2.5rem, 6vw, 3.5rem); }
  .auth-lede { max-width: 58ch; }
  .auth-note, .auth-roles { display: none; }
  .auth-form-section { border-left: 0; border-top: 1px solid var(--auth-line); padding: 2rem 0 0; }
}
@media (max-width: 575.98px) {
  .auth-shell { padding-top: 1.5rem; }
  .auth-intro h1 { font-size: 2.5rem; }
  .auth-demo-accounts { grid-template-columns: minmax(0, 1fr); }
  .auth-form-heading > p:last-child { margin-bottom: 1.5rem; }
}
</style>
