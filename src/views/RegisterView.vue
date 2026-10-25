<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue'
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

const submissionError = ref('')
const pending = ref(false)
const completed = ref(false)
const confirmationChecked = ref(false)
const confirmationInput = ref(null)
const errorSummary = ref(null)
const mismatch = computed(() => confirmationChecked.value && form.password !== form.confirmPassword)
const busy = computed(() => pending.value || completed.value || authStore.loading)
let disposed = false
onBeforeUnmount(() => { disposed = true })

async function handleRegister() {
  if (disposed || busy.value) return
  submissionError.value = ''
  confirmationChecked.value = true
  if (mismatch.value) {
    await nextTick()
    if (!disposed) confirmationInput.value?.focus()
    return
  }

  pending.value = true
  try {
    const user = await authStore.register({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      region: form.region,
      bio: form.bio
    })
    if (disposed) return
    completed.value = true
    showToast(`Account created! Welcome to ApexGrid, ${user.name}.`, 'success')
    if (form.role === 'organizer' && user.role !== 'organizer') {
      showToast('Organizer access needs admin approval. You are signed in as a Member for now.', 'info', 6000)
    }
    router.push(authStore.roleHomeRoute)
  } catch (err) {
    if (disposed) return
    submissionError.value = err?.message || 'Registration failed.'
    await nextTick()
    if (!disposed) errorSummary.value?.focus()
  } finally {
    if (!disposed) pending.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="container auth-shell">
      <div class="auth-layout">
        <header class="auth-intro">
          <p class="auth-eyebrow">Join ApexGrid</p>
          <h1>Your next meet.<br /><span>Your kind of people.</span></h1>
          <p class="auth-lede">
            Car meets, weekend cruises or a day at the track. Find your community,
            then make plans to be part of it.
          </p>
          <div class="auth-note">
            <span aria-hidden="true">01 / Get together</span>
            <p>Join as a member to RSVP and see venue details, or as an organizer to bring people together at your own events.</p>
          </div>
        </header>

        <section class="auth-form-section" aria-labelledby="register-heading">
          <div class="auth-form-heading">
            <p class="auth-eyebrow">Start here</p>
            <h2 id="register-heading">Create your account</h2>
            <p>Choose how you’ll take part. All fields are required unless marked optional.</p>
          </div>

          <form :aria-busy="busy" @submit.prevent="handleRegister">
            <div
              v-if="submissionError"
              ref="errorSummary"
              class="auth-error-summary"
              role="alert"
              tabindex="-1"
            >
              {{ submissionError }}
            </div>

            <fieldset class="auth-fields" :disabled="busy">
              <legend class="auth-sr-only">Account details</legend>
              <fieldset class="auth-roles">
                <legend>Account type</legend>
                <div class="auth-role-options">
                  <label class="auth-role" for="role-member">
                    <input id="role-member" v-model="form.role" type="radio" name="account-role" value="member" required />
                    <span><strong>Member</strong><span>RSVP, comment and see venue details.</span></span>
                  </label>
                  <label class="auth-role" for="role-organizer">
                    <input id="role-organizer" v-model="form.role" type="radio" name="account-role" value="organizer" required />
                    <span><strong>Organizer</strong><span>Host events, manage clubs and view analytics.</span></span>
                  </label>
                </div>
              </fieldset>

              <div class="auth-grid">
                <div class="auth-field">
                  <label for="reg-name">Full name</label>
                  <span id="reg-name-hint" class="auth-hint">At least 3 characters</span>
                  <input
                    id="reg-name" v-model="form.name" name="name" type="text" required minlength="3"
                    autocomplete="name" aria-describedby="reg-name-hint" aria-errormessage="reg-name-error"
                    placeholder="Alex Mercer"
                  />
                  <span id="reg-name-error" class="auth-native-error">Please enter your full name (at least 3 characters).</span>
                </div>

                <div class="auth-field">
                  <label for="reg-region">Home region</label>
                  <span id="reg-region-hint" class="auth-hint">Australia or Malaysia</span>
                  <select id="reg-region" v-model="form.region" name="region" required aria-describedby="reg-region-hint">
                    <option value="Australia">Australia (VIC)</option>
                    <option value="Malaysia">Malaysia (MY)</option>
                  </select>
                </div>

                <div class="auth-field auth-full-width">
                  <label for="reg-email">Email address</label>
                  <span id="reg-email-hint" class="auth-hint">For example, driver@example.com</span>
                  <input
                    id="reg-email" v-model="form.email" name="email" type="email" required autocomplete="email"
                    aria-describedby="reg-email-hint" aria-errormessage="reg-email-error" placeholder="you@example.com"
                  />
                  <span id="reg-email-error" class="auth-native-error">Please enter a valid email address.</span>
                </div>

                <div class="auth-field auth-full-width">
                  <label for="reg-password">Password</label>
                  <span id="reg-password-rules" class="auth-hint">Use at least 8 characters, with an uppercase letter, a lowercase letter and a number.</span>
                  <input
                    id="reg-password" v-model="form.password" name="password" type="password" required minlength="8"
                    pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" autocomplete="new-password"
                    aria-describedby="reg-password-rules" aria-errormessage="reg-password-error"
                  />
                  <span id="reg-password-error" class="auth-native-error">Use 8 or more characters with uppercase, lowercase and a number.</span>
                </div>

                <div class="auth-field auth-full-width">
                  <label for="reg-confirm">Confirm password</label>
                  <span id="reg-confirm-hint" class="auth-hint">Re-enter the same password</span>
                  <input
                    id="reg-confirm" ref="confirmationInput" v-model="form.confirmPassword" name="confirmPassword"
                    type="password" required minlength="8" autocomplete="new-password"
                    :aria-invalid="mismatch ? 'true' : undefined"
                    :aria-describedby="mismatch ? 'reg-confirm-hint reg-confirm-error' : 'reg-confirm-hint'"
                    :aria-errormessage="mismatch ? 'reg-confirm-error' : undefined"
                  />
                  <span v-if="mismatch" id="reg-confirm-error" class="auth-inline-error" role="alert">
                    Passwords do not match. Please verify both password fields.
                  </span>
                </div>

                <div class="auth-field auth-full-width">
                  <label for="reg-bio">Car build / about you <span class="auth-optional">(optional)</span></label>
                  <span id="reg-bio-hint" class="auth-hint">Tell the community a little about your car or interests.</span>
                  <input id="reg-bio" v-model="form.bio" name="bio" type="text" aria-describedby="reg-bio-hint" placeholder="Weekend cruises and a well-loved Civic" />
                </div>
              </div>

              <button type="submit" class="auth-submit" :disabled="busy">
                {{ completed ? 'Account created' : pending ? 'Creating account…' : `Create ${form.role === 'organizer' ? 'Organizer' : 'Member'} Account` }}
                <span aria-hidden="true">↗</span>
              </button>
            </fieldset>
            <p v-if="pending" class="auth-status" role="status">Creating your account. Please wait.</p>
          </form>

          <p class="auth-signin">Already registered? <router-link to="/login">Sign in</router-link></p>
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
.auth-form-section { min-width: 0; border-left: 1px solid var(--auth-line); padding-left: clamp(1.5rem, 3vw, 3rem); }
.auth-form-heading h2 { font-size: clamp(1.65rem, 2.5vw, 2.2rem); line-height: 1.15; font-weight: 600; margin: 0 0 .75rem; }
.auth-form-heading > p:last-child { color: var(--auth-muted); font-size: .875rem; line-height: 1.7; margin: 0 0 2rem; }
.auth-fields, .auth-roles { min-width: 0; padding: 0; margin: 0; border: 0; }
.auth-roles { margin-bottom: 1.75rem; }
.auth-roles legend, .auth-field label { float: none; width: auto; color: var(--auth-text); font-size: .85rem; font-weight: 600; margin: 0; }
.auth-roles legend { margin-bottom: .75rem; }
.auth-role-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
.auth-role { display: flex; align-items: start; gap: .65rem; padding: 1rem; border: 1px solid var(--auth-line); cursor: pointer; }
.auth-role:has(input:checked) { border-color: var(--auth-accent); background: var(--auth-surface); }
.auth-role input { flex: 0 0 auto; margin-top: .2rem; accent-color: var(--auth-accent); }
.auth-role strong { display: block; font-size: .875rem; font-weight: 600; margin-bottom: .4rem; }
.auth-role span span { display: block; color: var(--auth-muted); font-size: .75rem; line-height: 1.6; }
.auth-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem 1rem; }
.auth-field { display: flex; flex-direction: column; gap: .4rem; min-width: 0; }
.auth-full-width { grid-column: 1 / -1; }
.auth-hint, .auth-optional { color: var(--auth-muted); font-size: .75rem; font-weight: 400; line-height: 1.6; }
.auth-field :is(input, select) { width: 100%; min-width: 0; min-height: 48px; border: 1px solid var(--auth-line); border-radius: 2px; background: var(--auth-surface); color: var(--auth-text); padding: .7rem .8rem; font: inherit; font-size: .875rem; box-shadow: none; }
.auth-field input::placeholder { color: var(--auth-muted); opacity: 1; }
.auth-page :is(a, button, input, select, [tabindex]):focus-visible { outline: 3px solid var(--auth-accent); outline-offset: 4px; box-shadow: none; }
.auth-native-error { display: none; }
.auth-field :is(input:user-invalid, select:user-invalid, input[aria-invalid='true']) { border-color: var(--auth-accent); box-shadow: none; }
.auth-field :is(input:user-valid, select:user-valid) { border-color: var(--auth-line); }
.auth-field input[aria-invalid='true'] { border-color: var(--auth-accent); }
.auth-field input:user-invalid + .auth-native-error { display: block; }
.auth-native-error, .auth-inline-error { color: var(--auth-accent); font-size: .8rem; line-height: 1.6; }
.auth-error-summary { border-left: 3px solid var(--auth-accent); padding: 1rem; margin-bottom: 1.5rem; background: var(--auth-surface); color: var(--auth-text); font-size: .875rem; overflow-wrap: anywhere; }
.auth-submit { display: flex; justify-content: space-between; align-items: center; gap: .75rem; width: 100%; min-height: 50px; margin-top: 1.75rem; padding: .85rem 1rem; border: 1px solid var(--auth-accent); border-radius: 2px; background: var(--auth-accent); color: var(--auth-bg); font: inherit; font-size: .875rem; font-weight: 700; }
.auth-submit:hover:not(:disabled) { background: var(--auth-text); border-color: var(--auth-text); }
.auth-submit:disabled { cursor: wait; opacity: .7; }
.auth-fields:disabled .auth-role { cursor: wait; }
.auth-status { color: var(--auth-muted); font-size: .8rem; margin: 1rem 0 0; }
.auth-signin { margin: 1.75rem 0 0; padding-top: 1.25rem; border-top: 1px solid var(--auth-line); color: var(--auth-muted); font-size: .875rem; }
.auth-signin a { color: var(--auth-accent); font-weight: 600; text-underline-offset: .25em; margin-left: .35rem; }
.auth-signin a:hover { color: var(--auth-text); }
.auth-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
@media (max-width: 991.98px) {
  .auth-layout { grid-template-columns: minmax(0, 1fr); gap: 2rem; }
  .auth-intro h1 { font-size: clamp(2.5rem, 6vw, 3.5rem); }
  .auth-lede { max-width: 58ch; }
  .auth-note { display: none; }
  .auth-form-section { border-left: 0; border-top: 1px solid var(--auth-line); padding: 2rem 0 0; }
}
@media (max-width: 575.98px) {
  .auth-shell { padding-top: 1.5rem; }
  .auth-intro h1 { font-size: 2.5rem; }
  .auth-grid, .auth-role-options { grid-template-columns: minmax(0, 1fr); }
  .auth-role { padding: .85rem; }
  .auth-form-heading > p:last-child { margin-bottom: 1.5rem; }
}
</style>
