/**
 * ApexGrid — PWA Offline Saved Events & Network State Composable (Jacob's Advanced Feature)
 * Enables members to pin/save events for full offline access (venue, schedule, exact address,
 * and organizer contact) when driving to remote track venues with poor reception.
 */

import { ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue'

const OFFLINE_EVENTS_KEY = 'apexgrid_offline_saved_events_v1'

function loadOfflineEvents() {
  try {
    const raw = localStorage.getItem(OFFLINE_EVENTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const savedEvents = ref(loadOfflineEvents())
const browserOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
const deferredInstallPrompt = ref(null)
const isInstalledPwa = ref(
  typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)')?.matches || false)
)

function persistOfflineEvents() {
  try {
    localStorage.setItem(OFFLINE_EVENTS_KEY, JSON.stringify(savedEvents.value))
  } catch {
    // ignore storage errors
  }
}

export function useOfflineEvents() {
  const updateOnlineStatus = () => {
    browserOnline.value = navigator.onLine
  }

  const handleBeforeInstallPrompt = (e) => {
    e.preventDefault()
    deferredInstallPrompt.value = e
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      window.addEventListener('online', updateOnlineStatus)
      window.addEventListener('offline', updateOnlineStatus)
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    })

    onUnmounted(() => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    })
  }

  const isOnline = computed(() => browserOnline.value)

  function isEventSavedOffline(eventId) {
    return savedEvents.value.some((ev) => Number(ev.id) === Number(eventId))
  }

  function toggleSaveOffline(eventObj) {
    if (!eventObj || !eventObj.id) return false
    const idx = savedEvents.value.findIndex((ev) => Number(ev.id) === Number(eventObj.id))
    if (idx !== -1) {
      savedEvents.value.splice(idx, 1)
      persistOfflineEvents()
      return false
    }
    savedEvents.value.unshift({
      ...eventObj,
      saved_offline_at: new Date().toISOString()
    })
    persistOfflineEvents()
    return true
  }

  function getOfflineEventById(eventId) {
    return savedEvents.value.find((ev) => Number(ev.id) === Number(eventId)) || null
  }

  function clearOfflineEvents() {
    savedEvents.value = []
    persistOfflineEvents()
  }

  async function promptPwaInstall() {
    if (!deferredInstallPrompt.value) return false
    deferredInstallPrompt.value.prompt()
    const { outcome } = await deferredInstallPrompt.value.userChoice
    deferredInstallPrompt.value = null
    return outcome === 'accepted'
  }

  return {
    savedEvents,
    isOnline,
    canInstallPwa: computed(() => Boolean(deferredInstallPrompt.value)),
    isInstalledPwa,
    isEventSavedOffline,
    toggleSaveOffline,
    getOfflineEventById,
    clearOfflineEvents,
    promptPwaInstall
  }
}
