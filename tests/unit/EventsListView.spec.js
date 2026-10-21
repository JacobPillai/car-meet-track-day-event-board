import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { enableAutoUnmount, flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import EventsListView from '../../src/views/EventsListView.vue'

const mocks = vi.hoisted(() => ({ store: null, auth: null, push: vi.fn(), showToast: vi.fn() }))
vi.mock('../../src/stores/eventStore', () => ({ useEventStore: () => mocks.store }))
vi.mock('../../src/stores/authStore', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('../../src/composables/useToast', () => ({ useToast: () => ({ showToast: mocks.showToast }) }))
vi.mock('vue-router', async (importOriginal) => ({
  ...await importOriginal(), useRouter: () => ({ push: mocks.push })
}))

const defaults = {
  search: '', category: '', region: 'All', status: 'all', date_from: '',
  max_price: '', sort: 'date', page: 1, limit: 6
}
const event = { id: 12, title: 'Sunday Coffee Meet', user_liked: false }
function mountList() {
  return mount(EventsListView, {
    global: { stubs: {
      RouterLink: RouterLinkStub,
      EventCard: { props: ['event'], emits: ['toggle-like'], template: '<button class="test-like" @click="$emit(\'toggle-like\', event)">{{ event.title }}</button>' },
      SkeletonCard: { template: '<div class="test-skeleton" />' },
      PaginationBar: { props: ['page'], emits: ['change-page'], template: '<button class="test-page" @click="$emit(\'change-page\', 2)">Next</button>' }
    } }
  })
}
enableAutoUnmount(afterEach)
beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth = reactive({ isAuthenticated: false, isOrganizer: false })
  mocks.store = reactive({
    filters: { ...defaults }, categories: [{ id: 1, slug: 'meet', name: 'Meet' }],
    events: [{ ...event }], loading: false, error: null,
    pagination: { page: 1, total: 8, total_pages: 2 },
    fetchEvents: vi.fn().mockResolvedValue({}),
    fetchCategories: vi.fn().mockResolvedValue([]),
    toggleLike: vi.fn().mockResolvedValue({}),
    resetFilters: vi.fn(() => Object.assign(mocks.store.filters, defaults))
  })
})

