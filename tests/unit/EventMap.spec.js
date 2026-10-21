import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import L from 'leaflet'
import EventMap from '../../src/components/EventMap.vue'
import { REGION_HUBS } from '../../src/data/seedData'

vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      flyTo: vi.fn(),
      setView: vi.fn(),
      on: vi.fn().mockReturnThis(),
      remove: vi.fn()
    })),
    tileLayer: vi.fn(() => ({ addTo: vi.fn().mockReturnThis() })),
    layerGroup: vi.fn(() => ({
      addTo: vi.fn().mockReturnThis(),
      clearLayers: vi.fn(),
      addLayer: vi.fn()
    })),
    divIcon: vi.fn(options => options),
    marker: vi.fn(() => ({
      bindPopup: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis()
    }))
  }
}))

const sampleEvent = {
  id: 12,
  title: 'Sunday community meet',
  region: 'Australia',
  latitude: '-37.8136',
  longitude: '144.9631',
  category_slug: 'meet',
  category_name: 'Car Meet',
  venue: 'Riverside',
  start_datetime: '2027-03-14 09:30:00',
  price: 0
}

function mountMap(props = {}) {
  const wrapper = mount(EventMap, { props })
  return {
    wrapper,
    map: L.map.mock.results.at(-1).value,
    layer: L.layerGroup.mock.results.at(-1).value
  }
}

function regionButton(wrapper, region) {
  return wrapper.findAll('button').find(button => button.text() === REGION_HUBS[region].name)
}

function clickHandler(target) {
  expect(target.on).toHaveBeenCalledWith('click', expect.any(Function))
  return target.on.mock.calls.find(([event]) => event === 'click')[1]
}

enableAutoUnmount(afterEach)
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
})
afterEach(() => vi.unstubAllGlobals())

