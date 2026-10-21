import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import exploreSource from '../../src/views/ExploreView.vue?raw'
import { compileStyle, parse } from '@vue/compiler-sfc'
import { enableAutoUnmount, flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import ExploreView from '../../src/views/ExploreView.vue'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../../src/services/api', () => ({ api: { get: mocks.get } }))
const events = [
  { id: 1, title: 'Sunday Coffee Meet', category_slug: 'meet', category_name: 'Meet', region: 'Australia', venue: 'Melbourne Park', price: 0, image: '/meet.jpg', start_datetime: '2026-11-01 09:00:00' },
  { id: 2, title: 'Sepang Track Day', category_slug: 'track-day', category_name: 'Track Day', region: 'Malaysia', venue: 'Sepang Circuit', price: 245.5, image: '/track.jpg', start_datetime: '2026-11-07 10:00:00' },
  { id: 3, title: 'Kuching Cars', category_slug: 'meet', category_name: 'Meet', region: 'Malaysia', venue: 'Kuching waterfront', price: 10, image: '', start_datetime: '2026-11-14 10:00:00' }
]
const categories = [{ id: 1, slug: 'meet', name: 'Meet' }, { id: 2, slug: 'track-day', name: 'Track Day' }]
const deferred = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
function mountExplore() {
  return mount(ExploreView, { global: { stubs: {
    RouterLink: RouterLinkStub,
    EventMap: { name: 'EventMap', props: ['events', 'initialRegion', 'showRegionControls'], emits: ['select-event', 'region-change'], template: '<div class="test-map" />' },
    EventCalendar: { name: 'EventCalendar', props: ['events'], template: '<div class="test-calendar" />' }
  } } })
}
function button(wrapper, text) { return wrapper.findAll('button').find(node => node.text() === text) }
function map(wrapper) { return wrapper.findComponent({ name: 'EventMap' }) }
function calendar(wrapper) { return wrapper.findComponent({ name: 'EventCalendar' }) }
function selectButtons(wrapper) { return wrapper.findAll('.explore-event-list button') }
enableAutoUnmount(afterEach)
beforeEach(() => {
  vi.clearAllMocks()
  mocks.get.mockImplementation(async path => path === '/categories' ? { data: categories } : { data: events, total_pages: 1 })
})

describe('Explore redesign', () => {
  it('compiles light-theme overrides onto the page and select, not the theme ancestor', () => {
    const { descriptor } = parse(exploreSource)
    const { code, errors } = compileStyle({ source: descriptor.styles[0].content, id: 'data-v-explore', scoped: true })
    expect(errors).toEqual([])
    expect(code).toContain("[data-bs-theme='light'] .explore-page[data-v-explore]")
    expect(code).toContain("[data-bs-theme='light'] .explore-region select[data-v-explore]")
  })
  it('loads categories and events independently and exposes all layout modes', async () => {
    const wrapper = mountExplore()
    expect(wrapper.get('.explore-results').attributes('aria-busy')).toBe('true')
    await flushPromises()
    expect(mocks.get).toHaveBeenCalledWith('/events', { limit: 50, page: 1 })
    expect(mocks.get).toHaveBeenCalledWith('/categories')
    expect(map(wrapper).props('events')).toHaveLength(3)
    expect(calendar(wrapper).props('events')).toHaveLength(3)
    expect(button(wrapper, 'Map + calendar').attributes('aria-pressed')).toBe('true')
    await button(wrapper, 'Map').trigger('click')
    expect(map(wrapper).exists()).toBe(true)
    expect(calendar(wrapper).exists()).toBe(false)
    await button(wrapper, 'Calendar').trigger('click')
    expect(map(wrapper).exists()).toBe(false)
    expect(calendar(wrapper).exists()).toBe(true)
    expect(wrapper.find('.explore-preview').exists()).toBe(true)
    expect(selectButtons(wrapper)).toHaveLength(3)
    await button(wrapper, 'Map + calendar').trigger('click')
    expect(map(wrapper).exists()).toBe(true)
    expect(calendar(wrapper).exists()).toBe(true)
  })

  it('combines category and region filters and keeps selection in the results', async () => {
    const wrapper = mountExplore()
    await flushPromises()
    await wrapper.get('#explore-region').setValue('Malaysia')
    expect(map(wrapper).props('initialRegion')).toBe('Malaysia')
    expect(map(wrapper).props('showRegionControls')).toBe(false)
    expect(wrapper.get('#explore-preview-heading').text()).toBe('Sepang Track Day')
    await button(wrapper, 'Meet').trigger('click')
    expect(map(wrapper).props('events').map(ev => ev.id)).toEqual([3])
    expect(calendar(wrapper).props('events').map(ev => ev.id)).toEqual([3])
    expect(wrapper.get('#explore-preview-heading').text()).toBe('Kuching Cars')
    expect(button(wrapper, 'Meet').attributes('aria-pressed')).toBe('true')
    await button(wrapper, 'Clear filters').trigger('click')
    expect(map(wrapper).props('events')).toHaveLength(3)
    expect(wrapper.get('#explore-preview-heading').text()).toBe('Kuching Cars')
    expect(wrapper.get('#explore-region').element.value).toBe('All')
  })

  it('preserves Kuching and Sepang behavior with explicit geographic guidance', async () => {
    const wrapper = mountExplore()
    await flushPromises()
    await wrapper.get('#explore-region').setValue('Kuching')
    expect(map(wrapper).props('events').map(ev => ev.id)).toEqual([3])
    expect(wrapper.text()).toContain('Kuching in the venue name')
    await wrapper.get('#explore-region').setValue('Sepang')
    expect(map(wrapper).props('events').map(ev => ev.id)).toEqual([2, 3])
    expect(wrapper.text()).toContain('results include all Malaysian events')
  })

  it('previews marker and list selection with a real detail link', async () => {
    const wrapper = mountExplore()
    await flushPromises()
    map(wrapper).vm.$emit('select-event', events[1])
    await flushPromises()
    expect(wrapper.get('#explore-preview-heading').text()).toBe('Sepang Track Day')
    expect(wrapper.get('.explore-facts').text()).toContain('RM 245.5')
    expect(selectButtons(wrapper)[1].attributes('aria-pressed')).toBe('true')
    expect(wrapper.findAllComponents(RouterLinkStub).map(link => link.props('to'))).toContain('/events/2')
    await selectButtons(wrapper)[0].trigger('click')
    expect(wrapper.get('#explore-preview-heading').text()).toBe('Sunday Coffee Meet')
    expect(wrapper.get('.explore-facts').text()).toContain('Free entry')
    map(wrapper).vm.$emit('select-event', { id: 999, title: 'Stale marker' })
    await flushPromises()
    expect(wrapper.get('#explore-preview-heading').text()).toBe('Sunday Coffee Meet')
  })

  it('keeps preview and filters when switching layouts', async () => {
    const wrapper = mountExplore()
    await flushPromises()
    await wrapper.get('#explore-region').setValue('Malaysia')
    await selectButtons(wrapper)[1].trigger('click')
    await button(wrapper, 'Calendar').trigger('click')
    expect(wrapper.get('#explore-preview-heading').text()).toBe('Kuching Cars')
    await button(wrapper, 'Map').trigger('click')
    expect(map(wrapper).props('initialRegion')).toBe('Malaysia')
    expect(map(wrapper).props('events')).toHaveLength(2)
  })

  it('shows a filter-empty state without stale preview, and can clear filters', async () => {
    const wrapper = mountExplore()
    await flushPromises()
    await wrapper.get('#explore-region').setValue('Australia')
    await button(wrapper, 'Track Day').trigger('click')
    expect(wrapper.find('.explore-preview').exists()).toBe(false)
    expect(wrapper.find('.explore-event-list').exists()).toBe(false)
    expect(wrapper.get('.explore-empty').text()).toContain('A little further afield?')
    expect(map(wrapper).props('events')).toEqual([])
    await button(wrapper, 'Show all events').trigger('click')
    expect(selectButtons(wrapper)).toHaveLength(3)
  })

  it('handles an empty collection and missing venue fields', async () => {
    mocks.get.mockResolvedValue({ data: [] })
    const wrapper = mountExplore()
    await flushPromises()
    expect(wrapper.text()).toContain('No events just yet.')
    expect(button(wrapper, 'Show all events')).toBeUndefined()
    expect(wrapper.find('.explore-preview').exists()).toBe(false)
  })

  it('offers retry after an event failure, retaining the selected filters', async () => {
    mocks.get.mockImplementation(async path => {
      if (path === '/events') throw new Error('Unavailable')
      return { data: categories }
    })
    const wrapper = mountExplore()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('We couldn’t load the events')
    expect(map(wrapper).exists()).toBe(false)
    await wrapper.get('#explore-region').setValue('Malaysia')
    mocks.get.mockResolvedValue({ data: events })
    await button(wrapper, 'Try again').trigger('click')
    await flushPromises()
    expect(map(wrapper).props('events')).toHaveLength(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('continues displaying events when categories fail and retries categories separately', async () => {
    mocks.get.mockImplementation(async path => {
      if (path === '/categories') throw new Error('Unavailable')
      return { data: events }
    })
    const wrapper = mountExplore()
    await flushPromises()
    expect(map(wrapper).props('events')).toHaveLength(3)
    expect(wrapper.text()).toContain('Event types couldn’t load')
    mocks.get.mockResolvedValue({ data: categories })
    await button(wrapper, 'Retry event types').trigger('click')
    await flushPromises()
    expect(wrapper.text()).not.toContain('Event types couldn’t load')
    expect(button(wrapper, 'Meet')).toBeTruthy()
    expect(mocks.get.mock.calls.filter(([path]) => path === '/events')).toHaveLength(1)
  })

  it('does not block events behind a slow category request', async () => {
    const pending = deferred()
    mocks.get.mockImplementation(path => path === '/categories' ? pending.promise : Promise.resolve({ data: events }))
    const wrapper = mountExplore()
    await flushPromises()
    expect(map(wrapper).props('events')).toHaveLength(3)
    expect(wrapper.text()).toContain('Loading event types')
    pending.resolve({ data: categories })
    await flushPromises()
    expect(button(wrapper, 'Meet')).toBeTruthy()
  })

  it('loads every API page before claiming a complete result count', async () => {
    const second = deferred()
    mocks.get.mockImplementation((path, params) => {
      if (path === '/categories') return Promise.resolve({ data: categories })
      return params.page === 1 ? Promise.resolve({ data: events.slice(0, 2), total_pages: 2 }) : second.promise
    })
    const wrapper = mountExplore()
    await flushPromises()
    expect(mocks.get).toHaveBeenCalledWith('/events', { limit: 50, page: 2 })
    expect(wrapper.get('.explore-results').attributes('aria-busy')).toBe('true')
    expect(map(wrapper).exists()).toBe(false)
    second.resolve({ data: events.slice(2), total_pages: 2 })
    await flushPromises()
    expect(map(wrapper).props('events')).toHaveLength(3)
    expect(wrapper.text()).toContain('3 events to explore')
  })

  it('does not present a partial collection after a later page fails', async () => {
    mocks.get.mockImplementation(async (path, params) => {
      if (path === '/categories') return { data: categories }
      if (params.page === 1) return { data: [events[0]], total_pages: 2 }
      throw new Error('Second page failed')
    })
    const wrapper = mountExplore()
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(map(wrapper).exists()).toBe(false)
    expect(wrapper.text()).not.toContain('1 event to explore')
  })

  it('provides missing/broken photo fallback and resets it on selection', async () => {
    const wrapper = mountExplore()
    await flushPromises()
    await wrapper.get('.explore-preview__image').trigger('error')
    expect(wrapper.text()).toContain('Event photo unavailable')
    await selectButtons(wrapper)[1].trigger('click')
    expect(wrapper.get('.explore-preview__image').attributes('src')).toBe('/track.jpg')
    await selectButtons(wrapper)[2].trigger('click')
    expect(wrapper.find('.explore-preview__image').exists()).toBe(false)
    expect(wrapper.text()).toContain('Event photo unavailable')
  })

  it('formats known prices and dates and avoids fabricated unknown values', async () => {
    mocks.get.mockImplementation(async path => path === '/categories' ? { data: [] } : { data: [
      { ...events[0], price: 25.75, status: 'cancelled', venue: null, start_datetime: null },
      { ...events[1], price: null, status: 'completed', start_datetime: 'bad date' }
    ] })
    const wrapper = mountExplore()
    await flushPromises()
    expect(wrapper.get('.explore-facts').text()).toContain('A$25.75')
    expect(wrapper.text()).toContain('Date to be confirmed')
    expect(wrapper.text()).toContain('See event for venue details')
    expect(wrapper.get('.explore-event-status').text()).toBe('Cancelled')
    await selectButtons(wrapper)[1].trigger('click')
    expect(wrapper.get('.explore-facts').text()).toContain('See event for entry details')
    expect(wrapper.get('.explore-event-status').text()).toBe('Completed')
  })

  it('handles incomplete venue data safely when filtering Kuching', async () => {
    mocks.get.mockResolvedValue({ data: [{ ...events[0], venue: null }] })
    const wrapper = mountExplore()
    await flushPromises()
    await wrapper.get('#explore-region').setValue('Kuching')
    expect(wrapper.get('.explore-empty').text()).toContain('A little further afield?')
    expect(map(wrapper).props('events')).toEqual([])
  })

  it('stops requesting further pages after unmount', async () => {
    const pending = deferred()
    mocks.get.mockImplementation(path => path === '/events' ? pending.promise : Promise.resolve({ data: categories }))
    const wrapper = mountExplore()
    wrapper.unmount()
    pending.resolve({ data: events, total_pages: 3 })
    await flushPromises()
    expect(mocks.get.mock.calls.filter(([path]) => path === '/events')).toHaveLength(1)
  })
})
