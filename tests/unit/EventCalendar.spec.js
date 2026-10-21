import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/vue3'
import EventCalendar from '../../src/components/EventCalendar.vue'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))
vi.mock('@fullcalendar/vue3', () => ({
  default: {
    name: 'FullCalendar',
    props: ['options'],
    template: '<div data-test="full-calendar" />'
  }
}))

const sampleEvent = {
  id: 12,
  title: 'Sunday community meet',
  region: 'Australia',
  start_datetime: '2027-03-14 09:30:00',
  end_datetime: '2027-03-14 12:00:00',
  category_slug: 'meet',
  category_name: 'Car Meet',
  venue: 'Riverside'
}

function mountCalendar(events) {
  return mount(EventCalendar, { props: events === undefined ? {} : { events } })
}

function options(wrapper) {
  return wrapper.getComponent(FullCalendar).props('options')
}

enableAutoUnmount(afterEach)
beforeEach(() => push.mockClear())
afterEach(() => vi.useRealTimers())

describe('EventCalendar.vue', () => {
  it('keeps native month/list views and previous, next and today controls', () => {
    const calendar = options(mountCalendar())

    expect(calendar.plugins).toEqual([dayGridPlugin, listPlugin, interactionPlugin])
    expect(calendar.initialView).toBe('dayGridMonth')
    expect(calendar.headerToolbar).toEqual({
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,listMonth'
    })
    expect(calendar.buttonText).toEqual({ today: 'Today', month: 'Month', list: 'List' })
    expect(calendar.height).toBe('auto')
    expect(calendar.validRange).toBeUndefined()
  })

  it.each(['2025-02-03T12:00:00', '2027-06-18T12:00:00'])(
    'leaves the current date to FullCalendar at %s, regardless of event dates',
    (now) => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(now))
      const calendar = options(mountCalendar([sampleEvent]))

      // FullCalendar defaults to the real current date; neither seed events nor
      // an overridden "now" should pin the initial view or the Today action.
      expect(calendar).not.toHaveProperty('initialDate')
      expect(calendar).not.toHaveProperty('now')
      expect(calendar.timeZone).toBe('local')
      expect(calendar.buttonText.today).toBe('Today')
      expect(calendar.customButtons).toBeUndefined()
    }
  )

  it('maps both regions, date formats and details without shifting local event times', () => {
    const events = [
      { ...sampleEvent },
      {
        ...sampleEvent,
        id: 23,
        title: 'Evening gathering',
        region: 'Malaysia',
        start_datetime: '2027-03-15T18:00:00',
        end_datetime: '2027-03-15T20:30:00',
        category_slug: 'cruise',
        category_name: 'Cruise',
        venue: 'Lakeside'
      }
    ]
    const original = structuredClone(events)
    const calendar = options(mountCalendar(events))

    expect(calendar.events).toEqual([
      {
        id: '12',
        title: '[AU] Sunday community meet',
        start: '2027-03-14T09:30:00',
        end: '2027-03-14T12:00:00',
        extendedProps: { venue: 'Riverside', category: 'Car Meet' }
      },
      {
        id: '23',
        title: '[MY] Evening gathering',
        start: '2027-03-15T18:00:00',
        end: '2027-03-15T20:30:00',
        extendedProps: { venue: 'Lakeside', category: 'Cruise' }
      }
    ])
    expect(events).toEqual(original)
    expect(calendar.eventColor).toBe('#a52e20')
    expect(calendar.eventTextColor).toBe('#ffffff')
  })

  it('reacts to replacement and removal of the parent-filtered events', async () => {
    const wrapper = mountCalendar([sampleEvent])
    await wrapper.setProps({ events: [{ ...sampleEvent, id: 99, title: 'New meet' }] })
    expect(options(wrapper).events).toHaveLength(1)
    expect(options(wrapper).events[0]).toMatchObject({ id: '99', title: '[AU] New meet' })

    await wrapper.setProps({ events: [] })
    expect(options(wrapper).events).toEqual([])
    expect(options(wrapper)).not.toHaveProperty('initialDate')
  })

  it('supports no events with neutral guidance rather than invented dates or track-only copy', () => {
    const wrapper = mountCalendar()
    expect(options(wrapper).events).toEqual([])
    expect(options(wrapper).noEventsContent).toBe('No events this month. Try another month.')
    expect(wrapper.text()).toContain('Select an event to see the details.')
    expect(wrapper.text()).not.toMatch(/track|Oct|Nov|2026/i)
    expect(wrapper.classes()).not.toContain('apex-card')
  })

  it('prevents default event navigation and opens the event details route', () => {
    const preventDefault = vi.fn()
    options(mountCalendar([sampleEvent])).eventClick({
      jsEvent: { preventDefault },
      event: { id: '12' }
    })

    expect(preventDefault).toHaveBeenCalledOnce()
    expect(push).toHaveBeenCalledOnce()
    expect(push).toHaveBeenCalledWith('/events/12')
  })

  it.each([undefined, {}, { id: '' }])('does not navigate without an event id (%s)', (event) => {
    const preventDefault = vi.fn()
    options(mountCalendar()).eventClick({ jsEvent: { preventDefault }, event })
    expect(preventDefault).toHaveBeenCalledOnce()
    expect(push).not.toHaveBeenCalled()
  })
})
