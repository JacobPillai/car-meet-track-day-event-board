<script setup>
/**
 * ApexGrid — FullCalendar Schedule View Component (Naveed's Advanced Feature)
 * Displays monthly grid (dayGridMonth) and track schedule list (listMonth) views.
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'

const props = defineProps({
  events: {
    type: Array,
    default: () => []
  }
})

const router = useRouter()

const categoryColorMap = {
  'track-day': '#e63946',
  drift: '#f4a261',
  meet: '#0dcaf0',
  drag: '#3b82f6',
  cruise: '#198754',
  show: '#a855f7'
}

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, listPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  initialDate: '2026-10-24',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,listMonth'
  },
  buttonText: {
    today: 'Oct/Nov 2026',
    month: 'Month Grid',
    list: 'Track Schedule List'
  },
  height: 'auto',
  events: props.events.map((ev) => ({
    id: String(ev.id),
    title: `[${ev.region === 'Malaysia' ? 'MY' : 'AU'}] ${ev.title}`,
    start: String(ev.start_datetime).replace(' ', 'T'),
    end: String(ev.end_datetime).replace(' ', 'T'),
    backgroundColor: categoryColorMap[ev.category_slug] || '#e63946',
    borderColor: categoryColorMap[ev.category_slug] || '#e63946',
    textColor: ['drift', 'meet'].includes(ev.category_slug) ? '#111318' : '#ffffff',
    extendedProps: {
      venue: ev.venue,
      category: ev.category_name
    }
  })),
  eventClick(info) {
    info.jsEvent.preventDefault()
    if (info.event && info.event.id) {
      router.push(`/events/${info.event.id}`)
    }
  }
}))
</script>

<template>
  <div class="apex-card p-3">
    <FullCalendar :options="calendarOptions" />
  </div>
</template>
