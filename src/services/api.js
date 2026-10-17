/**
 * ApexGrid — Unified Dual-Mode REST API Client (Jacob's API Wiring Layer)
 *
 * Automatically connects to the Swinburne Mercury PHP REST API (`api/index.php?endpoint=...`)
 * when deployed on Mercury or when `VITE_API_URL` is configured, and seamlessly falls back
 * to the stateful local relational engine (`localDb.js`) during local Vite development
 * or offline PWA sessions.
 */

import { handleLocalRequest } from './localDb'

const TOKEN_STORAGE_KEY = 'apexgrid_jwt_token'

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

async function request(method, endpoint, { params = {}, body = null } = {}) {
  const token = getStoredToken()

  if (shouldAttemptPhpApi() && navigator.onLine) {
    try {
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

      const res = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      })

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await res.json()
        if (!res.ok) {
          const err = new Error(data.error || data.message || `API Error (${res.status})`)
          err.status = res.status
          throw err
        }
        return data
      }
    } catch (err) {
      if (err.status && err.status !== 503) {
        throw err
      }
      console.info('[ApexGrid API] PHP endpoint unreachable, using stateful local DB engine.')
    }
  }

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
