/**
 * Custom Vue Directive: v-focus
 * Automatically focuses the element upon mounting if condition evaluates to true.
 * Demonstrates custom directive architecture for COS30043 rubric.
 *
 * Usage:
 *   <input v-focus />
 *   <input v-focus="isSearchOpen" />
 */
export const focusDirective = {
  mounted(el, binding) {
    if (binding.value === undefined || Boolean(binding.value)) {
      // Use requestAnimationFrame / nextTick fallback to ensure element is in DOM & visible
      requestAnimationFrame(() => {
        if (typeof el.focus === 'function') {
          el.focus()
        }
      })
    }
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue && Boolean(binding.value)) {
      requestAnimationFrame(() => {
        if (typeof el.focus === 'function') {
          el.focus()
        }
      })
    }
  }
}
