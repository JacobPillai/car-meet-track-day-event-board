/**
 * ApexGrid — Pinia Events & Filters Store with Persisted Filter State
 */

import { defineStore } from 'pinia'
import { ref, reactive, watch } from 'vue'
import { api } from '../services/api'

const FILTERS_STORAGE_KEY = 'apexgrid_event_filters_v1'

function loadSavedFilters() {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // ignore
  }
  return {
    search: '',
    category: '',
    region: 'All',
    status: 'all',
    date_from: '',
    max_price: '',
    sort: 'date',
    page: 1,
    limit: 6
  }
}

export const useEventStore = defineStore('events', () => {
  const events = ref([])
  const categories = ref([])
  const clubs = ref([])
  const loading = ref(false)
  const error = ref(null)

  const pagination = reactive({
    page: 1,
    limit: 6,
    total: 0,
    total_pages: 1
  })

  const filters = reactive(loadSavedFilters())

  watch(
    () => ({ ...filters }),
    (val) => {
      try {
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(val))
      } catch {
        // ignore
      }
    },
    { deep: true }
  )

  async function fetchCategories() {
    const res = await api.get('/categories')
    categories.value = res.data || []
    return categories.value
  }

  async function fetchClubs(params = {}) {
    const res = await api.get('/clubs', params)
    clubs.value = res.data || []
    return clubs.value
  }

  async function fetchEvents(overrideParams = {}) {
    loading.value = true
    error.value = null
    try {
      const query = {
        search: filters.search,
        category: filters.category,
        region: filters.region === 'All' ? '' : filters.region,
        status: filters.status === 'all' ? '' : filters.status,
        date_from: filters.date_from,
        max_price: filters.max_price,
        sort: filters.sort,
        page: filters.page,
        limit: filters.limit,
        ...overrideParams
      }
      const res = await api.get('/events', query)
      events.value = res.data || []
      pagination.page = res.page || 1
      pagination.limit = res.limit || 6
      pagination.total = res.total || 0
      pagination.total_pages = res.total_pages || 1
      return res
    } catch (err) {
      error.value = err.message || 'Failed to load events.'
      throw err
    } finally {
      loading.value = false
    }
  }

  function resetFilters() {
    filters.search = ''
    filters.category = ''
    filters.region = 'All'
    filters.status = 'all'
    filters.date_from = ''
    filters.max_price = ''
    filters.sort = 'date'
    filters.page = 1
    filters.limit = 6
  }

  async function setRsvp(eventId, status) {
    if (!status) {
      return api.delete(`/events/${eventId}/rsvp`)
    }
    return api.post(`/events/${eventId}/rsvp`, { status })
  }

  async function toggleLike(eventId, currentlyLiked) {
    if (currentlyLiked) {
      return api.delete(`/events/${eventId}/like`)
    }
    return api.post(`/events/${eventId}/like`)
  }

  return {
    events,
    categories,
    clubs,
    loading,
    error,
    pagination,
    filters,
    fetchCategories,
    fetchClubs,
    fetchEvents,
    resetFilters,
    setRsvp,
    toggleLike
  }
})
