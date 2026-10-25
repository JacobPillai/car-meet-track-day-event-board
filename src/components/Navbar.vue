<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'
import { useOfflineEvents } from '../composables/useOfflineEvents'
import { useToast } from '../composables/useToast'
import CommandSearchModal from './CommandSearchModal.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const { isOnline, savedEvents } = useOfflineEvents()
const { showToast } = useToast()
const searchOpen = ref(false)
const menuOpen = ref(false)
const menuPanel = ref(null)
const menuToggle = ref(null)
const avatarFailed = ref(false)
let searchOpener = null
let mounted = false

const publicLinks = [
  { to: '/', label: 'Home', icon: 'bi-house-door' },
  { to: '/events', label: 'Events', icon: 'bi-flag' },
  { to: '/explore', label: 'Explore', icon: 'bi-compass' },
  { to: '/clubs', label: 'Clubs', icon: 'bi-people' },
  { to: '/about', label: 'About', icon: 'bi-info-circle' }
]
const portalLabel = computed(() => authStore.isAdmin ? 'Admin' : authStore.isOrganizer ? 'Dashboard' : 'My events')
const initials = computed(() => (authStore.user?.name || 'Account').trim().split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase())
const themeLabel = computed(() => themeStore.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')
const connectionLabel = computed(() => isOnline.value ? 'Browser online' : 'Browser offline')

function isCurrent(path) {
  return path === '/' ? route.path === '/' : route.path === path || route.path.startsWith(`${path}/`)
}
function closeMenu(restoreFocus = false) {
  menuOpen.value = false
  if (restoreFocus) menuToggle.value?.focus()
}
function toggleMenu() {
  if (menuOpen.value) closeMenu()
  else {
    searchOpen.value = false
    menuOpen.value = true
  }
}
function openSearch(opener = document.activeElement) {
  closeMenu()
  searchOpener = opener
  searchOpen.value = true
}
async function closeSearch(restoreFocus = true) {
  searchOpen.value = false
  await nextTick()
  if (mounted && restoreFocus && searchOpener?.isConnected) searchOpener.focus()
}
function handleLogout() {
  closeMenu(true)
  authStore.logout()
  showToast('Signed out of your account.', 'info')
  router.push('/login')
}
function handleGlobalShortcut(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    if (event.repeat) return
    if (searchOpen.value) closeSearch()
    else openSearch()
  } else if (event.key === 'Escape' && menuOpen.value) {
    event.preventDefault()
    closeMenu(true)
  }
}
function handleOutsideClick(event) {
  if (menuOpen.value && !menuPanel.value?.contains(event.target) && !menuToggle.value?.contains(event.target)) closeMenu()
}
function handleFocusOutside(event) {
  if (menuOpen.value && !menuPanel.value?.contains(event.target) && !menuToggle.value?.contains(event.target)) closeMenu()
}
watch(() => route.fullPath, () => {
  closeMenu()
  if (searchOpen.value) closeSearch(false)
})
watch(() => authStore.user?.avatar, () => { avatarFailed.value = false })
watch(() => authStore.isAuthenticated, () => { closeMenu() })
onMounted(() => {
  mounted = true
  window.addEventListener('keydown', handleGlobalShortcut)
  document.addEventListener('click', handleOutsideClick)
  document.addEventListener('focusin', handleFocusOutside)
})
onUnmounted(() => {
  mounted = false
  window.removeEventListener('keydown', handleGlobalShortcut)
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('focusin', handleFocusOutside)
})
</script>

