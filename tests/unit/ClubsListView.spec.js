import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { compileStyle, parse } from '@vue/compiler-sfc'
import { enableAutoUnmount, flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import ClubsListView from '../../src/views/ClubsListView.vue'
import clubsSource from '../../src/views/ClubsListView.vue?raw'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), auth: null }))
vi.mock('../../src/services/api', () => ({ api: { get: mocks.get, post: mocks.post } }))
vi.mock('../../src/stores/authStore', () => ({ useAuthStore: () => mocks.auth }))

const clubs = [
  { id: 1, name: 'Sunday Drivers', city: 'Melbourne, VIC', region: 'Australia', founded_year: 2018, owner_name: 'Alex', description: 'Coffee meets and weekend drives.', logo: '/sunday.jpg', events_count: 2, total_rsvps: 14 },
  { id: 2, name: 'Kuching Car Community', city: 'Kuching', region: 'Malaysia', founded_year: null, owner_name: null, description: '', logo: '', events_count: 0, total_rsvps: 0 }
]
const deferred = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
function mountList(options = {}) {
  return mount(ClubsListView, { ...options, global: { stubs: { RouterLink: RouterLinkStub } } })
}
function button(wrapper, text) {
  return wrapper.findAll('button').find(node => node.text() === text)
}
async function openCreate(wrapper) {
  await button(wrapper, 'Register a club').trigger('click')
  await wrapper.get('#club-name').setValue('Weekend Drivers')
  await wrapper.get('#club-desc').setValue('A friendly community for weekend drives.')
}
enableAutoUnmount(afterEach)
beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth = reactive({ isOrganizer: false })
  mocks.get.mockResolvedValue({ data: clubs })
  mocks.post.mockResolvedValue({ id: 3 })
})

