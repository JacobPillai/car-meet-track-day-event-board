import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, reactive } from 'vue'
import { enableAutoUnmount, flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import HomeView from '../../src/views/HomeView.vue'

const mocks = vi.hoisted(() => ({
  eventStore: null,
  authStore: null,
  push: vi.fn(),
  showToast: vi.fn()
}))

vi.mock('../../src/stores/eventStore', () => ({ useEventStore: () => mocks.eventStore }))
vi.mock('../../src/stores/authStore', () => ({ useAuthStore: () => mocks.authStore }))
vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast })
}))
vi.mock('vue-router', async (importOriginal) => ({
  ...await importOriginal(),
  useRouter: () => ({ push: mocks.push })
}))

const EventCardStub = defineComponent({
  name: 'EventCard',
  props: { event: { type: Object, required: true } },
  emits: ['toggle-like'],
  template: `<article class="test-event-card">
    <h3>{{ event.title }}</h3>
    <button :aria-pressed="Boolean(event.user_liked)" @click="$emit('toggle-like', event)">
      Like {{ event.likes_count }}
    </button>
  </article>`
})

const categoryFixtures = [
  { id: 1, slug: 'autocross', name: 'Autocross' },
  { id: 2, slug: 'drag', name: 'Drag' },
  { id: 3, slug: 'track-day', name: 'Track Days' },
  { id: 4, slug: 'drift', name: 'Drift' },
  { id: 5, slug: 'cruise', name: 'Cruises' },
  { id: 6, slug: 'show', name: 'Shows' },
  { id: 7, slug: 'meet', name: 'Meets' },
  { id: 8, slug: 'other', name: 'Other' }
]
const clubFixture = { id: 8, name: 'Weekend Drivers', city: 'Melbourne', region: 'Australia' }
const upcomingSelector = '[aria-labelledby="upcoming-title"]'
const clubsSelector = '[aria-labelledby="clubs-title"]'
const discoverySelector = '#find-events'
const defaultFilters = {
  search: '', category: '', region: 'All', status: 'all', date_from: '',
  max_price: '', sort: 'date', page: 1, limit: 6
}
const staleFilters = {
  search: 'Old search', category: 'drag', region: 'Australia', status: 'completed',
  date_from: '2020-01-01', max_price: 50, sort: 'likes', page: 9, limit: 24
}

function deferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function mountHome() {
  return mount(HomeView, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        EventCard: EventCardStub,
        SkeletonCard: { template: '<div class="test-skeleton" />' }
      }
    }
  })
}

function likeButton(wrapper, index = 0) {
  return wrapper.findAllComponents(EventCardStub)[index].get('button')
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.push.mockReset().mockResolvedValue(undefined)
  mocks.authStore = reactive({ isAuthenticated: false })
  mocks.eventStore = reactive({
    categories: [],
    filters: { ...staleFilters },
    fetchEvents: vi.fn().mockResolvedValue({ data: [
      { id: 21, title: 'Sunday Coffee Meet', user_liked: false, likes_count: 4 },
      { id: 22, title: 'Coastal Cruise', user_liked: false, likes_count: 2 }
    ] }),
    fetchClubs: vi.fn().mockResolvedValue([{ ...clubFixture }]),
    fetchCategories: vi.fn().mockImplementation(async () => {
      mocks.eventStore.categories = categoryFixtures.map(category => ({ ...category }))
      return mocks.eventStore.categories
    }),
    resetFilters: vi.fn().mockImplementation(() => {
      Object.assign(mocks.eventStore.filters, defaultFilters)
    }),
    toggleLike: vi.fn().mockResolvedValue({})
  })
})