<template>
  <header class="site-header">
    <div class="container site-header__inner">
      <router-link class="site-brand" to="/" aria-label="ApexGrid home" @click="closeMenu()">
        <span class="site-brand__mark" aria-hidden="true"><span></span><span></span><span></span></span>
        <span>APEX<span class="site-brand__accent">GRID</span></span>
      </router-link>

      <nav class="desktop-navigation" aria-label="Primary navigation">
        <router-link v-for="link in publicLinks" :key="link.to" :to="link.to" :class="{ 'is-current': isCurrent(link.to) }" :aria-current="isCurrent(link.to) ? 'page' : null">{{ link.label }}</router-link>
      </nav>

      <div class="site-header__actions">
        <button type="button" class="nav-icon-button nav-search" aria-label="Open quick search" aria-keyshortcuts="Control+k Meta+k" title="Search events and clubs (Ctrl/Cmd+K)" @click="openSearch($event.currentTarget)">
          <i class="bi bi-search" aria-hidden="true"></i>
        </button>
        <button type="button" class="nav-icon-button" :aria-label="themeLabel" :title="themeLabel" @click="themeStore.toggleTheme()">
          <i :class="['bi', themeStore.theme === 'dark' ? 'bi-sun' : 'bi-moon']" aria-hidden="true"></i>
        </button>
        <div v-if="authStore.isGuest" class="desktop-auth">
          <router-link to="/login" class="nav-sign-in">Sign in</router-link>
          <router-link to="/register" class="nav-join">Join ApexGrid <i class="bi bi-arrow-up-right" aria-hidden="true"></i></router-link>
        </div>
        <button ref="menuToggle" type="button" class="nav-account-toggle" :class="{ 'nav-account-toggle--guest': authStore.isGuest }" :aria-label="authStore.isAuthenticated ? 'Account and navigation' : 'Open navigation menu'" aria-controls="apex-navigation-panel" :aria-expanded="menuOpen" @click="toggleMenu">
          <template v-if="authStore.isAuthenticated">
            <img v-if="authStore.user?.avatar && !avatarFailed" :src="authStore.user.avatar" alt="" class="nav-avatar" @error="avatarFailed = true" />
            <span v-else class="nav-avatar nav-avatar--initials" aria-hidden="true">{{ initials }}</span>
            <span class="nav-account-name">{{ authStore.user?.name || 'Account' }}</span>
            <i :class="['bi', menuOpen ? 'bi-chevron-up' : 'bi-chevron-down', 'nav-account-chevron']" aria-hidden="true"></i>
          </template>
          <i :class="['bi', menuOpen ? 'bi-x-lg' : 'bi-list', 'nav-mobile-menu-icon']" aria-hidden="true"></i>
        </button>
      </div>

      <div v-if="menuOpen" id="apex-navigation-panel" ref="menuPanel" class="nav-panel">
        <nav class="nav-panel__public" aria-label="More navigation">
          <router-link v-for="link in publicLinks" :key="link.to" :to="link.to" :aria-current="isCurrent(link.to) ? 'page' : null" @click="closeMenu()"><i :class="['bi', link.icon]" aria-hidden="true"></i>{{ link.label }}</router-link>
        </nav>
        <template v-if="authStore.isAuthenticated">
          <div class="nav-panel__identity">
            <strong>{{ authStore.user?.name || 'Your account' }}</strong>
            <span>{{ authStore.user?.email }}</span>
            <span class="nav-panel__role">{{ authStore.userRole }}</span>
          </div>
          <nav class="nav-panel__account" aria-label="Account navigation">
            <router-link to="/my-events" @click="closeMenu()"><i class="bi bi-bookmark" aria-hidden="true"></i><span>My RSVPs &amp; saved events<small v-if="savedEvents.length">{{ savedEvents.length }} saved for offline</small></span></router-link>
            <router-link to="/profile" @click="closeMenu()"><i class="bi bi-person" aria-hidden="true"></i>Profile</router-link>
            <router-link v-if="authStore.isOrganizer" to="/dashboard" @click="closeMenu()"><i class="bi bi-bar-chart" aria-hidden="true"></i>Organizer dashboard</router-link>
            <router-link v-if="authStore.isOrganizer" to="/events/new" @click="closeMenu()"><i class="bi bi-plus-circle" aria-hidden="true"></i>Host an event</router-link>
            <router-link v-if="authStore.isAdmin" to="/admin" @click="closeMenu()"><i class="bi bi-sliders" aria-hidden="true"></i>Admin moderation</router-link>
          </nav>
          <button type="button" class="nav-sign-out" @click="handleLogout"><i class="bi bi-box-arrow-right" aria-hidden="true"></i>Sign out</button>
        </template>
        <div v-else class="nav-panel__guest">
          <p>Good cars. Better company.</p>
          <router-link to="/register" class="nav-join" @click="closeMenu()">Join ApexGrid <i class="bi bi-arrow-up-right" aria-hidden="true"></i></router-link>
          <router-link to="/login" class="nav-sign-in" @click="closeMenu()">Already a member? Sign in</router-link>
        </div>
        <p class="nav-connection" role="status" :title="isOnline ? 'Browser connectivity only; this does not measure API or app health.' : 'Browser is offline; uncached content may be unavailable.'">
          <i :class="['bi', isOnline ? 'bi-wifi' : 'bi-wifi-off']" aria-hidden="true"></i>{{ connectionLabel }}
        </p>
      </div>
    </div>
    <p v-if="!isOnline && !menuOpen" class="nav-offline-note" role="status"><i class="bi bi-wifi-off" aria-hidden="true"></i>Browser offline</p>
  </header>

  <nav class="mobile-dock" aria-label="Mobile quick navigation">
    <router-link v-for="link in publicLinks.slice(0, 4)" :key="link.to" :to="link.to" :class="{ 'is-current': isCurrent(link.to) }" :aria-current="isCurrent(link.to) ? 'page' : null" @click="closeMenu()">
      <i :class="['bi', link.icon]" aria-hidden="true"></i><span>{{ link.label }}</span>
    </router-link>
    <router-link :to="authStore.isAuthenticated ? authStore.roleHomeRoute : '/login'" :class="{ 'is-current': isCurrent(authStore.isAuthenticated ? authStore.roleHomeRoute : '/login') }" :aria-current="isCurrent(authStore.isAuthenticated ? authStore.roleHomeRoute : '/login') ? 'page' : null" @click="closeMenu()">
      <i :class="['bi', authStore.isAuthenticated ? 'bi-person' : 'bi-box-arrow-in-right']" aria-hidden="true"></i><span>{{ authStore.isAuthenticated ? portalLabel : 'Sign in' }}</span>
    </router-link>
  </nav>

  <CommandSearchModal :open="searchOpen" @close="closeSearch()" />
