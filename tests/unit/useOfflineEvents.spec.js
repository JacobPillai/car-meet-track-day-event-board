/**
 * ApexGrid — Unit Tests for PWA Offline Saved Events Vault (Jacob's Feature & Gibson's QA Suite)
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useOfflineEvents } from '../../src/composables/useOfflineEvents'

const mockEvent = {
  id: 42,
  title: 'Phillip Island Track Sprint',
  venue: 'Phillip Island GP Circuit',
  region: 'Australia',
  address: '381 Back Beach Rd, Ventnor VIC 3922',
  organizer_contact: 'Jacob Pillai (+61 412 000 111)',
  price: 295
}

describe('useOfflineEvents Composable — PWA Vault Cache', () => {
  beforeEach(() => {
    localStorage.clear()
    const { clearOfflineEvents } = useOfflineEvents()
    clearOfflineEvents()
  })

  it('pins an event to the offline cache and returns true', () => {
    const { isEventSavedOffline, toggleSaveOffline, savedEvents } = useOfflineEvents()

    expect(isEventSavedOffline(42)).toBe(false)
    const added = toggleSaveOffline(mockEvent)
    expect(added).toBe(true)
    expect(isEventSavedOffline(42)).toBe(true)
    expect(savedEvents.value.length).toBe(1)
  })

  it('retrieves an offline-saved event by ID with exact gate address and contact details', () => {
    const { toggleSaveOffline, getOfflineEventById } = useOfflineEvents()

    toggleSaveOffline(mockEvent)
    const cached = getOfflineEventById(42)

    expect(cached).not.toBeNull()
    expect(cached.title).toBe('Phillip Island Track Sprint')
    expect(cached.address).toContain('381 Back Beach Rd')
    expect(cached.organizer_contact).toContain('Jacob Pillai')
    expect(cached.saved_offline_at).toBeDefined()
  })

  it('unpins/removes an event when toggleSaveOffline is called a second time', () => {
    const { isEventSavedOffline, toggleSaveOffline, savedEvents } = useOfflineEvents()

    toggleSaveOffline(mockEvent)
    expect(isEventSavedOffline(42)).toBe(true)

    // Toggle again to remove
    const addedAgain = toggleSaveOffline(mockEvent)
    expect(addedAgain).toBe(false)
    expect(isEventSavedOffline(42)).toBe(false)
    expect(savedEvents.value.length).toBe(0)
  })
})
