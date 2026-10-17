/**
 * ApexGrid — Zero-Dependency Global Toast Notification System
 * Keeps the Mercury production bundle lightweight while providing real-time UI feedback.
 */
import { ref } from 'vue'

const toasts = ref([])
let nextToastId = 1

export function useToast() {
  function showToast(message, type = 'success', duration = 3600) {
    const id = nextToastId++
    toasts.value.push({ id, message, type })
    if (duration > 0 && typeof window !== 'undefined') {
      window.setTimeout(() => {
        dismissToast(id)
      }, duration)
    }
  }

  function dismissToast(id) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) {
      toasts.value.splice(idx, 1)
    }
  }

  return {
    toasts,
    showToast,
    dismissToast
  }
}
