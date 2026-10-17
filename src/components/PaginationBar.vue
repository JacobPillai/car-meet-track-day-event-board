<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['change-page'])

const pages = computed(() => {
  const list = []
  for (let i = 1; i <= props.totalPages; i += 1) {
    list.push(i)
  }
  return list
})

function selectPage(target) {
  if (target < 1 || target > props.totalPages || target === props.page) return
  emit('change-page', target)
}
</script>

<template>
  <nav
    v-if="totalPages > 1"
    aria-label="Events pagination"
    class="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-4 pt-3 border-top"
  >
    <div class="small text-body-secondary">
      Showing page <strong>{{ page }}</strong> of <strong>{{ totalPages }}</strong>
      <span v-if="totalItems"> ({{ totalItems }} total events)</span>
    </div>

    <ul class="pagination pagination-sm mb-0">
      <li class="page-item" :class="{ disabled: page <= 1 }">
        <button
          type="button"
          class="page-link"
          :disabled="page <= 1"
          aria-label="Previous page"
          @click="selectPage(page - 1)"
        >
          <i class="bi bi-chevron-left" aria-hidden="true"></i> Prev
        </button>
      </li>

      <li
        v-for="p in pages"
        :key="p"
        class="page-item"
        :class="{ active: p === page }"
      >
        <button
          type="button"
          class="page-link"
          :aria-current="p === page ? 'page' : undefined"
          @click="selectPage(p)"
        >
          {{ p }}
        </button>
      </li>

      <li class="page-item" :class="{ disabled: page >= totalPages }">
        <button
          type="button"
          class="page-link"
          :disabled="page >= totalPages"
          aria-label="Next page"
          @click="selectPage(page + 1)"
        >
          Next <i class="bi bi-chevron-right" aria-hidden="true"></i>
        </button>
      </li>
    </ul>
  </nav>
</template>
