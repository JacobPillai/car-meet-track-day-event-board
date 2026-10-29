
<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  fetchCircuitWeather,
  searchVenueGeocode,
} from '../services/externalApis'

const venue = ref('Sepang International Circuit')
const latitude = ref(2.7608)
const longitude = ref(101.7381)
const region = ref('Malaysia')
const weather = ref(null)
const loading = ref(false)
const error = ref('')
const searchResults = ref([])
const searching = ref(false)

const risk = computed(() => {
  if (!weather.value) return null

  const w = weather.value
  let score = 0
  const warnings = []

  if (w.rainProbPercent >= 70) {
    score += 45
    warnings.push('High probability of rain. Check the track surface before driving.')
  } else if (w.rainProbPercent >= 40) {
    score += 25
    warnings.push('Rain is possible. Prepare for changing grip levels.')
  }

  if (w.windSpeedKmh >= 50) {
    score += 30
    warnings.push('Strong winds may affect vehicle stability.')
  } else if (w.windSpeedKmh >= 30) {
    score += 15
    warnings.push('Moderate to strong winds. Use extra caution.')
  }

  if (w.condition.includes('Thunderstorm')) {
    score += 50
    warnings.push('Thunderstorm conditions. Postpone track activity and follow official instructions.')
  }

  if (w.condition.includes('Fog')) {
    score += 30
    warnings.push('Reduced visibility. Check conditions before entering the circuit.')
  }

  if (w.ambientTempC >= 35) {
    score += 15
    warnings.push('High ambient temperature. Monitor hydration and vehicle temperatures.')
  }

  score = Math.min(score, 100)

  if (!warnings.length) {
    warnings.push('No major weather warning detected by this basic checker.')
  }

  return {
    score,
    level: score >= 60 ? 'High' : score >= 30 ? 'Moderate' : 'Low',
    warnings,
  }
})

async function loadWeather() {
  loading.value = true
  error.value = ''

  try {
    weather.value = await fetchCircuitWeather(
      latitude.value,
      longitude.value,
      region.value,
    )
  } catch (err) {
    error.value = err.message || 'Unable to load weather data.'
  } finally {
    loading.value = false
  }
}

async function findVenue() {
  if (venue.value.trim().length < 2) {
    error.value = 'Enter a venue name to search.'
    return
  }

  searching.value = true
  error.value = ''

  try {
    searchResults.value = await searchVenueGeocode(venue.value, region.value)

    if (!searchResults.value.length) {
      error.value = 'No matching locations found. Try another search.'
    }
  } finally {
    searching.value = false
  }
}

function selectVenue(place) {
  venue.value = place.venue
  latitude.value = place.latitude
  longitude.value = place.longitude
  region.value = place.region
  searchResults.value = []
  loadWeather()
}

onMounted(loadWeather)
</script>