describe('Browse Events redesign', () => {
  it('preserves incoming discovery filters and role-specific actions', async () => {
    Object.assign(mocks.store.filters, { category: 'meet', region: 'Malaysia', status: 'upcoming' })
    const wrapper = mountList()
    await flushPromises()
    expect(wrapper.get('#filter-category').element.value).toBe('meet')
    expect(wrapper.get('#filter-region').element.value).toBe('Malaysia')
    expect(mocks.store.filters.status).toBe('upcoming')
    expect(wrapper.findAllComponents(RouterLinkStub).map(link => link.props('to'))).toEqual(['/explore'])
    mocks.auth.isOrganizer = true
    await flushPromises()
    expect(wrapper.findAllComponents(RouterLinkStub).map(link => link.props('to'))).toContain('/events/new')
  })

  it('keeps every filter and resets pagination when a filter changes', async () => {
    const wrapper = mountList()
    await flushPromises()
    expect(wrapper.findAll('input, select').map(field => field.attributes('id'))).toEqual([
          'filter-search', 'filter-category', 'filter-region', 'filter-date',
          'filter-price', 'filter-status', 'filter-sort'
        ])
    mocks.store.filters.page = 3
    await wrapper.get('#filter-region').setValue('Malaysia')
    expect(mocks.store.filters.page).toBe(1)
    expect(mocks.store.fetchEvents).toHaveBeenLastCalledWith({})
    await wrapper.get('#filter-price').setValue('0')
    expect(mocks.store.filters.max_price).toBe('0')
    expect(wrapper.text()).toContain('A$ for Australia, RM for Malaysia')
    await wrapper.get('form').trigger('submit')
    expect(mocks.store.fetchEvents).toHaveBeenCalledTimes(4)
  })

  it('supports pagination without resetting the selected page', async () => {
    const wrapper = mountList()
    await flushPromises()
    await wrapper.get('.test-page').trigger('click')
    expect(mocks.store.filters.page).toBe(2)
    expect(mocks.store.fetchEvents).toHaveBeenLastCalledWith({})
  })

  it('shows loading, error/retry, and empty states separately', async () => {
    const wrapper = mountList()
    await flushPromises()
    mocks.store.loading = true
    await flushPromises()
    expect(wrapper.findAll('.test-skeleton')).toHaveLength(6)
    expect(wrapper.get('.events-results').attributes('aria-busy')).toBe('true')
    expect(wrapper.find('.test-page').exists()).toBe(false)
    mocks.store.loading = false
    mocks.store.error = 'Network unavailable'
    mocks.store.fetchEvents.mockRejectedValueOnce(new Error('Network unavailable'))
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('We couldn’t load the calendar.')
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(mocks.store.fetchEvents).toHaveBeenCalledTimes(2)
    expect(wrapper.find('.test-like').exists()).toBe(false)
    mocks.store.error = null
    mocks.store.events = []
    mocks.store.pagination.total = 0
    await flushPromises()
    expect(wrapper.text()).toContain('No events just yet.')
    expect(wrapper.text()).not.toContain('Page 1 of')
    await wrapper.get('.events-empty button').trigger('click')
    expect(mocks.store.resetFilters).toHaveBeenCalledOnce()
  })

  it('still loads events if categories fail and offers category retry', async () => {
    mocks.store.fetchCategories.mockRejectedValueOnce(new Error('Unavailable'))
    const wrapper = mountList()
    await flushPromises()
    expect(mocks.store.fetchEvents).toHaveBeenCalledOnce()
    const note = wrapper.findAll('[role="status"]').find(node => node.text().includes('Event types couldn’t load'))
    expect(note).toBeTruthy()
    await note.get('button').trigger('click')
    await flushPromises()
    expect(mocks.store.fetchCategories).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain('Event types couldn’t load')
  })

  it('redirects guests to sign in without changing likes', async () => {
    const wrapper = mountList()
    await flushPromises()
    await wrapper.get('.test-like').trigger('click')
    expect(mocks.push).toHaveBeenCalledWith({ path: '/login', query: { redirect: '/events/12' } })
    expect(mocks.store.toggleLike).not.toHaveBeenCalled()
  })

  it('handles failed likes and allows a member to retry', async () => {
    mocks.auth.isAuthenticated = true
    mocks.store.toggleLike.mockRejectedValueOnce(new Error('Could not save like'))
    const wrapper = mountList()
    await flushPromises()
    await wrapper.get('.test-like').trigger('click')
    await flushPromises()
    expect(mocks.showToast).toHaveBeenCalledWith('Could not save like', 'danger')
    await wrapper.get('.test-like').trigger('click')
    await flushPromises()
    expect(mocks.store.toggleLike).toHaveBeenCalledTimes(2)
    expect(mocks.store.toggleLike).toHaveBeenLastCalledWith(12, false)
    expect(mocks.showToast).toHaveBeenLastCalledWith('Liked "Sunday Coffee Meet"!', 'success')
  })

  it('clearly identifies the fallback city when location permission is denied', async () => {
    const getCurrentPosition = vi.fn((success, failure) => failure())
    const original = Object.getOwnPropertyDescriptor(navigator, 'geolocation')
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition } })
    try {
      mocks.store.filters.region = 'Malaysia'
      const wrapper = mountList()
      await flushPromises()
      const button = wrapper.findAll('button').find(node => node.text().includes('Use my location'))
      await button.trigger('click')
      await flushPromises()
      expect(wrapper.get('.events-location-note').text()).toContain('Sepang, Malaysia, not your location')
      expect(mocks.store.filters.sort).toBe('distance')
      expect(mocks.store.fetchEvents).toHaveBeenLastCalledWith({ lat: 2.7608, lng: 101.7383 })
    } finally {
      if (original) Object.defineProperty(navigator, 'geolocation', original)
      else delete navigator.geolocation
    }
  })
})