describe('HomeView data loading', () => {
  it('requests unfiltered upcoming discovery without changing persisted list filters', async () => {
    const wrapper = mountHome()
    expect(wrapper.get(upcomingSelector).attributes('aria-busy')).toBe('true')
    expect(wrapper.findAll('.test-skeleton')).toHaveLength(3)
    expect(mocks.eventStore.fetchEvents.mock.calls).toEqual([[{
      search: '', category: '', region: '', date_from: '', max_price: '',
      status: 'upcoming', sort: 'date', page: 1, limit: 6
    }]])
    expect(mocks.eventStore.fetchClubs.mock.calls).toEqual([[]])
    expect(mocks.eventStore.fetchCategories.mock.calls).toEqual([[]])
    expect(mocks.eventStore.resetFilters).not.toHaveBeenCalled()
    expect(mocks.eventStore.filters).toEqual(staleFilters)
    await flushPromises()
    expect(wrapper.get(upcomingSelector).attributes('aria-busy')).toBe('false')
    expect(wrapper.findAllComponents(EventCardStub)).toHaveLength(2)
    expect(wrapper.findAll('.test-skeleton')).toHaveLength(0)
  })

  it.each(['events', 'clubs', 'categories'])('does not let pending %s block the other data sections', async (resource) => {
    const pending = deferred()
    const action = { events: 'fetchEvents', clubs: 'fetchClubs', categories: 'fetchCategories' }[resource]
    mocks.eventStore[action].mockReturnValueOnce(pending.promise)
    const wrapper = mountHome()
    await flushPromises()

    expect(mocks.eventStore.fetchEvents).toHaveBeenCalledTimes(1)
    expect(mocks.eventStore.fetchClubs).toHaveBeenCalledTimes(1)
    expect(mocks.eventStore.fetchCategories).toHaveBeenCalledTimes(1)
    if (resource !== 'events') expect(wrapper.findAllComponents(EventCardStub)).toHaveLength(2)
    else expect(wrapper.get(upcomingSelector).attributes('aria-busy')).toBe('true')
    if (resource !== 'clubs') expect(wrapper.get(clubsSelector).text()).toContain(clubFixture.name)
    if (resource !== 'categories') expect(wrapper.findAll('.community-scene')).toHaveLength(8)

    if (resource === 'categories') mocks.eventStore.categories = categoryFixtures.map(category => ({ ...category }))
    pending.resolve(resource === 'events' ? { data: [] } : [])
    await flushPromises()
    expect(wrapper.get(upcomingSelector).attributes('aria-busy')).toBe('false')
  })

  it.each([
    ['events', 'fetchEvents', upcomingSelector, "We couldn't load the events."],
    ['clubs', 'fetchClubs', clubsSelector, "We couldn't load the clubs."],
    ['categories', 'fetchCategories', discoverySelector, "Event types couldn't load."]
  ])('isolates a %s failure and retries only that request', async (resource, action, selector, message) => {
    mocks.eventStore[action].mockRejectedValueOnce(new Error('Network unavailable'))
    const wrapper = mountHome()
    await flushPromises()
    const section = wrapper.get(selector)
    expect(section.text()).toContain(message)
    expect(section.find(resource === 'categories' ? '[role="status"]' : '[role="alert"]').exists()).toBe(true)
    if (resource !== 'events') expect(wrapper.findAllComponents(EventCardStub)).toHaveLength(2)
    if (resource !== 'clubs') expect(wrapper.get(clubsSelector).text()).toContain(clubFixture.name)
    if (resource !== 'categories') expect(wrapper.findAll('.community-scene')).toHaveLength(8)

    await section.get(resource === 'categories' ? '[role="status"] button' : '[role="alert"] button').trigger('click')
    await flushPromises()
    expect(section.text()).not.toContain(message)
    for (const name of ['fetchEvents', 'fetchClubs', 'fetchCategories']) {
      expect(mocks.eventStore[name]).toHaveBeenCalledTimes(name === action ? 2 : 1)
    }
    expect(wrapper.findAllComponents(EventCardStub)).toHaveLength(2)
    expect(wrapper.get(clubsSelector).text()).toContain(clubFixture.name)
    expect(wrapper.findAll('.community-scene')).toHaveLength(8)
    expect(mocks.showToast).not.toHaveBeenCalled()
  })

  it('clears the event error and exposes loading while a retry is pending', async () => {
    const retry = deferred()
    mocks.eventStore.fetchEvents.mockRejectedValueOnce(new Error('Offline')).mockReturnValueOnce(retry.promise)
    const wrapper = mountHome()
    await flushPromises()
    await wrapper.get(`${upcomingSelector} button`).trigger('click')
    expect(wrapper.get(upcomingSelector).attributes('aria-busy')).toBe('true')
    expect(wrapper.find(`${upcomingSelector} [role="alert"]`).exists()).toBe(false)
    expect(wrapper.findAll('.test-skeleton')).toHaveLength(3)
    retry.resolve({ data: [] })
    await flushPromises()
    expect(wrapper.get(upcomingSelector).attributes('aria-busy')).toBe('false')
    expect(wrapper.get(upcomingSelector).text()).toContain('No upcoming events are listed.')
  })

  it.each([{ data: [] }, {}])('shows a useful event empty state for response %j', async (response) => {
    mocks.eventStore.fetchEvents.mockResolvedValueOnce(response)
    const wrapper = mountHome()
    await flushPromises()
    expect(wrapper.get(upcomingSelector).text()).toContain('No upcoming events are listed.')
    expect(wrapper.get(upcomingSelector).findComponent(RouterLinkStub).props('to')).toBe('/events')
    expect(wrapper.findAllComponents(EventCardStub)).toHaveLength(0)
    expect(wrapper.find(`${upcomingSelector} [role="alert"]`).exists()).toBe(false)
  })

  it('handles empty clubs and categories without presenting them as request errors', async () => {
    mocks.eventStore.fetchClubs.mockResolvedValueOnce([])
    mocks.eventStore.fetchCategories.mockResolvedValueOnce([])
    const wrapper = mountHome()
    await flushPromises()
    expect(wrapper.get(clubsSelector).text()).toContain("Clubs will appear here when they're available.")
    expect(wrapper.find('[aria-labelledby="scene-title"]').exists()).toBe(false)
    expect(wrapper.findAll('#home-category option')).toHaveLength(1)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get(discoverySelector).text()).not.toContain("Event types couldn't load.")
  })
})

