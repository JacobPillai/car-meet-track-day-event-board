<script setup>
import { useToast } from '../composables/useToast'

const { toasts, dismissToast } = useToast()

const iconMap = {
  success: 'bi-check-circle-fill text-success',
  warning: 'bi-exclamation-triangle-fill text-warning',
  danger: 'bi-x-octagon-fill text-danger',
  info: 'bi-broadcast text-info'
}
</script>

<template>
  <div
    class="position-fixed bottom-0 end-0 p-3 d-flex flex-column gap-2"
    style="z-index: 1085; max-width: 380px; width: 100%; pointer-events: none"
    aria-live="polite"
    aria-atomic="true"
  >
    <div
      v-for="t in toasts"
      :key="t.id"
      class="apex-card p-3 shadow-lg d-flex align-items-start justify-content-between gap-2 border-start border-4"
      :class="{
        'border-success': t.type === 'success',
        'border-warning': t.type === 'warning',
        'border-danger': t.type === 'danger',
        'border-info': t.type === 'info'
      }"
      style="pointer-events: auto; backdrop-filter: blur(16px)"
      role="status"
    >
      <div class="d-flex align-items-start gap-2 small">
        <i :class="['bi', iconMap[t.type] || iconMap.info, 'fs-6']" aria-hidden="true"></i>
        <div class="fw-medium">{{ t.message }}</div>
      </div>
      <button
        type="button"
        class="btn-close btn-sm"
        aria-label="Dismiss notification"
        @click="dismissToast(t.id)"
      ></button>
    </div>
  </div>
</template>
