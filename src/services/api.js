/**
 * ApexGrid — Unified Dual-Mode REST API Client (Jacob's API Wiring Layer)
 *
 * On Mercury, or when `VITE_USE_PHP_API=true`, every call goes to the PHP REST API
 * (`api/index.php?endpoint=...`) and errors are shown, never hidden. Otherwise (plain local
 * Vite development) the stateful local engine (`localDb.js`) stands in for the backend.
 * Offline reads in PHP mode are served from the local engine.
 */

import { handleLocalRequest } from './localDb'

const TOKEN_STORAGE_KEY = 'apexgrid_jwt_token'
let activeBackendEngine = 'local-db'
let totalApiRequests = 0

export function getApiEngineTelemetry() {
  const isMercuryHost =
    typeof window !== 'undefined' &&
    ((window.location.hostname || '').includes('swin.edu.au') ||
      (window.location.hostname || '').includes('mercury'))
  return {
    mode: activeBackendEngine,
    label:
      activeBackendEngine === 'php-mysql'
        ? 'PHP 5.4 + MariaDB (Swinburne Mercury)'
        : 'LocalDB Relational Engine (7 Tables)',
    isMercuryHost,
    totalApiRequests,
    online: typeof navigator !== 'undefined' ? navigator.onLine : true
  }
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Determine whether we should attempt the remote PHP endpoint first.
 * On Swinburne Mercury (`mercury.swin.edu.au`), PHP runs in `./api/index.php`.
 */
function shouldAttemptPhpApi() {
  if (typeof window === 'undefined') return false
  if (import.meta.env && import.meta.env.VITE_USE_PHP_API === 'true') return true
  const host = window.location.hostname || ''
  return host.includes('swin.edu.au') || host.includes('mercury')
}

function apiError(message, status) {
  const err = new Error(message)
  err.status = status
  return err
}

async function request(method, endpoint, { params = {}, body = null } = {}) {
  const token = getStoredToken()
  totalApiRequests += 1

  // PHP mode (Mercury, or VITE_USE_PHP_API=true) is strict: MySQL is the only source of truth.
  // We never quietly fall back to localStorage, because the demo would look fine while
  // nothing reached the database.
  if (shouldAttemptPhpApi()) {
    if (!navigator.onLine) {
      if (method === 'GET') {
        activeBackendEngine = 'local-db'
        return handleLocalRequest(method, endpoint, params, {}, token)
      }
      throw apiError('You are offline. Reconnect to save changes.', 503)
    }

    const baseUrl = (import.meta.env && import.meta.env.VITE_API_BASE_URL) || './api/index.php'
    const url = new URL(baseUrl, window.location.href)
    url.searchParams.set('endpoint', endpoint)
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v))
      }
    })

    const headers = { 'Content-Type': 'application/json' }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    let res
    try {
      res = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      })
    } catch {
      throw apiError('Cannot reach the ApexGrid server. Please try again.', 503)
    }

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      throw apiError('The server sent an unexpected response. Check the PHP API setup.', 502)
    }
    const data = await res.json()
    if (!res.ok) {
      throw apiError(data.error || data.message || `API Error (${res.status})`, res.status)
    }
    activeBackendEngine = 'php-mysql'
    return data
  }

  activeBackendEngine = 'local-db'
  return handleLocalRequest(method, endpoint, params, body || {}, token)
}

export const api = {
  get(endpoint, params = {}) {
    return request('GET', endpoint, { params })
  },
  post(endpoint, body = {}, params = {}) {
    return request('POST', endpoint, { params, body })
  },
  put(endpoint, body = {}, params = {}) {
    return request('PUT', endpoint, { params, body })
  },
  delete(endpoint, params = {}) {
    return request('DELETE', endpoint, { params })
  }
}
