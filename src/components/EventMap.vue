<script setup>
/**
 * ApexGrid — Interactive Leaflet Map Component (Naveed's Advanced Feature)
 * Uses OpenStreetMap tiles (zero API key required on Swinburne Mercury) and custom
 * category SVG/HTML markers so Vite bundling never breaks default marker icons.
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import { REGION_HUBS } from '../data/seedData'

const props = defineProps({
  events: {
    type: Array,
    default: () => []
  },
  height: {
    type: String,
    default: '480px'
  },
  initialRegion: {
    type: String,
    default: 'All'
  },
  showRegionControls: {
    type: Boolean,
    default: true
  },
  selectable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select-event', 'pick-coordinates', 'region-change'])

const mapContainer = ref(null)
const activeRegion = ref(props.initialRegion)
let mapInstance = null
let markersLayer = null

const categoryColors = {
  'track-day': '#e63946',
  drift: '#f4a261',
  meet: '#0dcaf0',
  drag: '#3b82f6',
  cruise: '#198754',
  show: '#a855f7'
}

function createCategoryIcon(event) {
  const color = categoryColors[event.category_slug] || '#e63946'
  const label = event.region === 'Malaysia' ? 'MY' : 'AU'
  const html = `
    <div style="
      display:flex;
      align-items:center;
      justify-content:center;
      width:34px;
      height:34px;
      border-radius:50%;
      background:${color};
      color:#fff;
      font-weight:700;
      font-size:11px;
      border:3px solid #111318;
      box-shadow:0 3px 10px rgba(0,0,0,0.55);
    ">${label}</div>
  `
  return L.divIcon({
    html,
    className: 'apex-leaflet-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16]
  })
}

function renderMarkers() {
  if (!mapInstance || !markersLayer) return
  markersLayer.clearLayers()

  const validBounds = []

  props.events.forEach((ev) => {
    const lat = Number(ev.latitude)
    const lng = Number(ev.longitude)
    if (Number.isNaN(lat) || Number.isNaN(lng)) return

    validBounds.push([lat, lng])
    const marker = L.marker([lat, lng], {
      icon: createCategoryIcon(ev),
      title: ev.title
    })

    const priceStr =
      Number(ev.price) <= 0
        ? 'FREE ENTRY'
        : `${ev.region === 'Malaysia' ? 'RM ' : 'A$'}${Number(ev.price).toFixed(0)}`

    const popupHtml = `
      <div style="min-width:210px;font-family:system-ui,sans-serif;">
        <div style="font-size:11px;font-weight:700;color:#e63946;text-transform:uppercase;">
          ${ev.category_name || 'Track Event'} • ${ev.region}
        </div>
        <div style="font-size:14px;font-weight:700;margin:3px 0;color:#111;">
          ${ev.title}
        </div>
        <div style="font-size:12px;color:#444;margin-bottom:4px;">
          📍 ${ev.venue}<br/>
          📅 ${String(ev.start_datetime).slice(0, 16)}<br/>
          🎟️ <strong>${priceStr}</strong> (${ev.going_count || 0}/${ev.capacity || 100} going)
        </div>
        <a href="#/events/${ev.id}" style="
          display:inline-block;
          margin-top:4px;
          padding:4px 10px;
          background:#e63946;
          color:#fff;
          text-decoration:none;
          border-radius:4px;
          font-size:12px;
          font-weight:600;
        ">View Event Details →</a>
      </div>
    `
    marker.bindPopup(popupHtml)
    marker.on('click', () => {
      emit('select-event', ev)
    })
    markersLayer.addLayer(marker)
  })

  if (props.events.length === 1 && validBounds.length === 1) {
    mapInstance.setView(validBounds[0], 13)
  }
}

function jumpToRegion(regionKey) {
  activeRegion.value = regionKey
  emit('region-change', regionKey)
  if (!mapInstance) return

  const hub = REGION_HUBS[regionKey] || REGION_HUBS.All
  mapInstance.flyTo([hub.lat, hub.lng], hub.zoom, { duration: 0.9 })
}

onMounted(() => {
  if (!mapContainer.value) return
  const hub = REGION_HUBS[props.initialRegion] || REGION_HUBS.All

  mapInstance = L.map(mapContainer.value, {
    center: [hub.lat, hub.lng],
    zoom: hub.zoom,
    scrollWheelZoom: true
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapInstance)

  markersLayer = L.layerGroup().addTo(mapInstance)

  if (props.selectable) {
    mapInstance.on('click', (e) => {
      const lat = Math.round(e.latlng.lat * 1000000) / 1000000
      const lng = Math.round(e.latlng.lng * 1000000) / 1000000
      emit('pick-coordinates', { latitude: lat, longitude: lng })
    })
  }

  renderMarkers()
})

watch(
  () => props.events,
  () => {
    renderMarkers()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})
</script>

<template>
  <div class="apex-map-wrapper">
    <!-- Region Quick-Jump Toolbar (AU & MY) -->
    <div
      v-if="showRegionControls"
      class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2"
    >
      <div class="btn-group btn-group-sm flex-wrap" role="group" aria-label="Map region quick jump">
        <button
          v-for="(hub, key) in REGION_HUBS"
          :key="key"
          type="button"
          class="btn"
          :class="activeRegion === key ? 'btn-apex' : 'btn-outline-secondary'"
          @click="jumpToRegion(key)"
        >
          <i class="bi bi-compass me-1" aria-hidden="true"></i>{{ hub.name }}
        </button>
      </div>

      <!-- Legend -->
      <div class="d-flex flex-wrap gap-2 small align-items-center">
        <span class="badge" style="background: #e63946">Track Day</span>
        <span class="badge text-dark" style="background: #f4a261">Drift</span>
        <span class="badge text-dark" style="background: #0dcaf0">Meet</span>
        <span class="badge" style="background: #3b82f6">Drag</span>
        <span class="badge" style="background: #198754">Cruise</span>
        <span class="badge" style="background: #a855f7">Show</span>
      </div>
    </div>

    <!-- Map Canvas -->
    <div
      ref="mapContainer"
      class="rounded-3 border overflow-hidden shadow-sm"
      :style="{ height, width: '100%' }"
      role="region"
      aria-label="Interactive Motorsport Event Map"
    ></div>
  </div>
</template>
