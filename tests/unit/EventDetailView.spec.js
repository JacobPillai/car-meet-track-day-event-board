import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { enableAutoUnmount, flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import EventDetailView from '../../src/views/EventDetailView.vue'

const mocks = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  auth: null,
  route: null,
  offline: null,
  push: vi.fn(),
  showToast: vi.fn(),
  isEventSavedOffline: vi.fn(),
  toggleSaveOffline: vi.fn(),
  getOfflineEventById: vi.fn()
}))
vi.mock('../../src/services/api', () => ({ api: mocks.api }))
vi.mock('../../src/stores/authStore', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('../../src/composables/useToast', () => ({ useToast: () => ({ showToast: mocks.showToast }) }))
vi.mock('../../src/composables/useOfflineEvents', () => ({
  useOfflineEvents: () => ({
    isEventSavedOffline: mocks.isEventSavedOffline,
    toggleSaveOffline: mocks.toggleSaveOffline,
    getOfflineEventById: mocks.getOfflineEventById
  })
}))
vi.mock('vue-router', async (importOriginal) => ({
  ...await importOriginal(),
  useRoute: () => mocks.route,
  useRouter: () => ({ push: mocks.push })
}))

const eventFixture = {
  id: 42,
  title: 'Sepang Saturday Track Day',
  description: 'An open community track day. Bring your own helmet.',
  category_name: 'Track Day',
  category_slug: 'track-day',
  category_icon: 'bi-flag',
  region: 'Malaysia',
  city: 'Sepang',
  venue: 'Sepang International Circuit',
  address: 'Private Gate 7, Jalan Pekeliling',
  organizer_contact: 'Organiser hotline +60 12 345 6789',
  latitude: 2.7608,
  longitude: 101.7383,
  organizer_id: 7,
  organizer_name: 'Sepang Drivers Club',
  price: 125,
  capacity: 30,
  going_count: 12,
  interested_count: 4,
  likes_count: 8,
  user_liked: false,
  user_rsvp_status: null,
  status: 'upcoming',
  start_datetime: '2026-11-14 09:00:00',
  end_datetime: '2026-11-14 17:00:00'
}
const commentFixture = {
  id: 81, user_id: 9, user_name: 'Alex Driver', user_role: 'member',
  body: 'Meet at the petrol station first?', rating: 4, created_at: '2026-10-20 12:00:00'
}
let serverEvent
let serverComments
let clipboardDescriptor

function deferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
function mountDetail() {
  return mount(EventDetailView, {
    global: { stubs: {
      RouterLink: RouterLinkStub,
      EventMap: { template: '<div role="img" aria-label="Event location map" />' }
    } }
  })
}
function namedButton(wrapper, name) {
  const button = wrapper.findAll('button').find(node =>
    (node.attributes('aria-label') || node.text()).replace(/\s+/g, ' ').trim() === name
  )
  expect(button, `Expected a button named "${name}"`).toBeTruthy()
  return button
}
function expectEventVisible(wrapper, title = eventFixture.title) {
  expect(wrapper.get('h1').text()).toBe(title)
}
function expectInlineError(wrapper, message) {
  expect(wrapper.findAll('[role="alert"]').some(node => node.text().includes(message))).toBe(true)
  expectEventVisible(wrapper)
}
function eventFetches(id = 42) {
  return mocks.api.get.mock.calls.filter(([url]) => url === `/events/${id}`)
}
async function submitComment(wrapper) {
  await namedButton(wrapper, 'Post comment').trigger('submit')
}

// These tests deliberately interact with rendered controls, not script-setup state.
enableAutoUnmount(afterEach)
beforeEach(() => {
  vi.resetAllMocks()
  clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
  mocks.auth = reactive({
    isAuthenticated: true, isOrganizer: false, isAdmin: false,
    user: { id: 9, name: 'Alex Driver', role: 'member' }
  })
  mocks.route = reactive({ params: { id: '42' }, fullPath: '/events/42?from=calendar#comments' })
  mocks.offline = reactive({ saved: false })
  serverEvent = { ...eventFixture }
  serverComments = [{ ...commentFixture }]
  mocks.api.get.mockImplementation(async url => {
    if (url === '/events/42') return { data: { ...serverEvent } }
    if (url === '/events/42/comments') return { data: serverComments.map(comment => ({ ...comment })) }
    throw new Error(`Unexpected GET ${url}`)
  })
  mocks.api.post.mockResolvedValue({})
  mocks.api.delete.mockResolvedValue({})
  mocks.isEventSavedOffline.mockImplementation(() => mocks.offline.saved)
  mocks.toggleSaveOffline.mockImplementation(() => {
    mocks.offline.saved = !mocks.offline.saved
    return mocks.offline.saved
  })
  mocks.getOfflineEventById.mockReturnValue(null)
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})
afterEach(() => {
  vi.restoreAllMocks()
  if (clipboardDescriptor) Object.defineProperty(navigator, 'clipboard', clipboardDescriptor)
  else delete navigator.clipboard
})

describe('EventDetailView redesign', () => {
  it('loads event and comments independently and shows only the supplied schedule', async () => {
    const comments = deferred()
    mocks.api.get.mockImplementation(url => url.endsWith('/comments')
      ? comments.promise : Promise.resolve({ data: { ...serverEvent } }))
    const wrapper = mountDetail()
    await flushPromises()
    expect(mocks.api.get).toHaveBeenCalledWith('/events/42')
    expect(mocks.api.get).toHaveBeenCalledWith('/events/42/comments')
    expectEventVisible(wrapper)
    expect(wrapper.text()).toContain(eventFixture.description)
    expect(wrapper.text()).toContain('RM')
    expect(wrapper.text()).toMatch(/09:00|9:00\s*(?:am)?/i)
    expect(wrapper.text()).toMatch(/17:00|5:00\s*pm/i)
    expect(wrapper.text()).not.toMatch(/scrutineering|compulsory drivers|marshals briefing|sighting laps|sound test|transponder pickup|garage allocation/i)
    expect(wrapper.text()).not.toContain('Meet at the petrol station first?')
    comments.resolve({ data: [{ ...commentFixture }] })
    await flushPromises()
    expect(wrapper.text()).toContain(commentFixture.body)
    expect(wrapper.text()).toMatch(/4\s*\/\s*5/)
  })

  it('protects guest address/contact and preserves the full return URL for sign-in and actions', async () => {
    mocks.auth.isAuthenticated = false
    mocks.auth.user = null
    serverEvent.region = 'Australia'
    const wrapper = mountDetail()
    await flushPromises()
    expectEventVisible(wrapper)
    expect(wrapper.text()).toContain('A$')
    expect(wrapper.html()).not.toContain(eventFixture.address)
    expect(wrapper.html()).not.toContain(eventFixture.organizer_contact)
    expect(wrapper.find('#comment-body').exists()).toBe(false)
    const loginLinks = wrapper.findAllComponents(RouterLinkStub).filter(link => link.props('to')?.path === '/login')
    expect(loginLinks.length).toBeGreaterThan(0)
    for (const link of loginLinks) {
      expect(link.props('to')).toEqual({ path: '/login', query: { redirect: mocks.route.fullPath } })
    }
    for (const label of ['Like event', 'I’m going', 'Interested']) {
      await namedButton(wrapper, label).trigger('click')
      await flushPromises()
      expect(mocks.push).toHaveBeenLastCalledWith({ path: '/login', query: { redirect: mocks.route.fullPath } })
    }
    expect(mocks.api.post).not.toHaveBeenCalled()
    expect(mocks.api.delete).not.toHaveBeenCalled()
  })

  it('retries an event failure without requiring a remount', async () => {
    mocks.api.get.mockRejectedValueOnce(new Error('Event service unavailable'))
    const wrapper = mountDetail()
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('We couldn’t load this event.')
    expect(wrapper.get('[role="alert"]').text()).toContain('Event service unavailable')
    await namedButton(wrapper, 'Try again').trigger('click')
    await flushPromises()
    expectEventVisible(wrapper)
    expect(eventFetches()).toHaveLength(2)
  })

  it.each([403, 404])('does not substitute a saved snapshot for an explicit %s response', async status => {
    const message = status === 403 ? 'You cannot access this event' : 'Event not found'
    mocks.api.get.mockRejectedValueOnce(Object.assign(new Error(message), { status }))
    mocks.offline.saved = true
    mocks.getOfflineEventById.mockReturnValue({ ...eventFixture })
    const wrapper = mountDetail()
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('We couldn’t load this event.')
    expect(wrapper.get('[role="alert"]').text()).toContain(message)
    expect(wrapper.text()).not.toContain(eventFixture.title)
    expect(wrapper.text()).not.toContain('Saved offline')
    expect(wrapper.find('#comment-body').exists()).toBe(false)
    expect(mocks.getOfflineEventById).not.toHaveBeenCalled()
    expect(mocks.api.get).not.toHaveBeenCalledWith('/events/42/comments')
    expect(namedButton(wrapper, 'Try again')).toBeTruthy()
  })

  it('replaces a failed event photo with a visible fallback without hiding event details', async () => {
    serverEvent.image = '/event-photos/sepang.jpg'
    const wrapper = mountDetail()
    await flushPromises()
    const photo = wrapper.get(`img[alt="${eventFixture.title}"]`)
    expect(photo.attributes('src')).toBe(serverEvent.image)
    expect(wrapper.text()).not.toContain('Event photo unavailable')
    await photo.trigger('error')
    expect(wrapper.find(`img[alt="${eventFixture.title}"]`).exists()).toBe(false)
    expect(wrapper.text()).toContain('Event photo unavailable')
    expectEventVisible(wrapper)
    expect(namedButton(wrapper, 'I’m going')).toBeTruthy()
  })

  it.each([
    { name: 'available capacity', price: 0, capacity: 30, going: 12, percent: 40 },
    { name: 'over-capacity attendance', price: '0.00', capacity: 10, going: 15, percent: 100 },
    { name: 'no capacity limit', price: 0, capacity: 0, going: 12, percent: null }
  ])('shows free entry and accessible attendance for $name', async ({ price, capacity, going, percent }) => {
    Object.assign(serverEvent, { price, capacity, going_count: going })
    const wrapper = mountDetail()
    await flushPromises()
    const summary = wrapper.get('[aria-label="Event information and RSVP"]')
    expect(summary.text()).toContain('Free')
    expect(summary.text()).not.toMatch(/RM|A\$/)
    expect(summary.text()).toContain(`${going} going`)
    expect(summary.text()).toContain(`${eventFixture.interested_count} interested`)
    if (percent === null) {
      expect(summary.find('progress').exists()).toBe(false)
      expect(summary.text()).not.toContain('Capacity:')
    } else {
      const progress = summary.get(`progress[aria-label="${going} going out of ${capacity} capacity"]`)
      expect(progress.attributes('max')).toBe('100')
      expect(progress.element.value).toBe(percent)
      expect(summary.text()).toContain(`Capacity: ${capacity}`)
    }
  })

  it('isolates a comments failure and retries comments without hiding or refetching the event', async () => {
    let failComments = true
    mocks.api.get.mockImplementation(async url => {
      if (url.endsWith('/comments')) {
        if (failComments) throw new Error('Discussion unavailable')
        return { data: [{ ...commentFixture }] }
      }
      return { data: { ...serverEvent } }
    })
    const wrapper = mountDetail()
    await flushPromises()
    expectEventVisible(wrapper)
    expect(wrapper.text()).toContain('Comments couldn’t load.')
    expect(mocks.getOfflineEventById).not.toHaveBeenCalled()
    failComments = false
    await namedButton(wrapper, 'Retry comments').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain(commentFixture.body)
    expect(wrapper.text()).not.toContain('Comments couldn’t load.')
    expect(eventFetches()).toHaveLength(1)
  })

  it('labels an offline fallback as a saved snapshot with comments unavailable', async () => {
    mocks.api.get.mockRejectedValue(new Error('Network offline'))
    mocks.offline.saved = true
    mocks.getOfflineEventById.mockReturnValue({ ...eventFixture, saved_offline_at: '2026-10-20T10:00:00Z' })
    const wrapper = mountDetail()
    await flushPromises()
    expect(mocks.getOfflineEventById).toHaveBeenCalledWith(42)
    expectEventVisible(wrapper)
    expect(wrapper.text()).toContain('Saved offline')
    expect(wrapper.text()).toMatch(/saved snapshot/i)
    expect(wrapper.text()).toMatch(/comments[^.]*unavailable/i)
    expect(wrapper.text()).not.toContain(commentFixture.body)
    expect(wrapper.find('#comment-body').exists()).toBe(false)
    expect(namedButton(wrapper, 'Remove offline save')).toBeTruthy()
  })

  it('only exposes management to the owning organizer or an admin', async () => {
    const wrapper = mountDetail()
    await flushPromises()
    const editLinks = () => wrapper.findAllComponents(RouterLinkStub).filter(link => link.text() === 'Edit event')
    expect(editLinks()).toHaveLength(0)
    expect(wrapper.findAll('button').some(button => button.text() === 'Delete event')).toBe(false)
    mocks.auth.isOrganizer = true
    await flushPromises()
    expect(editLinks()).toHaveLength(0)
    expect(wrapper.findAll('button').some(button => button.text() === 'Delete event')).toBe(false)
    mocks.auth.user.id = 7
    await flushPromises()
    expect(editLinks()).toHaveLength(1)
    expect(editLinks()[0].props('to')).toBe('/events/42/edit')
    expect(namedButton(wrapper, 'Delete event')).toBeTruthy()
    mocks.auth.user.id = 99
    mocks.auth.isOrganizer = false
    mocks.auth.isAdmin = true
    await flushPromises()
    expect(editLinks()).toHaveLength(1)
    expect(namedButton(wrapper, 'Delete event')).toBeTruthy()
  })

  it('keeps failed likes inline, guards duplicate requests, retries and refreshes both like states', async () => {
    const pending = deferred()
    mocks.api.post.mockReturnValueOnce(pending.promise)
    const wrapper = mountDetail()
    await flushPromises()
    expect(namedButton(wrapper, 'Like event').attributes('aria-pressed')).toBe('false')
    const likeButton = namedButton(wrapper, 'Like event')
    await likeButton.trigger('click')
    await likeButton.trigger('click')
    expect(mocks.api.post).toHaveBeenCalledTimes(1)
    expect(mocks.api.post.mock.calls[0][0]).toBe('/events/42/like')
    pending.reject(new Error('Like could not be saved'))
    await flushPromises()
    expectInlineError(wrapper, 'Like could not be saved')
    expect(namedButton(wrapper, 'Like event').attributes('aria-pressed')).toBe('false')
    serverEvent.user_liked = true
    await namedButton(wrapper, 'Like event').trigger('click')
    await flushPromises()
    expect(eventFetches()).toHaveLength(2)
    expect(namedButton(wrapper, 'Unlike event').attributes('aria-pressed')).toBe('true')
    serverEvent.user_liked = false
    await namedButton(wrapper, 'Unlike event').trigger('click')
    await flushPromises()
    expect(mocks.api.delete).toHaveBeenCalledWith('/events/42/like')
    expect(namedButton(wrapper, 'Like event').attributes('aria-pressed')).toBe('false')
    expect(eventFetches()).toHaveLength(3)
  })

  it('clears invalidated comments loading when a post-action refresh fails and allows recovery', async () => {
    const oldComments = deferred()
    let eventRequests = 0
    let commentRequests = 0
    mocks.api.get.mockImplementation(async url => {
      if (url === '/events/42') {
        eventRequests += 1
        if (eventRequests === 2) throw new Error('Latest details unavailable')
        return { data: { ...serverEvent } }
      }
      if (url === '/events/42/comments') {
        commentRequests += 1
        return commentRequests === 1 ? oldComments.promise : { data: [{ ...commentFixture }] }
      }
      throw new Error(`Unexpected GET ${url}`)
    })
    const wrapper = mountDetail()
    await flushPromises()
    expectEventVisible(wrapper)
    expect(wrapper.findAll('[role="status"]').some(node => node.text().includes('Loading comments…'))).toBe(true)
    await namedButton(wrapper, 'Like event').trigger('click')
    await flushPromises()
    expect(mocks.api.post.mock.calls[0][0]).toBe('/events/42/like')
    expect(eventFetches()).toHaveLength(2)
    expectInlineError(wrapper, 'Your change was saved, but the latest event details couldn’t load.')
    expect(wrapper.text()).not.toContain('Loading comments…')
    expect(wrapper.get('#comment-body').exists()).toBe(true)
    oldComments.reject(new Error('Obsolete comments request failed'))
    await flushPromises()
    expect(wrapper.text()).not.toContain('Comments couldn’t load.')
    expect(wrapper.text()).not.toContain('Loading comments…')
    serverEvent.user_liked = true
    await namedButton(wrapper, 'Like event').trigger('click')
    await flushPromises()
    expect(namedButton(wrapper, 'Unlike event').attributes('aria-pressed')).toBe('true')
    expect(wrapper.text()).toContain(commentFixture.body)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(eventFetches()).toHaveLength(3)
  })

  it('preserves the page after a failed going RSVP and guards, retries and cancels it', async () => {
    const pending = deferred()
    mocks.api.post.mockReturnValueOnce(pending.promise)
    const wrapper = mountDetail()
    await flushPromises()
    const goingButton = namedButton(wrapper, 'I’m going')
    await goingButton.trigger('click')
    await goingButton.trigger('click')
    expect(mocks.api.post).toHaveBeenCalledTimes(1)
    expect(mocks.api.post).toHaveBeenCalledWith('/events/42/rsvp', { status: 'going' })
    pending.reject(new Error('RSVP could not be saved'))
    await flushPromises()
    expectInlineError(wrapper, 'RSVP could not be saved')
    serverEvent.user_rsvp_status = 'going'
    await namedButton(wrapper, 'I’m going').trigger('click')
    await flushPromises()
    expect(eventFetches()).toHaveLength(2)
    serverEvent.user_rsvp_status = null
    await namedButton(wrapper, 'Cancel going RSVP').trigger('click')
    await flushPromises()
    expect(mocks.api.delete).toHaveBeenCalledWith('/events/42/rsvp')
    expect(namedButton(wrapper, 'I’m going')).toBeTruthy()
    expect(eventFetches()).toHaveLength(3)
  })

  it('supports interested RSVP and cancellation with refreshed server state', async () => {
    const wrapper = mountDetail()
    await flushPromises()
    serverEvent.user_rsvp_status = 'interested'
    await namedButton(wrapper, 'Interested').trigger('click')
    await flushPromises()
    expect(mocks.api.post).toHaveBeenCalledWith('/events/42/rsvp', { status: 'interested' })
    expect(namedButton(wrapper, 'I’m going')).toBeTruthy()
    serverEvent.user_rsvp_status = null
    await namedButton(wrapper, 'Cancel interested RSVP').trigger('click')
    await flushPromises()
    expect(mocks.api.delete).toHaveBeenCalledWith('/events/42/rsvp')
    expect(namedButton(wrapper, 'Interested')).toBeTruthy()
    expect(eventFetches()).toHaveLength(3)
  })

  it('saves and removes an offline snapshot through the accessible controls', async () => {
    const wrapper = mountDetail()
    await flushPromises()
    await namedButton(wrapper, 'Save for offline').trigger('click')
    await flushPromises()
    expect(mocks.toggleSaveOffline).toHaveBeenCalledWith(expect.objectContaining({ id: 42, title: eventFixture.title }))
    await namedButton(wrapper, 'Remove offline save').trigger('click')
    await flushPromises()
    expect(mocks.toggleSaveOffline).toHaveBeenCalledTimes(2)
    expect(namedButton(wrapper, 'Save for offline')).toBeTruthy()
    expectEventVisible(wrapper)
  })

  it('clears stale offline feedback on failure and clears the error after a successful retry', async () => {
    const wrapper = mountDetail()
    await flushPromises()
    await namedButton(wrapper, 'Save for offline').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('[role="status"]').some(node => node.text().includes('Event saved for offline viewing.'))).toBe(true)
    mocks.toggleSaveOffline.mockImplementationOnce(() => { throw new Error('Storage unavailable') })
    await namedButton(wrapper, 'Remove offline save').trigger('click')
    await flushPromises()
    expectInlineError(wrapper, 'Could not update the offline save. Please try again.')
    expect(wrapper.text()).not.toContain('Event saved for offline viewing.')
    expect(namedButton(wrapper, 'Remove offline save').attributes('aria-pressed')).toBe('true')
    await namedButton(wrapper, 'Remove offline save').trigger('click')
    await flushPromises()
    expect(mocks.toggleSaveOffline).toHaveBeenCalledTimes(3)
    expect(namedButton(wrapper, 'Save for offline').attributes('aria-pressed')).toBe('false')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.findAll('[role="status"]').some(node => node.text().includes('Offline save removed.'))).toBe(true)
    expectEventVisible(wrapper)
    expect(eventFetches()).toHaveLength(1)
  })

  it('posts trimmed comments without an implicit rating and prevents duplicate submissions', async () => {
    const pending = deferred()
    mocks.api.post.mockReturnValueOnce(pending.promise)
    const wrapper = mountDetail()
    await flushPromises()
    expect(wrapper.get('#include-rating-check').element.checked).toBe(false)
    await wrapper.get('#comment-body').setValue('   See you at the circuit!   ')
    const postButton = namedButton(wrapper, 'Post comment')
    await postButton.trigger('submit')
    await postButton.trigger('submit')
    expect(mocks.api.post).toHaveBeenCalledTimes(1)
    expect(mocks.api.post).toHaveBeenCalledWith('/events/42/comments', { body: 'See you at the circuit!', rating: null })
    expectEventVisible(wrapper)
    serverComments.push({ ...commentFixture, id: 82, body: 'See you at the circuit!', rating: null })
    pending.resolve({})
    await flushPromises()
    expect(wrapper.get('#comment-body').element.value).toBe('')
    expect(wrapper.text()).toContain('See you at the circuit!')
    expect(eventFetches()).toHaveLength(2)
    await wrapper.get('#include-rating-check').setValue(true)
    await wrapper.get('[aria-label="Rating out of five"]').setValue('4')
    await wrapper.get('#comment-body').setValue('An upcoming-event rating is optional too')
    await submitComment(wrapper)
    await flushPromises()
    expect(mocks.api.post).toHaveBeenLastCalledWith('/events/42/comments', {
      body: 'An upcoming-event rating is optional too', rating: 4
    })
  })

  it('defaults completed-event ratings on, retains a failed draft, and allows optional ratings', async () => {
    serverEvent.status = 'completed'
    mocks.api.post.mockRejectedValueOnce(new Error('Comment could not be posted'))
    const wrapper = mountDetail()
    await flushPromises()
    expect(wrapper.get('#include-rating-check').element.checked).toBe(true)
    await wrapper.get('[aria-label="Rating out of five"]').setValue('3')
    await wrapper.get('#comment-body').setValue('Great afternoon')
    await submitComment(wrapper)
    await flushPromises()
    expectInlineError(wrapper, 'Comment could not be posted')
    expect(wrapper.get('#comment-body').element.value).toBe('Great afternoon')
    expect(wrapper.get('[aria-label="Rating out of five"]').element.value).toBe('3')
    await submitComment(wrapper)
    await flushPromises()
    expect(mocks.api.post).toHaveBeenLastCalledWith('/events/42/comments', { body: 'Great afternoon', rating: 3 })
    await wrapper.get('#include-rating-check').setValue(false)
    await wrapper.get('#comment-body').setValue('A question without a rating')
    await submitComment(wrapper)
    await flushPromises()
    expect(mocks.api.post).toHaveBeenLastCalledWith('/events/42/comments', { body: 'A question without a rating', rating: null })
  })

  it('only lets authors/admins delete comments and preserves comments on failure before retry', async () => {
    serverComments.push({ ...commentFixture, id: 82, user_id: 10, user_name: 'Sam Driver', body: 'See you there' })
    const pending = deferred()
    mocks.api.delete.mockReturnValueOnce(pending.promise)
    const wrapper = mountDetail()
    await flushPromises()
    expect(wrapper.find('[aria-label="Delete comment by Sam Driver"]').exists()).toBe(false)
    const deleteCommentButton = namedButton(wrapper, 'Delete comment by Alex Driver')
    await deleteCommentButton.trigger('click')
    await deleteCommentButton.trigger('click')
    expect(mocks.api.delete).toHaveBeenCalledTimes(1)
    pending.reject(new Error('Comment could not be deleted'))
    await flushPromises()
    expectInlineError(wrapper, 'Comment could not be deleted')
    expect(wrapper.text()).toContain(commentFixture.body)
    serverComments = serverComments.filter(comment => comment.id !== 81)
    await namedButton(wrapper, 'Delete comment by Alex Driver').trigger('click')
    await flushPromises()
    expect(mocks.api.delete).toHaveBeenLastCalledWith('/comments/81')
    expect(wrapper.text()).not.toContain(commentFixture.body)
    expect(eventFetches()).toHaveLength(2)
    mocks.auth.isAdmin = true
    await flushPromises()
    expect(namedButton(wrapper, 'Delete comment by Sam Driver')).toBeTruthy()
  })

  it('confirms event deletion and keeps a failed deletion retryable without navigation', async () => {
    mocks.auth.isAdmin = true
    const wrapper = mountDetail()
    await flushPromises()
    window.confirm.mockReturnValueOnce(false)
    await namedButton(wrapper, 'Delete event').trigger('click')
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining(eventFixture.title))
    expect(mocks.api.delete).not.toHaveBeenCalled()
    const pending = deferred()
    mocks.api.delete.mockReturnValueOnce(pending.promise)
    const deleteEventButton = namedButton(wrapper, 'Delete event')
    await deleteEventButton.trigger('click')
    await deleteEventButton.trigger('click')
    expect(mocks.api.delete).toHaveBeenCalledTimes(1)
    pending.reject(new Error('Event could not be deleted'))
    await flushPromises()
    expectInlineError(wrapper, 'Event could not be deleted')
    expect(mocks.push).not.toHaveBeenCalled()
    await namedButton(wrapper, 'Delete event').trigger('click')
    await flushPromises()
    expect(mocks.api.delete).toHaveBeenLastCalledWith('/events/42')
    expect(mocks.push).toHaveBeenCalledWith('/events')
  })

  it('copies exact address/coordinates and warns when clipboard access is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const wrapper = mountDetail()
    await flushPromises()
    await namedButton(wrapper, 'Copy address').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenLastCalledWith(eventFixture.address)
    await namedButton(wrapper, 'Copy coordinates').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenLastCalledWith(`${eventFixture.latitude}, ${eventFixture.longitude}`)
    expect(mocks.showToast).toHaveBeenCalledWith(expect.any(String), 'success')
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    mocks.showToast.mockClear()
    await namedButton(wrapper, 'Copy address').trigger('click')
    await flushPromises()
    expect(mocks.showToast).toHaveBeenCalledWith(expect.any(String), 'warning')
    expect(mocks.showToast.mock.calls.some(([, type]) => type === 'success')).toBe(false)
  })

  it('clears old event/comments/form on route change and ignores stale comments responses', async () => {
    serverEvent.status = 'completed'
    const oldComments = deferred()
    const nextEvent = deferred()
    const nextComments = deferred()
    mocks.api.get.mockImplementation(url => {
      if (url === '/events/42') return Promise.resolve({ data: { ...serverEvent } })
      if (url === '/events/42/comments') return oldComments.promise
      if (url === '/events/43') return nextEvent.promise
      if (url === '/events/43/comments') return nextComments.promise
      throw new Error(`Unexpected GET ${url}`)
    })
    const wrapper = mountDetail()
    await flushPromises()
    await wrapper.get('#comment-body').setValue('Old event draft')
    await wrapper.get('[aria-label="Rating out of five"]').setValue('2')
    mocks.route.fullPath = '/events/43?source=map'
    mocks.route.params.id = '43'
    await flushPromises()
    expect(wrapper.text()).not.toContain(eventFixture.title)
    expect(wrapper.text()).not.toContain('Old event draft')
    oldComments.resolve({ data: [{ ...commentFixture }] })
    await flushPromises()
    expect(wrapper.text()).not.toContain(commentFixture.body)
    nextEvent.resolve({ data: { ...eventFixture, id: 43, title: 'New event', status: 'upcoming' } })
    nextComments.resolve({ data: [] })
    await flushPromises()
    expectEventVisible(wrapper, 'New event')
    expect(wrapper.text()).not.toContain(commentFixture.body)
    expect(wrapper.get('#comment-body').element.value).toBe('')
    expect(wrapper.get('#include-rating-check').element.checked).toBe(false)
    await wrapper.get('#include-rating-check').setValue(true)
    expect(wrapper.get('[aria-label="Rating out of five"]').element.value).toBe('5')
  })

  it('does not let a previous event’s pending comment clear a new event’s draft', async () => {
    const pending = deferred()
    mocks.api.post.mockReturnValueOnce(pending.promise)
    mocks.api.get.mockImplementation(async url => {
      if (url.endsWith('/comments')) return { data: [] }
      if (url === '/events/42') return { data: { ...eventFixture } }
      if (url === '/events/43') return { data: { ...eventFixture, id: 43, title: 'Next track day' } }
      throw new Error(`Unexpected GET ${url}`)
    })
    const wrapper = mountDetail()
    await flushPromises()
    await wrapper.get('#comment-body').setValue('Comment for the old event')
    await submitComment(wrapper)
    expect(mocks.api.post).toHaveBeenCalledWith('/events/42/comments', {
      body: 'Comment for the old event', rating: null
    })
    mocks.route.fullPath = '/events/43'
    mocks.route.params.id = '43'
    await flushPromises()
    expectEventVisible(wrapper, 'Next track day')
    expect(wrapper.get('#comment-body').element.value).toBe('')
    await wrapper.get('#comment-body').setValue('New event draft')
    pending.resolve({})
    await flushPromises()
    expectEventVisible(wrapper, 'Next track day')
    expect(wrapper.get('#comment-body').element.value).toBe('New event draft')
    expect(eventFetches(43)).toHaveLength(1)
  })

  it('preserves a new draft after A → B → A navigation when the original submission completes', async () => {
    const oldSubmission = deferred()
    mocks.api.post.mockReturnValueOnce(oldSubmission.promise)
    mocks.api.get.mockImplementation(async url => {
      if (url.endsWith('/comments')) return { data: [] }
      if (url === '/events/42') return { data: { ...eventFixture } }
      if (url === '/events/43') return { data: { ...eventFixture, id: 43, title: 'Other track day' } }
      throw new Error(`Unexpected GET ${url}`)
    })
    const wrapper = mountDetail()
    await flushPromises()
    await wrapper.get('#comment-body').setValue('Original visit comment')
    await submitComment(wrapper)
    expect(mocks.api.post).toHaveBeenCalledWith('/events/42/comments', {
      body: 'Original visit comment', rating: null
    })
    mocks.route.fullPath = '/events/43'
    mocks.route.params.id = '43'
    await flushPromises()
    expectEventVisible(wrapper, 'Other track day')
    mocks.route.fullPath = '/events/42?visit=second'
    mocks.route.params.id = '42'
    await flushPromises()
    expectEventVisible(wrapper)
    expect(wrapper.get('#comment-body').element.value).toBe('')
    await wrapper.get('#comment-body').setValue('Draft from the second visit')
    mocks.showToast.mockClear()
    oldSubmission.resolve({})
    await flushPromises()
    expectEventVisible(wrapper)
    expect(wrapper.get('#comment-body').element.value).toBe('Draft from the second visit')
    expect(wrapper.text()).not.toContain('Comment posted.')
    expect(mocks.showToast).not.toHaveBeenCalled()
    expect(eventFetches()).toHaveLength(2)
    expect(namedButton(wrapper, 'Post comment').element.disabled).toBe(false)
    await submitComment(wrapper)
    await flushPromises()
    expect(mocks.api.post).toHaveBeenLastCalledWith('/events/42/comments', {
      body: 'Draft from the second visit', rating: null
    })
    expect(wrapper.get('#comment-body').element.value).toBe('')
    expect(eventFetches()).toHaveLength(3)
  })

  it('does not refresh or announce a completed action after leaving the page', async () => {
    const request = deferred()
    mocks.api.post.mockReturnValueOnce(request.promise)
    const wrapper = mountDetail()
    await flushPromises()
    await namedButton(wrapper, 'Like event').trigger('click')
    wrapper.unmount()
    mocks.showToast.mockClear()
    request.resolve({})
    await flushPromises()
    expect(mocks.showToast).not.toHaveBeenCalled()
    expect(eventFetches()).toHaveLength(1)
  })

  it('ignores a stale event response after a newer route finishes loading', async () => {
    const oldEvent = deferred()
    mocks.api.get.mockImplementation(url => {
      if (url === '/events/42') return oldEvent.promise
      if (url.endsWith('/comments')) return Promise.resolve({ data: [] })
      if (url === '/events/43') return Promise.resolve({ data: { ...eventFixture, id: 43, title: 'Latest event' } })
      throw new Error(`Unexpected GET ${url}`)
    })
    const wrapper = mountDetail()
    await flushPromises()

    mocks.route.fullPath = '/events/43'
    mocks.route.params.id = '43'
    await flushPromises()
    expectEventVisible(wrapper, 'Latest event')
    oldEvent.resolve({ data: { ...eventFixture } })
    await flushPromises()
    expectEventVisible(wrapper, 'Latest event')
    expect(wrapper.text()).not.toContain(eventFixture.title)
  })
})
