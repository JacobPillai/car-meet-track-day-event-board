import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'leaflet/dist/leaflet.css'
import './style.css'

import App from './App.vue'
import router from './router'
import { useThemeStore } from './stores/themeStore'
import { focusDirective } from './directives/focus'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Global Custom Directive (COS30043 Rubric)
app.directive('focus', focusDirective)

// Initialize saved theme (dark default or light mode)
useThemeStore()

// Sync aria-invalid with CSS :user-invalid state for screen readers (Modern Web Guidance)
if (typeof document !== 'undefined') {
  const syncAria = (el) => {
    if (!el || typeof el.matches !== 'function') return
    try {
      if (el.matches('input, select, textarea')) {
        el.setAttribute('aria-invalid', el.matches(':user-invalid') ? 'true' : 'false')
      }
    } catch {
      // ignore if selector unsupported in older test runner
    }
  }

  document.addEventListener('blur', (e) => syncAria(e.target), true)
  document.addEventListener('input', (e) => {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('aria-invalid')) {
      syncAria(e.target)
    }
  })
}

app.mount('#app')
