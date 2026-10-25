/**
 * ApexGrid — Pinia Auth & Role Store with Persisted State (Syed's Advanced Feature)
 * Manages JWT session persistence, role hierarchy getters, and account portal routing.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, getStoredToken, setStoredToken } from '../services/api'

const USER_STORAGE_KEY = 'apexgrid_auth_user'

function loadPersistedUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function savePersistedUser(userObj) {
  try {
    if (userObj) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userObj))
    } else {
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  } catch {
    // ignore storage errors
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(loadPersistedUser())
  const token = ref(getStoredToken())
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => Boolean(token.value && user.value))
  const isGuest = computed(() => !isAuthenticated.value)
  const userRole = computed(() => (user.value ? user.value.role : 'guest'))

  const isMember = computed(() => isAuthenticated.value && user.value.role === 'member')
  const isOrganizer = computed(
    () => isAuthenticated.value && ['organizer', 'admin'].includes(user.value.role)
  )
  const isAdmin = computed(() => isAuthenticated.value && user.value.role === 'admin')

  /**
   * Dedicated landing route for each account role
   */
  const roleHomeRoute = computed(() => {
    if (!isAuthenticated.value) return '/login'
    if (user.value.role === 'admin') return '/admin'
    if (user.value.role === 'organizer') return '/dashboard'
    return '/my-events'
  })

  async function login(email, password) {
    loading.value = true
    error.value = null
    try {
      const res = await api.post('/auth/login', { email, password })
      token.value = res.token
      user.value = res.user
      setStoredToken(res.token)
      savePersistedUser(res.user)
      return res.user
    } catch (err) {
      error.value = err.message || 'Login failed.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(payload) {
    loading.value = true
    error.value = null
    try {
      const res = await api.post('/auth/register', payload)
      token.value = res.token
      user.value = res.user
      setStoredToken(res.token)
      savePersistedUser(res.user)
      return res.user
    } catch (err) {
      error.value = err.message || 'Registration failed.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loginWithOAuth(payload) {
    loading.value = true
    error.value = null
    try {
      const res = await api.post('/auth/oauth', payload)
      token.value = res.token
      user.value = res.user
      setStoredToken(res.token)
      savePersistedUser(res.user)
      return res
    } catch (err) {
      error.value = err.message || 'OAuth authentication failed.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(payload) {
    loading.value = true
    error.value = null
    try {
      const res = await api.put('/auth/profile', payload)
      user.value = res.user
      savePersistedUser(res.user)
      return res.user
    } catch (err) {
      error.value = err.message || 'Failed to update profile.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function refreshSession() {
    if (!token.value) return null
    try {
      const res = await api.get('/auth/me')
      if (res && res.user) {
        user.value = res.user
        savePersistedUser(res.user)
        return res.user
      }
    } catch {
      logout()
    }
    return null
  }

  function logout() {
    token.value = null
    user.value = null
    error.value = null
    setStoredToken(null)
    savePersistedUser(null)
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isGuest,
    userRole,
    isMember,
    isOrganizer,
    isAdmin,
    roleHomeRoute,
    login,
    register,
    loginWithOAuth,
    updateProfile,
    refreshSession,
    logout
  }
})