</template>

<style scoped>
.site-header, .mobile-dock {
  --nav-bg: #101110;
  --nav-pill: #090a09;
  --nav-surface: #222520;
  --nav-text: #f4f2eb;
  --nav-muted: #b3b5ac;
  --nav-border: #343731;
  --nav-accent: #ff775f;
  color: var(--nav-text);
  background: var(--nav-bg);
}
[data-bs-theme='light'] .site-header, [data-bs-theme='light'] .mobile-dock {
  --nav-bg: #f7f6f2;
  --nav-pill: #eaece5;
  --nav-surface: #fff;
  --nav-text: #1c211d;
  --nav-muted: #575e55;
  --nav-border: #cdd0c6;
  --nav-accent: #a52e20;
}
.site-header { position: sticky; top: 0; z-index: 1020; border-bottom: 1px solid var(--nav-border); }
.site-header__inner { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 1.5rem; min-height: 92px; }
.site-brand { display: inline-flex; align-items: center; gap: 0.65rem; justify-self: start; color: var(--nav-text); font-family: 'Space Grotesk', system-ui, sans-serif; font-size: 1.1rem; font-weight: 700; letter-spacing: -0.05em; text-decoration: none; }
.site-brand:hover { color: var(--nav-text); }
.site-brand__accent { color: var(--nav-accent); }
.site-brand__mark { display: inline-flex; align-items: end; gap: 3px; height: 24px; transform: skew(-18deg); }
.site-brand__mark span { width: 5px; height: 14px; background: var(--nav-accent); }
.site-brand__mark span:nth-child(2) { height: 23px; }
.site-brand__mark span:nth-child(3) { height: 18px; }
.desktop-navigation { display: flex; align-items: center; gap: 0.25rem; padding: 0.3rem; border: 1px solid var(--nav-border); border-radius: 999px; background: var(--nav-pill); }
.desktop-navigation a { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0.65rem 1rem; border: 1px solid transparent; border-radius: 999px; color: var(--nav-muted); font-size: 0.85rem; font-weight: 500; text-decoration: none; }
.desktop-navigation a:hover { color: var(--nav-text); }
.desktop-navigation a.is-current { background: var(--nav-surface); color: var(--nav-text); border-color: var(--nav-border); }
.site-header__actions { display: flex; justify-self: end; align-items: center; gap: 0.35rem; min-width: 0; }
.nav-icon-button, .nav-account-toggle { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; min-width: 44px; min-height: 44px; border: 1px solid transparent; border-radius: 999px; padding: 0.65rem; color: var(--nav-text); background: transparent; font: inherit; font-size: 1rem; }
.nav-icon-button:hover, .nav-account-toggle:hover { background: var(--nav-surface); border-color: var(--nav-border); }
.desktop-auth { display: flex; align-items: center; gap: 0.75rem; margin-left: 0.35rem; }
.nav-sign-in { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; color: var(--nav-text); font-size: 0.8rem; text-decoration: none; }
.nav-sign-in:hover { color: var(--nav-accent); }
.nav-join { display: inline-flex; align-items: center; justify-content: center; gap: 0.75rem; min-height: 44px; padding: 0.65rem 1rem; border: 1px solid var(--nav-border); border-radius: 999px; background: var(--nav-surface); color: var(--nav-text); font-size: 0.8rem; font-weight: 600; text-decoration: none; white-space: nowrap; }
.nav-join:hover { color: var(--nav-text); border-color: var(--nav-accent); }
.nav-account-toggle { gap: 0.6rem; min-width: 0; padding: 0.35rem 0.65rem 0.35rem 0.35rem; border-color: var(--nav-border); margin-left: 0.35rem; }
.nav-account-toggle--guest, .nav-mobile-menu-icon { display: none; }
.nav-avatar { width: 32px; height: 32px; flex-shrink: 0; object-fit: cover; border-radius: 50%; background: var(--nav-surface); }
.nav-avatar--initials { display: inline-flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 600; color: var(--nav-text); }
.nav-account-name { display: block; max-width: 7rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 0.8rem; }
.nav-account-chevron { font-size: 0.65rem; }
.nav-panel { position: absolute; top: calc(100% - 0.35rem); right: 12px; width: min(360px, calc(100vw - 24px)); max-height: calc(100dvh - 112px); overflow-y: auto; overscroll-behavior: contain; padding: 1rem; border: 1px solid var(--nav-border); border-radius: 1.25rem; background: var(--nav-bg); box-shadow: 0 12px 30px rgb(0 0 0 / 12%); }
.nav-panel__public { display: none; }
.nav-panel__identity { padding: 0.5rem 0.65rem 1rem; border-bottom: 1px solid var(--nav-border); }
.nav-panel__identity strong { display: block; font-size: 0.95rem; overflow-wrap: anywhere; }
.nav-panel__identity > span { display: block; margin-top: 0.25rem; color: var(--nav-muted); font-size: 0.75rem; overflow-wrap: anywhere; }
.nav-panel__identity .nav-panel__role { margin-top: 0.5rem; color: var(--nav-accent); text-transform: capitalize; }
.nav-panel__account { padding-block: 0.5rem; }
.nav-panel nav a, .nav-sign-out { display: flex; align-items: center; gap: 0.75rem; min-height: 48px; padding: 0.75rem 0.65rem; border: 0; border-radius: 0.5rem; background: transparent; color: var(--nav-text); font: inherit; font-size: 0.85rem; text-decoration: none; }
.nav-panel nav a:hover, .nav-sign-out:hover { background: var(--nav-surface); }
.nav-panel nav a i { width: 1rem; color: var(--nav-muted); }
.nav-panel nav a small { display: block; margin-top: 0.25rem; color: var(--nav-muted); font-size: 0.7rem; }
.nav-panel .nav-sign-out { width: 100%; color: var(--nav-accent); text-align: left; }
.nav-panel__guest { display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem 0.65rem 0; }
.nav-panel__guest p { margin: 0 0 0.5rem; font-size: 0.9rem; font-weight: 600; }
.nav-connection { display: flex; align-items: center; gap: 0.5rem; margin: 0.75rem 0 0; border-top: 1px solid var(--nav-border); padding: 1rem 0.65rem 0.25rem; color: var(--nav-muted); font-size: 0.7rem; }
.nav-offline-note { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin: 0; padding: 0.5rem 1rem; border-top: 1px solid var(--nav-border); color: var(--nav-muted); font-size: 0.75rem; }
.mobile-dock { display: none; }
.site-header :is(a, button):focus-visible, .mobile-dock a:focus-visible { outline: 2px solid var(--nav-accent); outline-offset: 3px; box-shadow: none; }
@media (max-width: 1399.98px) and (min-width: 1200px) {
  .site-header__inner { gap: 0.75rem; }
  .desktop-navigation a { padding-inline: 0.85rem; }
  .nav-account-name { max-width: 5rem; }
}
@media (max-width: 1199.98px) {
  /* The footer reserves room for this dock (see Footer.vue), so no strip of page background shows below it. */
  .site-header__inner { display: flex; justify-content: space-between; gap: 0.75rem; min-height: 76px; }
  .desktop-navigation, .desktop-auth { display: none; }
  .site-header__actions { gap: 0.15rem; }
  .nav-account-toggle { padding: 0.65rem; margin-left: 0; border-color: transparent; min-width: 44px; }
  .nav-account-toggle > :not(.nav-mobile-menu-icon) { display: none; }
  .nav-account-toggle--guest, .nav-mobile-menu-icon { display: inline-flex; }
  .nav-mobile-menu-icon { font-size: 1.25rem; }
  .nav-panel { top: calc(100% - 0.25rem); max-height: calc(100dvh - 184px - env(safe-area-inset-bottom, 0px)); }
  .nav-panel__public { display: grid; grid-template-columns: 1fr 1fr; gap: 0.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--nav-border); }
  .nav-panel__public a[aria-current='page'] { background: var(--nav-surface); }
  .nav-panel__identity { padding-top: 1rem; }
  .mobile-dock { position: fixed; z-index: 1030; bottom: calc(12px + env(safe-area-inset-bottom, 0px)); left: 50%; transform: translateX(-50%); display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); width: min(460px, calc(100% - 24px)); padding: 0.4rem; border: 1px solid var(--nav-border); border-radius: 999px; box-shadow: 0 5px 20px rgb(0 0 0 / 12%); }
  .mobile-dock a { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; min-height: 58px; border: 1px solid transparent; border-radius: 999px; color: var(--nav-muted); text-decoration: none; }
  .mobile-dock a i { font-size: 1.15rem; line-height: 1.2; }
  .mobile-dock a span { font-size: 0.6rem; font-weight: 500; }
  .mobile-dock a:hover { color: var(--nav-text); }
  .mobile-dock a.is-current { background: var(--nav-surface); border-color: var(--nav-border); color: var(--nav-text); }
  .mobile-dock a.is-current i { color: var(--nav-accent); }
}
@media (prefers-reduced-motion: reduce) {
  .site-header *, .mobile-dock * { transition: none !important; }
}
</style>
