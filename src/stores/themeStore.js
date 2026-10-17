/**
 * ApexGrid — Theme & Accessibility Store (Dark Carbon Default + Light Mode Toggle)
 */

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const THEME_STORAGE_KEY = 'apexgrid_theme_mode'

export const useThemeStore = defineStore('theme', () => {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null
  const theme = ref(saved === 'light' ? 'light' : 'dark')

  function applyTheme(mode) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-bs-theme', mode)
    }
  }

  applyTheme(theme.value)

  watch(theme, (newMode) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newMode)
    } catch {
      // ignore
    }
    applyTheme(newMode)
  })

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return {
    theme,
    toggleTheme
  }
})