<template>
  <div class="container py-4 py-lg-5">
    <div class="mb-4">
      <p class="text-uppercase small fw-bold mb-2">APEXGRID / TRACK INTELLIGENCE</p>
      <h1 class="display-6 fw-bold">Track Safety Intelligence</h1>
      <p class="text-secondary">
        Review weather conditions and potential hazards before your track day.
      </p>
    </div>

    <form class="card p-3 mb-4" @submit.prevent="findVenue">
      <label for="venue" class="form-label fw-semibold">Track or venue</label>
      <div class="d-flex flex-column flex-sm-row gap-2">
        <input
          id="venue"
          v-model="venue"
          class="form-control"
          placeholder="Search a circuit or location"
        />
        <button class="btn btn-primary" type="submit" :disabled="searching">
          {{ searching ? 'Searching...' : 'Find venue' }}
        </button>
      </div>

      <div v-if="searchResults.length" class="list-group mt-3">
        <button
          v-for="(place, index) in searchResults"
          :key="`${place.latitude}-${place.longitude}-${index}`"
          type="button"
          class="list-group-item list-group-item-action text-start"
          @click="selectVenue(place)"
        >
          <strong>{{ place.venue }}</strong>
          <span class="d-block small text-secondary">{{ place.address }}</span>
        </button>
      </div>
    </form>

    <div v-if="error" class="alert alert-warning" role="alert">
      {{ error }}
    </div>

    <div v-if="loading" class="card p-5 text-center">
      <div class="spinner-border mx-auto mb-3" role="status">
        <span class="visually-hidden">Loading</span>
      </div>
      Loading track conditions...
    </div>

    <template v-else-if="weather">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h2 class="h4 mb-1">{{ venue }}</h2>
          <p class="text-secondary small mb-0">
            {{ weather.source }}
          </p>
        </div>
        <span class="badge rounded-pill"
          :class="weather.live ? 'text-bg-success' : 'text-bg-secondary'">
          {{ weather.live ? 'Live API data' : 'Fallback data' }}
        </span>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="card h-100 p-3">
            <i class="bi bi-thermometer-half fs-3 mb-2"></i>
            <span class="small text-secondary">Air temperature</span>
            <strong class="fs-3">{{ weather.ambientTempC }}°C</strong>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card h-100 p-3">
            <i class="bi bi-moisture fs-3 mb-2"></i>
            <span class="small text-secondary">Rain probability</span>
            <strong class="fs-3">{{ weather.rainProbPercent }}%</strong>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card h-100 p-3">
            <i class="bi bi-wind fs-3 mb-2"></i>
            <span class="small text-secondary">Wind speed</span>
            <strong class="fs-3">{{ weather.windSpeedKmh }} km/h</strong>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card h-100 p-3">
            <i class="bi bi-speedometer2 fs-3 mb-2"></i>
            <span class="small text-secondary">Estimated track temp.</span>
            <strong class="fs-3">{{ weather.trackTempC }}°C</strong>
          </div>
        </div>
      </div>

      <div class="card p-4 mb-3">
        <div class="d-flex flex-wrap justify-content-between gap-2 mb-3">
          <div>
            <h2 class="h5 mb-1">Weather risk assessment</h2>
            <p class="text-secondary small mb-0">
              A rule-based estimate from the available weather data.
            </p>
          </div>
          <span class="badge align-self-start"
            :class="{
              'text-bg-success': risk.level === 'Low',
              'text-bg-warning': risk.level === 'Moderate',
              'text-bg-danger': risk.level === 'High'
            }">
            {{ risk.level }} risk
          </span>
        </div>

        <div class="progress mb-3" style="height: 12px" role="progressbar"
          :aria-valuenow="risk.score" aria-valuemin="0" aria-valuemax="100"
          :aria-label="`Estimated risk score: ${risk.score} out of 100`">
          <div class="progress-bar"
            :class="{
              'bg-success': risk.level === 'Low',
              'bg-warning': risk.level === 'Moderate',
              'bg-danger': risk.level === 'High'
            }"
            :style="{ width: `${risk.score}%` }">
          </div>
        </div>

        <p class="mb-3">
          Estimated risk score: <strong>{{ risk.score }}/100</strong>
        </p>

        <ul class="mb-0">
          <li v-for="warning in risk.warnings" :key="warning" class="mb-2">
            {{ warning }}
          </li>
        </ul>
      </div>

      <div class="card p-4 mb-3">
        <h2 class="h5">Track conditions</h2>
        <p class="mb-2">{{ weather.condition }}</p>
        <p class="text-secondary mb-2">{{ weather.surface }}</p>
        <p class="mb-0">
          <strong>Tyre guidance:</strong> {{ weather.tireAdvice }}
        </p>
      </div>

      <div class="alert alert-info">
        <strong>Safety note:</strong>
        This dashboard is an advisory tool, not an official track-safety decision.
        Weather-based estimates cannot confirm actual track grip or surface temperature.
        Always follow circuit staff and official weather warnings.
      </div>

      <button class="btn btn-outline-primary" @click="loadWeather">
        <i class="bi bi-arrow-clockwise me-1"></i>
        Refresh conditions
      </button>
    </template>
  </div>
</template>
