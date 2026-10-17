/**
 * ApexGrid — Unit & Component Tests for EventCard.vue (Gibson's QA Suite)
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EventCard from '../../src/components/EventCard.vue'

const sampleEvent = {
  id: 1,
  title: 'Sandown Twilight Time Attack — Round 4',
  category_name: 'Track Day',
  category_slug: 'track-day',
  badge_color: 'danger',
  category_icon: 'bi-flag-fill',
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

describe('EventCard.vue', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders event title, venue, club name, and formatted Australian price', () => {
    const wrapper = mount(EventCard, {
      props: { event: sampleEvent },
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' }
        }
      }
    })

    expect(wrapper.text()).toContain('Sandown Twilight Time Attack — Round 4')
    expect(wrapper.text()).toContain('Sandown International Raceway')
    expect(wrapper.text()).toContain('VicTimeAttack Motorsport')
    expect(wrapper.text()).toContain('A$245')
    expect(wrapper.text()).toContain('50% Full')
  })

  it('renders FREE ENTRY badge when event price is 0 and MY badge for Malaysian events', () => {
    const freeMyEvent = {
      ...sampleEvent,
      id: 5,
      title: 'Kuching Waterfront Night Meet',
      region: 'Malaysia',
      price: 0
    }
    const wrapper = mount(EventCard, {
      props: { event: freeMyEvent },
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' }
        }
      }
    })

    expect(wrapper.text()).toContain('FREE ENTRY')
    expect(wrapper.text()).toContain('MY')
  })

  it('emits toggle-like when the heart button is clicked', async () => {
    const wrapper = mount(EventCard, {
      props: { event: sampleEvent },
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' }
        }
      }
    })

    const likeBtn = wrapper.find('button[aria-label="Like Sandown Twilight Time Attack — Round 4"]')
    await likeBtn.trigger('click')
    expect(wrapper.emitted('toggle-like')).toBeTruthy()
    expect(wrapper.emitted('toggle-like')[0][0]).toEqual(sampleEvent)
  })
})