describe('EventMap.vue', () => {
  it.each([undefined, 'Australia', 'Malaysia', 'Kuching', 'Sepang', 'Unknown'])(
    'mounts at the configured hub with an All fallback (%s)',
    initialRegion => {
      const props = initialRegion === undefined ? {} : { initialRegion }
      const { wrapper, map, layer } = mountMap(props)
      const hub = REGION_HUBS[initialRegion] || REGION_HUBS.All

      expect(L.map).toHaveBeenCalledOnce()
      expect(L.map).toHaveBeenCalledWith(
        wrapper.get('[role="region"]').element,
        { center: [hub.lat, hub.lng], zoom: hub.zoom, scrollWheelZoom: true }
      )
      expect(L.tileLayer).toHaveBeenCalledWith(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        expect.objectContaining({ maxZoom: 19 })
      )
      expect(L.tileLayer.mock.results[0].value.addTo).toHaveBeenCalledWith(map)
      expect(layer.addTo).toHaveBeenCalledWith(map)
      expect(layer.clearLayers).toHaveBeenCalledOnce()
      expect(map.flyTo).not.toHaveBeenCalled()
      expect(map.setView).not.toHaveBeenCalled()
      expect(wrapper.emitted('region-change')).toBeUndefined()
    }
  )

  it('updates the hub and active button on external region changes without emitting', async () => {
    const { wrapper, map } = mountMap({ initialRegion: 'Australia' })

    for (const region of ['Malaysia', 'Kuching', 'All']) {
      await wrapper.setProps({ initialRegion: region })
      const hub = REGION_HUBS[region]
      expect(map.flyTo).toHaveBeenLastCalledWith([hub.lat, hub.lng], hub.zoom, { duration: 0.9 })
      expect(regionButton(wrapper, region).classes()).toContain('btn-apex')
      expect(wrapper.findAll('button.btn-apex')).toHaveLength(1)
    }

    expect(map.flyTo).toHaveBeenCalledTimes(3)
    expect(map.setView).not.toHaveBeenCalled()
    expect(wrapper.emitted('region-change')).toBeUndefined()
  })

  it('responds to an external region select even with built-in controls hidden', async () => {
    const { wrapper, map } = mountMap({ showRegionControls: false })
    expect(wrapper.find('button').exists()).toBe(false)

    await wrapper.setProps({ initialRegion: 'Malaysia' })
    const hub = REGION_HUBS.Malaysia
    expect(map.flyTo).toHaveBeenCalledOnce()
    expect(map.flyTo).toHaveBeenCalledWith([hub.lat, hub.lng], hub.zoom, { duration: 0.9 })
    expect(wrapper.emitted('region-change')).toBeUndefined()
  })

  it('falls back to the All hub for an unknown external region', async () => {
    const { wrapper, map } = mountMap({ initialRegion: 'Australia' })
    await wrapper.setProps({ initialRegion: 'Unknown' })

    const hub = REGION_HUBS.All
    expect(map.flyTo).toHaveBeenCalledWith([hub.lat, hub.lng], hub.zoom, { duration: 0.9 })
    expect(wrapper.emitted('region-change')).toBeUndefined()
  })

  it('emits once for a quick jump without animating again when the parent echoes it', async () => {
    const { wrapper, map } = mountMap({ initialRegion: 'Australia' })
    await regionButton(wrapper, 'Malaysia').trigger('click')

    const hub = REGION_HUBS.Malaysia
    expect(map.flyTo).toHaveBeenCalledOnce()
    expect(map.flyTo).toHaveBeenCalledWith([hub.lat, hub.lng], hub.zoom, { duration: 0.9 })
    expect(wrapper.emitted('region-change')).toEqual([['Malaysia']])
    expect(regionButton(wrapper, 'Malaysia').classes()).toContain('btn-apex')

    await wrapper.setProps({ initialRegion: 'Malaysia' })
    expect(map.flyTo).toHaveBeenCalledOnce()
    expect(map.setView).not.toHaveBeenCalled()
    expect(wrapper.emitted('region-change')).toEqual([['Malaysia']])

    await wrapper.setProps({ initialRegion: 'Australia' })
    expect(map.flyTo).toHaveBeenCalledTimes(2)
    expect(regionButton(wrapper, 'Australia').classes()).toContain('btn-apex')
    expect(wrapper.emitted('region-change')).toEqual([['Malaysia']])
  })

  it.each(['external change', 'quick jump'])('uses setView instead of flyTo for reduced-motion %s', async source => {
    window.matchMedia.mockReturnValue({ matches: true })
    const { wrapper, map } = mountMap()

    if (source === 'external change') await wrapper.setProps({ initialRegion: 'Sepang' })
    else await regionButton(wrapper, 'Sepang').trigger('click')

    const hub = REGION_HUBS.Sepang
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    expect(map.setView).toHaveBeenCalledOnce()
    expect(map.setView).toHaveBeenCalledWith([hub.lat, hub.lng], hub.zoom)
    expect(map.flyTo).not.toHaveBeenCalled()
    expect(wrapper.emitted('region-change')).toEqual(source === 'quick jump' ? [['Sepang']] : undefined)

    await wrapper.setProps({ initialRegion: 'Sepang' })
    expect(map.setView).toHaveBeenCalledOnce()
  })

  it('can jump when matchMedia is unavailable', async () => {
    vi.stubGlobal('matchMedia', undefined)
    const { wrapper, map } = mountMap()
    await wrapper.setProps({ initialRegion: 'Australia' })

    const hub = REGION_HUBS.Australia
    expect(map.flyTo).toHaveBeenCalledWith([hub.lat, hub.lng], hub.zoom, { duration: 0.9 })
    expect(map.setView).not.toHaveBeenCalled()
  })

  it('creates markers from numeric coordinates and emits the selected original event', () => {
    const events = [sampleEvent, { ...sampleEvent, id: 23, region: 'Malaysia', latitude: '2.5', longitude: '106' }]
    const { wrapper, map, layer } = mountMap({ events })

    expect(L.marker).toHaveBeenCalledTimes(2)
    events.forEach((event, index) => {
      const marker = L.marker.mock.results[index].value
      expect(L.marker).toHaveBeenNthCalledWith(index + 1, [Number(event.latitude), Number(event.longitude)], {
        icon: expect.objectContaining({ className: 'apex-leaflet-marker' }),
        title: event.title
      })
      expect(marker.bindPopup).toHaveBeenCalledWith(expect.stringContaining(`#/events/${event.id}`))
      expect(layer.addLayer).toHaveBeenCalledWith(marker)
      clickHandler(marker)()
      expect(wrapper.emitted('select-event')[index][0]).toBe(wrapper.props('events')[index])
    })
    expect(wrapper.emitted('select-event')).toHaveLength(2)
    expect(wrapper.emitted('pick-coordinates')).toBeUndefined()
    expect(wrapper.emitted('region-change')).toBeUndefined()
    expect(map.setView).not.toHaveBeenCalled()
  })

  it('skips nonnumeric coordinates, rebuilds changed events, and focuses a single event', async () => {
    const { wrapper, map, layer } = mountMap({
      events: [
        { ...sampleEvent, latitude: 'invalid' },
        { ...sampleEvent, longitude: 'invalid' }
      ]
    })
    expect(L.marker).not.toHaveBeenCalled()
    expect(map.setView).not.toHaveBeenCalled()

    await wrapper.setProps({ events: [sampleEvent] })
    expect(layer.clearLayers).toHaveBeenCalledTimes(2)
    expect(layer.addLayer).toHaveBeenCalledOnce()
    expect(map.setView).toHaveBeenCalledOnce()
    expect(map.setView).toHaveBeenCalledWith([-37.8136, 144.9631], 13)

    await wrapper.setProps({ events: [] })
    expect(layer.clearLayers).toHaveBeenCalledTimes(3)
    expect(L.marker).toHaveBeenCalledOnce()
    expect(wrapper.emitted('region-change')).toBeUndefined()
  })

  it('emits map click coordinates rounded to six decimal places when selectable', () => {
    const { wrapper, map } = mountMap({ selectable: true })
    expect(map.on).toHaveBeenCalledOnce()
    clickHandler(map)({ latlng: { lat: -37.8136127, lng: 144.9631234 } })

    expect(wrapper.emitted('pick-coordinates')).toEqual([[{ latitude: -37.813613, longitude: 144.963123 }]])
    expect(wrapper.emitted('select-event')).toBeUndefined()
    expect(wrapper.emitted('region-change')).toBeUndefined()
  })

  it('does not subscribe to coordinate picking by default', () => {
    const { wrapper, map } = mountMap()
    expect(map.on).not.toHaveBeenCalled()
    expect(wrapper.emitted('pick-coordinates')).toBeUndefined()
  })

  it('removes the Leaflet map on teardown', () => {
    const { wrapper, map } = mountMap({ selectable: true, events: [sampleEvent] })
    expect(map.remove).not.toHaveBeenCalled()

    wrapper.unmount()
    expect(map.remove).toHaveBeenCalledOnce()
  })
})