describe('Clubs directory redesign', () => {
  it('compiles safely scoped light-theme page and native control overrides', () => {
    const { descriptor, errors: parseErrors } = parse(clubsSource)
    expect(parseErrors).toEqual([])
    expect(descriptor.styles).toHaveLength(1)
    expect(descriptor.styles[0].scoped).toBe(true)
    const { code, errors } = compileStyle({ source: descriptor.styles[0].content, id: 'data-v-clubs', scoped: true })
    expect(errors).toEqual([])
    expect(code).toContain("[data-bs-theme='light'] .clubs-page[data-v-clubs]")
    expect(code).toContain("[data-bs-theme='light'] .clubs-page .clubs-field[data-v-clubs] :is(input, select, textarea)")
    expect(code).toContain(':focus-visible')
    expect(code).toContain('@media (max-width: 575.98px)')
  })

  it('loads the real directory fields, profile destinations, and truthful aggregate labels', async () => {
    const wrapper = mountList()
    expect(wrapper.get('.clubs-results').attributes('aria-busy')).toBe('true')
    expect(wrapper.text()).not.toContain('0 clubs found')
    await flushPromises()
    expect(mocks.get).toHaveBeenCalledWith('/clubs', { region: '', search: '' })
    expect(wrapper.findAll('.club-entry')).toHaveLength(2)
    const first = wrapper.get('.club-entry')
    expect(first.text()).toContain('Est. 2018')
    expect(first.text()).toContain('Director: Alex')
    expect(first.text()).toContain('2 events')
    expect(first.text()).toContain('14 going RSVPs')
    expect(wrapper.text()).toContain('2 clubs found')
    expect(wrapper.text()).not.toMatch(/verified|official|sanctioned/i)
    expect(wrapper.findAllComponents(RouterLinkStub).map(link => link.props('to'))).toEqual(['/clubs/1', '/clubs/2', '/events'])
    expect(first.get('.club-link').attributes('aria-label')).toBe('View club: Sunday Drivers')
    expect(button(wrapper, 'Register a club')).toBeUndefined()
  })

  it('keeps server-side search, all region values, and search form submission', async () => {
    const wrapper = mountList()
    await flushPromises()
    await wrapper.get('#club-search').setValue('Kuching')
    expect(mocks.get).toHaveBeenLastCalledWith('/clubs', { region: '', search: 'Kuching' })
    await button(wrapper, 'Malaysia').trigger('click')
    expect(mocks.get).toHaveBeenLastCalledWith('/clubs', { region: 'Malaysia', search: 'Kuching' })
    expect(button(wrapper, 'Malaysia').attributes('aria-pressed')).toBe('true')
    expect(button(wrapper, 'All regions').attributes('aria-pressed')).toBe('false')
    await button(wrapper, 'Australia').trigger('click')
    expect(mocks.get).toHaveBeenLastCalledWith('/clubs', { region: 'Australia', search: 'Kuching' })
    await button(wrapper, 'All regions').trigger('click')
    await wrapper.get('form[role="search"]').trigger('submit')
    expect(mocks.get).toHaveBeenLastCalledWith('/clubs', { region: '', search: 'Kuching' })
  })

  it('ignores stale successful responses while the newest search is pending', async () => {
    const old = deferred(), latest = deferred()
    mocks.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
    const wrapper = mountList()
    await wrapper.get('#club-search').setValue('Kuching')
    old.resolve({ data: [clubs[0]] })
    await flushPromises()
    expect(wrapper.get('.clubs-results').attributes('aria-busy')).toBe('true')
    expect(wrapper.find('.club-entry').exists()).toBe(false)
    latest.resolve({ data: [clubs[1]] })
    await flushPromises()
    expect(wrapper.get('.club-entry').text()).toContain('Kuching Car Community')
    expect(wrapper.text()).toContain('1 club found')
  })

  it('ignores stale failures after a newer request succeeds', async () => {
    const old = deferred()
    mocks.get.mockReturnValueOnce(old.promise)
    const wrapper = mountList()
    await wrapper.get('#club-search').setValue('Sunday')
    await flushPromises()
    old.reject(new Error('Old failure'))
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.findAll('.club-entry')).toHaveLength(2)
  })

  it('separates failure from empty results and retries with the selected filters', async () => {
    mocks.get.mockRejectedValue(new Error('Unavailable'))
    const wrapper = mountList()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('We couldn’t load the clubs.')
    expect(wrapper.find('.clubs-empty').exists()).toBe(false)
    await wrapper.get('#club-search').setValue('Sunday')
    await button(wrapper, 'Australia').trigger('click')
    await flushPromises()
    mocks.get.mockResolvedValue({ data: [clubs[0]] })
    await button(wrapper, 'Try again').trigger('click')
    await flushPromises()
    expect(mocks.get).toHaveBeenLastCalledWith('/clubs', { region: 'Australia', search: 'Sunday' })
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('.club-entry').text()).toContain('Sunday Drivers')
  })

  it('does not leave stale cards or a misleading count visible after a failed search', async () => {
    const wrapper = mountList()
    await flushPromises()
    mocks.get.mockRejectedValueOnce(new Error('Search unavailable'))
    await wrapper.get('#club-search').setValue('New search')
    await flushPromises()
    expect(wrapper.find('.club-entry').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('2 clubs found')
    expect(wrapper.get('[role="alert"]').exists()).toBe(true)
  })

  it('distinguishes an empty directory from empty filters and can reset both filters', async () => {
    mocks.get.mockResolvedValue({ data: [] })
    const wrapper = mountList()
    await flushPromises()
    expect(wrapper.text()).toContain('No clubs just yet.')
    expect(button(wrapper, 'Clear filters')).toBeUndefined()
    await wrapper.get('#club-search').setValue('No match')
    await button(wrapper, 'Malaysia').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('A little further afield?')
    await button(wrapper, 'Clear filters').trigger('click')
    await flushPromises()
    expect(wrapper.get('#club-search').element.value).toBe('')
    expect(button(wrapper, 'All regions').attributes('aria-pressed')).toBe('true')
    expect(mocks.get).toHaveBeenLastCalledWith('/clubs', { region: '', search: '' })
  })

  it('handles missing/broken photos without replacement network requests or invented years', async () => {
    const wrapper = mountList()
    await flushPromises()
    const entries = wrapper.findAll('.club-entry')
    expect(entries[1].text()).not.toContain('Est.')
    expect(entries[1].text()).not.toContain('Director:')
    expect(entries[1].text()).toContain('0 events')
    expect(entries[1].text()).toContain('Visit the club profile')
    expect(entries[1].get('.club-photo-fallback').text()).toContain('Club photo unavailable')
    expect(entries[0].get('img').attributes('alt')).toBe('')
    await entries[0].get('img').trigger('error')
    expect(entries[0].find('img').exists()).toBe(false)
    expect(entries[0].text()).toContain('Club photo unavailable')
    await wrapper.get('form[role="search"]').trigger('submit')
    await flushPromises()
    expect(wrapper.get('.club-photo img').attributes('src')).toBe('/sunday.jpg')
  })

  it('does not fabricate missing event or RSVP counts', async () => {
    mocks.get.mockResolvedValue({ data: [{ id: 4, name: 'New club' }] })
    const wrapper = mountList()
    await flushPromises()
    expect(wrapper.get('.club-counts').text()).toBe('')
    expect(wrapper.text()).not.toContain('2020')
  })

  it('exposes the role-gated form with labels, validation and focus return', async () => {
    mocks.auth.isOrganizer = true // The real store includes admins in this getter.
    const wrapper = mountList({ attachTo: document.body })
    await flushPromises()
    const toggle = button(wrapper, 'Register a club')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(wrapper.get('#club-name').element)
    for (const id of ['club-name', 'club-region', 'club-city', 'club-logo', 'club-founded', 'club-desc']) {
      expect(wrapper.get(`label[for="${id}"]`).exists()).toBe(true)
    }
    expect(wrapper.get('#club-name').attributes('minlength')).toBe('3')
    expect(wrapper.get('#club-desc').attributes('minlength')).toBe('15')
    expect(wrapper.get('#club-logo').attributes('type')).toBe('url')
    expect(wrapper.get('#club-founded').attributes('max')).toBe(String(new Date().getFullYear()))
    await button(wrapper, 'Cancel').trigger('click')
    expect(wrapper.find('#club-create-panel').exists()).toBe(false)
    expect(document.activeElement).toBe(toggle.element)
  })

  it('creates a club with every existing payload field, prevents duplicates and refreshes the current search', async () => {
    mocks.auth.isOrganizer = true
    const pending = deferred()
    mocks.post.mockReturnValueOnce(pending.promise)
    const wrapper = mountList({ attachTo: document.body })
    await flushPromises()
    await button(wrapper, 'Malaysia').trigger('click')
    await openCreate(wrapper)
    await wrapper.get('#club-region').setValue('Malaysia')
    await wrapper.get('#club-city').setValue('Kuching, Sarawak')
    await wrapper.get('#club-founded').setValue('2019')
    await wrapper.get('#club-logo').setValue('https://example.com/club.jpg')
    const form = wrapper.get('.clubs-create-form')
    await form.trigger('submit')
    await form.trigger('submit')
    expect(mocks.post).toHaveBeenCalledOnce()
    expect(mocks.post).toHaveBeenCalledWith('/clubs', {
      name: 'Weekend Drivers', region: 'Malaysia', city: 'Kuching, Sarawak', founded_year: 2019,
      logo: 'https://example.com/club.jpg', description: 'A friendly community for weekend drives.'
    })
    expect(form.attributes('aria-busy')).toBe('true')
    expect(form.get('fieldset').attributes('disabled')).toBeDefined()
    pending.resolve({ id: 3 })
    await flushPromises()
    expect(wrapper.find('#club-create-panel').exists()).toBe(false)
    expect(wrapper.get('.clubs-notice[role="status"]').text()).toContain('Weekend Drivers')
    expect(mocks.get).toHaveBeenLastCalledWith('/clubs', { region: 'Malaysia', search: '' })
    expect(document.activeElement).toBe(button(wrapper, 'Register a club').element)
    await button(wrapper, 'Register a club').trigger('click')
    expect(wrapper.get('#club-name').element.value).toBe('')
    expect(wrapper.get('#club-desc').element.value).toBe('')
  })

  it('keeps form input on create failure and allows retry without claiming success', async () => {
    mocks.auth.isOrganizer = true
    mocks.post.mockRejectedValueOnce(new Error('That club name already exists.'))
    const wrapper = mountList()
    await flushPromises()
    await openCreate(wrapper)
    await wrapper.get('.clubs-create-form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('.clubs-create-form [role="alert"]').text()).toContain('That club name already exists.')
    expect(wrapper.get('#club-name').element.value).toBe('Weekend Drivers')
    expect(wrapper.find('.clubs-notice[role="status"]').exists()).toBe(false)
    expect(wrapper.get('.clubs-create-form fieldset').attributes('disabled')).toBeUndefined()
    await wrapper.get('.clubs-create-form').trigger('submit')
    await flushPromises()
    expect(mocks.post).toHaveBeenCalledTimes(2)
    expect(wrapper.find('#club-create-panel').exists()).toBe(false)
  })

  it('does not misreport a successful creation when refreshing the directory fails', async () => {
    mocks.auth.isOrganizer = true
    const wrapper = mountList()
    await flushPromises()
    await openCreate(wrapper)
    mocks.get.mockRejectedValueOnce(new Error('Directory offline'))
    await wrapper.get('.clubs-create-form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('.clubs-notice[role="status"]').text()).toContain('created')
    expect(wrapper.get('.clubs-results [role="alert"]').text()).toContain('We couldn’t load the clubs.')
    expect(mocks.post).toHaveBeenCalledOnce()
  })

  it('closes the form on role loss and guards a stale submit handler', async () => {
    mocks.auth.isOrganizer = true
    const wrapper = mountList()
    await flushPromises()
    await openCreate(wrapper)
    const form = wrapper.get('.clubs-create-form')
    mocks.auth.isOrganizer = false
    await form.trigger('submit')
    await flushPromises()
    expect(mocks.post).not.toHaveBeenCalled()
    expect(wrapper.find('#club-create-panel').exists()).toBe(false)
    expect(button(wrapper, 'Register a club')).toBeUndefined()
  })

  it.each(['resolve', 'reject'])('ignores a pending directory %s after unmount', async (outcome) => {
    const pending = deferred()
    mocks.get.mockReturnValueOnce(pending.promise)
    const wrapper = mountList()
    wrapper.unmount()
    if (outcome === 'resolve') pending.resolve({ data: clubs })
    else pending.reject(new Error('Unmounted'))
    await flushPromises()
    expect(mocks.get).toHaveBeenCalledOnce()
    expect(mocks.post).not.toHaveBeenCalled()
  })

  it.each(['resolve', 'reject'])('ignores a pending creation %s after unmount without refreshing', async (outcome) => {
    mocks.auth.isOrganizer = true
    const pending = deferred()
    mocks.post.mockReturnValueOnce(pending.promise)
    const wrapper = mountList()
    await flushPromises()
    await openCreate(wrapper)
    await wrapper.get('.clubs-create-form').trigger('submit')
    wrapper.unmount()
    if (outcome === 'resolve') pending.resolve({ id: 3 })
    else pending.reject(new Error('Unmounted'))
    await flushPromises()
    expect(mocks.get).toHaveBeenCalledOnce()
    expect(mocks.post).toHaveBeenCalledOnce()
  })
})
