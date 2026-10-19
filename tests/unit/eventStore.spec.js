/**
 * ApexGrid — Unit Tests for Pinia Event Store & Search/Filter Pipeline (Gibson's QA Suite)
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEventStore } from '../../src/stores/eventStore'
import { resetLocalDb } from '../../src/services/localDb'

describe('Pinia eventStore — Filters, Categories & Pagination', () => {
  beforeEach(() => {
    localStorage.clear()
    resetLocalDb()
    setActivePinia(createPinia())
  })

  it('fetches categories and initializes the standard motorsport disciplines', async () => {
    const store = useEventStore()
    expect(store.categories.length).toBe(0)

    const cats = await store.fetchCategories()
    expect(cats.length).toBeGreaterThanOrEqual(6)
    expect(store.categories.map((c) => c.slug)).toContain('track-day')
    expect(store.categories.map((c) => c.slug)).toContain('drift')
  })

  it('filters events by search keyword and region', async () => {
    const store = useEventStore()

    // Search for Sandown
    store.filters.search = 'Sandown'
    const res = await store.fetchEvents()
    expect(res.data.length).toBeGreaterThan(0)
    expect(res.data.every((e) => e.title.includes('Sandown') || e.venue.includes('Sandown'))).toBe(true)

    // Filter by Malaysia region
    store.filters.search = ''
    store.filters.region = 'Malaysia'
    const myRes = await store.fetchEvents()
    expect(myRes.data.length).toBeGreaterThan(0)
    expect(myRes.data.every((e) => e.region === 'Malaysia')).toBe(true)
  })

  it('resets filters cleanly back to default values', () => {
    const store = useEventStore()
    store.filters.search = 'Drift'
    store.filters.category = 'drift'
    store.filters.region = 'Australia'
    store.filters.max_price = 100
    store.filters.page = 3

    store.resetFilters()

    expect(store.filters.search).toBe('')
    expect(store.filters.category).toBe('')
    expect(store.filters.region).toBe('All')
    expect(store.filters.max_price).toBe('')
    expect(store.filters.page).toBe(1)
  })
})