describe('HomeView discovery and navigation', () => {
  it('orders categories community-first in both controls without mutating store order', async () => {
    const wrapper = mountHome()
    await flushPromises()
    const orderedSlugs = ['meet', 'show', 'cruise', 'drift', 'track-day', 'drag', 'autocross', 'other']
    expect(wrapper.findAll('#home-category option').slice(1).map(option => option.element.value)).toEqual(orderedSlugs)
    const names = orderedSlugs.map(slug => categoryFixtures.find(category => category.slug === slug).name)
    expect(wrapper.findAll('.community-scene strong').map(title => title.text())).toEqual(names)
    expect(mocks.eventStore.categories.map(category => category.slug)).toEqual(categoryFixtures.map(category => category.slug))
    expect(wrapper.findAll('.community-scene').at(-1).text()).toContain('Discover something different.')
  })

  it('resets stale filters before applying trimmed search, region, category, date and upcoming date sort', async () => {
    const wrapper = mountHome()
    await flushPromises()
    await wrapper.get('#home-keyword').setValue('  coffee meet  ')
    await wrapper.get('#home-region').setValue('Malaysia')
    await wrapper.get('#home-category').setValue('meet')
    await wrapper.get('#home-date').setValue('2026-11-14')
    await wrapper.get('form[role="search"]').trigger('submit')

    expect(mocks.eventStore.resetFilters).toHaveBeenCalledTimes(1)
    expect(mocks.eventStore.filters).toEqual({
      ...defaultFilters, search: 'coffee meet', region: 'Malaysia', category: 'meet',
      date_from: '2026-11-14', status: 'upcoming', sort: 'date'
    })
    expect(mocks.push.mock.calls).toEqual([['/events']])
    expect(mocks.eventStore.resetFilters.mock.invocationCallOrder[0]).toBeLessThan(mocks.push.mock.invocationCallOrder[0])
  })

  it('lets a blank search clear stale constraints and browse all upcoming events', async () => {
    const wrapper = mountHome()
    await flushPromises()
    await wrapper.get('#home-keyword').setValue('   ')
    await wrapper.get('form').trigger('submit')
    expect(mocks.eventStore.filters).toEqual({ ...defaultFilters, status: 'upcoming' })
    expect(mocks.push).toHaveBeenCalledWith('/events')
  })

  it('keeps location/date search usable after categories fail', async () => {
    mocks.eventStore.fetchCategories.mockRejectedValueOnce(new Error('Categories unavailable'))
    const wrapper = mountHome()
    await flushPromises()
    await wrapper.get('#home-region').setValue('Australia')
    await wrapper.get('#home-date').setValue('2026-12-01')
    await wrapper.get('form').trigger('submit')
    expect(mocks.eventStore.filters).toEqual({
      ...defaultFilters, region: 'Australia', date_from: '2026-12-01', status: 'upcoming'
    })
    expect(mocks.push).toHaveBeenCalledWith('/events')
  })

  it.each(['meet', 'track-day', 'other'])('navigates the %s category with clean upcoming filters', async (slug) => {
    const wrapper = mountHome()
    await flushPromises()
    const name = categoryFixtures.find(category => category.slug === slug).name
    const button = wrapper.findAll('.community-scene').find(scene => scene.get('strong').text() === name)
    await button.trigger('click')
    expect(mocks.eventStore.resetFilters).toHaveBeenCalledTimes(1)
    expect(mocks.eventStore.filters).toEqual({ ...defaultFilters, category: slug, status: 'upcoming' })
    expect(mocks.push.mock.calls).toEqual([['/events']])
  })
})

