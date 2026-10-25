/**
 * ApexGrid — Unit Tests for Pinia Auth Store, Role Portals & Local REST Engine
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../src/stores/authStore'
import { resetLocalDb, handleLocalRequest } from '../../src/services/localDb'
import { decodeWmoWeather } from '../../src/services/externalApis'

describe('Pinia authStore & Role Visibility Engine', () => {
  beforeEach(() => {
    localStorage.clear()
    resetLocalDb()
    setActivePinia(createPinia())
  })

  it('starts as Guest and locks member-only event address and contact', async () => {
    const authStore = useAuthStore()
    expect(authStore.isGuest).toBe(true)
    expect(authStore.roleHomeRoute).toBe('/login')

    const eventRes = await handleLocalRequest('GET', '/events/1')
    expect(eventRes.data.address_locked).toBe(true)
    expect(eventRes.data.address).toContain('Members Only')
  })

  it('authenticates Member, Organizer, and Admin roles to their dedicated portals and unlocks addresses', async () => {
    const authStore = useAuthStore()

    // 1. Login as Member
    await authStore.login('member@apexgrid.com', 'Password123!')
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.isMember).toBe(true)
    expect(authStore.roleHomeRoute).toBe('/my-events')

    // Member unlocks exact address
    const eventRes = await handleLocalRequest('GET', '/events/1', {}, {}, authStore.token)
    expect(eventRes.data.address_locked).toBe(false)
    expect(eventRes.data.address).toContain('591-659 Princes Hwy')

    // 2. Login as Organizer
    authStore.logout()
    await authStore.login('organizer@apexgrid.com', 'Password123!')
    expect(authStore.isOrganizer).toBe(true)
    expect(authStore.roleHomeRoute).toBe('/dashboard')

    // 3. Login as Admin
    authStore.logout()
    await authStore.login('admin@apexgrid.com', 'Password123!')
    expect(authStore.isAdmin).toBe(true)
    expect(authStore.roleHomeRoute).toBe('/admin')
  })

  it('authenticates existing and newly provisioned users via OAuth 2.0 (/auth/oauth) and decodes circuit weather codes', async () => {
    const authStore = useAuthStore()

    // 1. Existing user OAuth login (Google OAuth)
    const existingRes = await authStore.loginWithOAuth({
      provider: 'google',
      name: 'Naveed Khan',
      email: 'naveed@apexgrid.com',
      oauth_id: 'google_oauth_naveed'
    })
    expect(existingRes.is_new_user).toBe(false)
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user.oauth_provider).toBe('google')
    expect(authStore.roleHomeRoute).toBe('/dashboard')

    // 2. Provision brand-new OAuth account (GitHub OAuth)
    authStore.logout()
    const newRes = await authStore.loginWithOAuth({
      provider: 'github',
      name: 'Liam Lawson',
      email: 'liam.lawson@apexgrid.com',
      role: 'member',
      region: 'Australia',
      vehicle: '2024 Honda Civic Type R (FL5)'
    })
    expect(newRes.is_new_user).toBe(true)
    expect(authStore.user.email).toBe('liam.lawson@apexgrid.com')
    expect(authStore.user.oauth_provider).toBe('github')
    expect(authStore.user.vehicle).toBe('2024 Honda Civic Type R (FL5)')

    // 3. External REST API weather decoder check
    const dryTrack = decodeWmoWeather(0, 5)
    expect(dryTrack.surface).toContain('Dry')
    const wetTrack = decodeWmoWeather(63, 85)
    expect(wetTrack.surface).toContain('Wet')
  })
})
