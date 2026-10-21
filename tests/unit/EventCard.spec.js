import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, enableAutoUnmount, RouterLinkStub } from '@vue/test-utils'
import EventCard from '../../src/components/EventCard.vue'
import { useOfflineEvents } from '../../src/composables/useOfflineEvents'

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }))
vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({ showToast })
}))

const sampleEvent = {
  id: 1,
  title: 'Sandown Twilight Time Attack — Round 4',
  image: '/images/sandown.jpg',
  category_name: 'Track Day',
  region: 'Australia',
  venue: 'Sandown International Raceway',
  club_name: 'VicTimeAttack Motorsport',
  start_datetime: '2026-10-24 13:00:00',
  price: 245,
  capacity: 60,
  going_count: 30,
  interested_count: 5,
  likes_count: 12,
  user_liked: false,
  status: 'upcoming'
}

function mountCard(event = {}, props = {}) {
  return mount(EventCard, {
    props: { event: { ...sampleEvent, ...event }, ...props },
    global: { stubs: { RouterLink: RouterLinkStub } }
  })
}

enableAutoUnmount(afterEach)

describe('EventCard.vue', () => {
  beforeEach(() => {
    localStorage.clear()
    // The composable keeps shared state in memory as well as localStorage.
    useOfflineEvents().clearOfflineEvents()
    showToast.mockClear()
  })

  it('shows photography, title, date, venue, regional price and quiet supporting context', () => {
    const wrapper = mountCard()

    expect(wrapper.get('img').attributes('src')).toBe(sampleEvent.image)
    expect(wrapper.get('img').attributes('alt')).toBe(sampleEvent.title)
    expect(wrapper.get('h3').text()).toBe(sampleEvent.title)
    expect(wrapper.get('time').text()).toContain('24 Oct 2026')
    expect(wrapper.get('time').attributes('datetime')).toBe(new Date('2026-10-24T13:00:00').toISOString())
    expect(wrapper.text()).toContain(sampleEvent.venue)
    expect(wrapper.text()).toContain(sampleEvent.club_name)
    expect(wrapper.text()).toContain('Australia')
    expect(wrapper.text()).toContain('Track Day')
    expect(wrapper.text()).toContain('A$245')
    expect(wrapper.text()).toContain('30 going · 5 interested')
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false)
    expect(wrapper.text()).not.toMatch(/Selling Fast|% Full|\/60/)
    expect(wrapper.find('.event-card__status').exists()).toBe(false)
    for (const link of wrapper.findAllComponents(RouterLinkStub)) {
      expect(link.props('to')).toBe('/events/1')
    }
  })

  it.each([
    ['Australia', 0, 'Free entry · A$0'],
    ['Malaysia', 0, 'Free entry · RM 0'],
    ['Malaysia', '29.95', 'RM 29.95'],
    ['Australia', 12.5, 'A$12.5']
  ])('keeps %s currency explicit at price %s', (region, price, label) => {
    expect(mountCard({ region, price }).text()).toContain(label)
  })

  it.each([null, undefined, '', 'invalid', -5])('does not advertise an unknown/invalid price (%s) as free', (price) => {
    const wrapper = mountCard({ price })
    expect(wrapper.text()).toContain('Price to be announced')
    expect(wrapper.text()).not.toContain('Free entry')
  })

  it('emits the original event on like and reflects the parent-controlled pressed state', async () => {
    const wrapper = mountCard()
    const like = wrapper.get(`button[aria-label="Like ${sampleEvent.title}"]`)
    expect(like.attributes('aria-pressed')).toBe('false')
    expect(like.text()).toBe('12')
    await like.trigger('click')
    expect(wrapper.emitted('toggle-like')).toHaveLength(1)
    expect(wrapper.emitted('toggle-like')[0][0]).toBe(wrapper.props('event'))
    expect(wrapper.emitted('rsvp-change')).toBeUndefined()
    expect(like.attributes('aria-pressed')).toBe('false')

    await wrapper.setProps({ event: { ...sampleEvent, user_liked: true, likes_count: 13 } })
    expect(like.attributes('aria-pressed')).toBe('true')
    expect(like.text()).toBe('13')
  })

  it('saves and removes the event offline with visible feedback and a pressed state', async () => {
    const wrapper = mountCard()
    const offline = wrapper.get('button[aria-label="Save for offline"]')
    expect(offline.attributes('aria-pressed')).toBe('false')
    await offline.trigger('click')

    expect(offline.attributes('aria-pressed')).toBe('true')
    expect(offline.text()).toContain('Saved offline')
    expect(offline.attributes('aria-label')).toBe('Remove from saved offline events')
    expect(useOfflineEvents().isEventSavedOffline(sampleEvent.id)).toBe(true)
    const stored = JSON.parse(localStorage.getItem('apexgrid_offline_saved_events_v1'))
    expect(stored[0]).toMatchObject({ id: sampleEvent.id, title: sampleEvent.title })
    expect(showToast).toHaveBeenLastCalledWith(`"${sampleEvent.title}" saved for offline.`, 'success')
    expect(wrapper.emitted('toggle-like')).toBeUndefined()

    await offline.trigger('click')
    expect(offline.attributes('aria-pressed')).toBe('false')
    expect(offline.text()).toContain('Save offline')
    expect(useOfflineEvents().isEventSavedOffline(sampleEvent.id)).toBe(false)
    expect(JSON.parse(localStorage.getItem('apexgrid_offline_saved_events_v1'))).toEqual([])
    expect(showToast).toHaveBeenLastCalledWith(
      `"${sampleEvent.title}" removed from saved offline events.`, 'info'
    )
  })

  it('reflects an already saved event and updates across shared cards', async () => {
    useOfflineEvents().toggleSaveOffline(sampleEvent)
    const first = mountCard()
    const second = mountCard()
    expect(first.get('.event-card__save').attributes('aria-pressed')).toBe('true')
    await first.get('.event-card__save').trigger('click')
    expect(second.get('.event-card__save').attributes('aria-pressed')).toBe('false')
  })

  it('honors showOfflineToggle without hiding likes or navigation', () => {
    const wrapper = mountCard({}, { showOfflineToggle: false })
    expect(wrapper.find('.event-card__save').exists()).toBe(false)
    expect(wrapper.find('button[aria-label^="Like "]').exists()).toBe(true)
    expect(wrapper.find('.event-card__view').exists()).toBe(true)
  })

  it.each([
    ['cancelled', 60, 60, 'Cancelled'],
    ['completed', 60, 60, 'Completed'],
    ['upcoming', 60, 60, 'Full'],
    ['upcoming', 60, 65, 'Full'],
    ['upcoming', '60', '60', 'Full'],
    ['full', null, 0, 'Full']
  ])('shows truthful %s status with capacity %s and attendance %s', (status, capacity, going_count, label) => {
    const wrapper = mountCard({ status, capacity, going_count })
    expect(wrapper.get('.event-card__status').text()).toBe(label)
    if (status === 'cancelled') expect(wrapper.find('.event-card__attendance').exists()).toBe(false)
    if (status === 'completed') expect(wrapper.text()).toContain('60 marked as going')
  })

  it.each([undefined, null, 0, -1, 'invalid', Infinity, 61])('does not infer full from invalid or unfilled capacity %s', (capacity) => {
    const wrapper = mountCard({ capacity, going_count: 60 })
    expect(wrapper.find('.event-card__status').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Selling Fast')
  })

  it('omits empty attendance instead of inventing capacity or popularity', () => {
    const wrapper = mountCard({ going_count: 0, interested_count: 0, capacity: null })
    expect(wrapper.find('.event-card__attendance').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('100')
  })

  it('uses a local, honest fallback for missing photographs', () => {
    const wrapper = mountCard({ image: null })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('Photo not available')
    expect(wrapper.get('h3').text()).toBe(sampleEvent.title)
  })

  it('handles a failed photograph and retries when the event image changes', async () => {
    const wrapper = mountCard()
    await wrapper.get('img').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('Photo not available')

    await wrapper.setProps({ event: { ...sampleEvent, image: '/images/replacement.jpg' } })
    expect(wrapper.get('img').attributes('src')).toBe('/images/replacement.jpg')
    expect(wrapper.find('.event-card__placeholder').exists()).toBe(false)
  })

  it.each([null, 'not-a-date'])('uses honest copy instead of a fabricated date for %s', (start_datetime) => {
    const wrapper = mountCard({ start_datetime, venue: '' })
    expect(wrapper.text()).toContain('Date to be announced')
    expect(wrapper.text()).toContain('Venue to be announced')
    expect(wrapper.find('time').exists()).toBe(false)
  })
})
