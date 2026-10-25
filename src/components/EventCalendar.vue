<script setup>
/** Monthly and list views of the events supplied by Explore. */
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


const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, listPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  timeZone: 'local',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,listMonth'
  },
  buttonText: {
    today: 'Today',
    month: 'Month',
    list: 'List'
  },
  height: 'auto',
  eventColor: '#a52e20',
  eventTextColor: '#ffffff',
  noEventsContent: 'No events this month. Try another month.',
  events: props.events.map((ev) => ({
    id: String(ev.id),
    title: `[${ev.region === 'Malaysia' ? 'MY' : 'AU'}] ${ev.title}`,
    start: String(ev.start_datetime).replace(' ', 'T'),
    end: String(ev.end_datetime).replace(' ', 'T'),

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
  <div class="event-calendar">
    <p class="event-calendar__intro">Find a date that works for you. Select an event to see the details.</p>
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<style scoped>
.event-calendar {
  --calendar-bg: #101110;
  --calendar-surface: #171917;
  --calendar-text: #f4f2eb;
  --calendar-muted: #b3b5ac;
  --calendar-border: #343731;
  --calendar-accent: #ff5a1f;
  --calendar-today: #29201c;
  min-width: 0;
  padding: clamp(0.75rem, 2.5vw, 1.5rem);
  border: 1px solid var(--calendar-border);
  color: var(--calendar-text);
  background: var(--calendar-bg);
}

[data-bs-theme='light'] .event-calendar {
  --calendar-bg: #f7f6f2;
  --calendar-surface: #eeeee7;
  --calendar-text: #1c211d;
  --calendar-muted: #575e55;
  --calendar-border: #cdd0c6;
  --calendar-accent: #c2410c;
  --calendar-today: #f4e4dc;
}

.event-calendar__intro {
  margin: 0 0 1.25rem;
  color: var(--calendar-muted);
  font-size: 0.85rem;
  line-height: 1.6;
}

/* Set FullCalendar's own tokens locally, including its list and popover surfaces. */
.event-calendar :deep(.fc) {
  --fc-border-color: var(--calendar-border);
  --fc-page-bg-color: var(--calendar-bg);
  --fc-neutral-bg-color: var(--calendar-surface);
  --fc-neutral-text-color: var(--calendar-muted);
  --fc-today-bg-color: var(--calendar-today);
  --fc-list-event-hover-bg-color: var(--calendar-surface);
  --fc-event-selected-overlay-color: transparent;
  --fc-button-bg-color: var(--calendar-bg);
  --fc-button-text-color: var(--calendar-text);
  --fc-button-border-color: var(--calendar-border);
  --fc-button-hover-bg-color: var(--calendar-surface);
  --fc-button-hover-border-color: var(--calendar-muted);
  --fc-button-active-bg-color: #c2410c;
  --fc-button-active-border-color: #c2410c;
  font-family: inherit;
  font-size: 0.85rem;
}

.event-calendar :deep(.fc-header-toolbar) {
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
}

.event-calendar :deep(.fc-toolbar-chunk) { min-width: 0; }
.event-calendar :deep(.fc-toolbar-title) {
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: 600;
  letter-spacing: -0.035em;
}

.event-calendar :deep(.fc-button) {
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  border-radius: 0;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: none;
  box-shadow: none;
}

.event-calendar :deep(.fc-button-primary:not(:disabled):is(:active, .fc-button-active)) {
  color: #ffffff;
  box-shadow: none;
}

.event-calendar :deep(.fc-button-primary:focus) { box-shadow: none; }
.event-calendar :deep(:is(button, a, [tabindex]):focus-visible) {
  outline: 2px solid var(--calendar-accent);
  outline-offset: 2px;
}

.event-calendar :deep(.fc-col-header-cell-cushion),
.event-calendar :deep(.fc-daygrid-day-number),
.event-calendar :deep(.fc-list-day-cushion a) {
  color: var(--calendar-text);
  text-decoration: none;
}

.event-calendar :deep(.fc-col-header-cell-cushion) {
  padding: 0.75rem 0.2rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.event-calendar :deep(.fc-daygrid-day-number) { padding: 0.5rem; }
.event-calendar :deep(.fc-daygrid-event) { border-radius: 0; }
.event-calendar :deep(.fc-event) { cursor: pointer; }
.event-calendar :deep(.fc-daygrid-dot-event:hover) { background: var(--calendar-surface); }
.event-calendar :deep(.fc-daygrid-more-link) { color: var(--calendar-accent); }
.event-calendar :deep(.fc-list-event-title a) { color: inherit; }
.event-calendar :deep(.fc-list-day-cushion) { background: var(--calendar-surface); }
.event-calendar :deep(.fc-list-empty) {
  color: var(--calendar-muted);
  background: var(--calendar-bg);
}
.event-calendar :deep(.fc-popover) { box-shadow: none; }

@media (max-width: 700px) {
  .event-calendar :deep(.fc-toolbar-chunk:nth-child(2)) {
    flex-basis: 100%;
    order: -1;
  }
  .event-calendar :deep(.fc-header-toolbar) { justify-content: space-between; }
  .event-calendar :deep(.fc-button) { padding-inline: 0.6rem; }
  .event-calendar :deep(.fc-daygrid-day-number) { padding: 0.25rem; }
  .event-calendar :deep(.fc-list-event-time) { white-space: normal; }
}
</style>