describe('HomeView likes', () => {
  it('redirects guests to sign in with the event detail as the return destination', async () => {
    const wrapper = mountHome()
    await flushPromises()
    await likeButton(wrapper).trigger('click')
    await flushPromises()
    expect(mocks.eventStore.toggleLike).not.toHaveBeenCalled()
    expect(mocks.push.mock.calls).toEqual([[{ path: '/login', query: { redirect: '/events/21' } }]])
    expect(mocks.showToast.mock.calls).toEqual([['Sign in to like events.', 'info']])
    expect(likeButton(wrapper).attributes('aria-pressed')).toBe('false')
    expect(likeButton(wrapper).text()).toBe('Like 4')
  })

  it.each([
    [false, 4, true, 5, 'Event liked.'],
    [true, 4, false, 3, 'Like removed.'],
    [true, 0, false, 0, 'Like removed.'],
    [false, '4', true, 5, 'Event liked.']
  ])('updates a successful like from state %s/count %s only after the request resolves', async (liked, count, nextLiked, nextCount, message) => {
    mocks.authStore.isAuthenticated = true
    mocks.eventStore.fetchEvents.mockResolvedValueOnce({ data: [
      { id: 21, title: 'Sunday Coffee Meet', user_liked: liked, likes_count: count }
    ] })
    const pending = deferred()
    mocks.eventStore.toggleLike.mockReturnValueOnce(pending.promise)
    const wrapper = mountHome()
    await flushPromises()
    await likeButton(wrapper).trigger('click')
    expect(mocks.eventStore.toggleLike.mock.calls).toEqual([[21, liked]])
    expect(likeButton(wrapper).attributes('aria-pressed')).toBe(String(liked))
    expect(likeButton(wrapper).text()).toBe(`Like ${count}`)
    expect(mocks.showToast).not.toHaveBeenCalled()
    pending.resolve({})
    await flushPromises()
    expect(likeButton(wrapper).attributes('aria-pressed')).toBe(String(nextLiked))
    expect(likeButton(wrapper).text()).toBe(`Like ${nextCount}`)
    expect(mocks.showToast.mock.calls).toEqual([[message, 'success']])
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it.each([false, true])('handles a rejected like for state %s without mutation and allows retry', async (liked) => {
    mocks.authStore.isAuthenticated = true
    mocks.eventStore.fetchEvents.mockResolvedValueOnce({ data: [
      { id: 21, title: 'Sunday Coffee Meet', user_liked: liked, likes_count: 4 }
    ] })
    mocks.eventStore.toggleLike.mockRejectedValueOnce(new Error('Like service unavailable'))
    const wrapper = mountHome()
    await flushPromises()
    await likeButton(wrapper).trigger('click')
    await flushPromises()
    expect(likeButton(wrapper).attributes('aria-pressed')).toBe(String(liked))
    expect(likeButton(wrapper).text()).toBe('Like 4')
    expect(mocks.showToast.mock.calls).toEqual([['Could not update your like. Please try again.', 'danger']])

    await likeButton(wrapper).trigger('click')
    await flushPromises()
    expect(mocks.eventStore.toggleLike).toHaveBeenCalledTimes(2)
    expect(mocks.eventStore.toggleLike).toHaveBeenLastCalledWith(21, liked)
    expect(likeButton(wrapper).attributes('aria-pressed')).toBe(String(!liked))
    expect(likeButton(wrapper).text()).toBe(`Like ${liked ? 3 : 5}`)
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('deduplicates in-flight likes per event without blocking another event', async () => {
    mocks.authStore.isAuthenticated = true
    const pending = deferred()
    mocks.eventStore.toggleLike.mockReturnValueOnce(pending.promise)
    const wrapper = mountHome()
    await flushPromises()
    await likeButton(wrapper).trigger('click')
    await likeButton(wrapper).trigger('click')
    expect(mocks.eventStore.toggleLike).toHaveBeenCalledTimes(1)
    await likeButton(wrapper, 1).trigger('click')
    await flushPromises()
    expect(mocks.eventStore.toggleLike).toHaveBeenCalledTimes(2)
    expect(likeButton(wrapper, 1).attributes('aria-pressed')).toBe('true')
    pending.resolve({})
    await flushPromises()
    expect(likeButton(wrapper).attributes('aria-pressed')).toBe('true')

    await likeButton(wrapper).trigger('click')
    await flushPromises()
    expect(mocks.eventStore.toggleLike).toHaveBeenCalledTimes(3)
    expect(mocks.eventStore.toggleLike).toHaveBeenLastCalledWith(21, true)
    expect(likeButton(wrapper).attributes('aria-pressed')).toBe('false')
  })
})
