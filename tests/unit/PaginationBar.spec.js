/**
 * ApexGrid — Unit Tests for PaginationBar.vue (Gibson's QA Suite)
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PaginationBar from '../../src/components/PaginationBar.vue'

describe('PaginationBar.vue', () => {
  it('hides pagination bar when totalPages is 1', () => {
    const wrapper = mount(PaginationBar, {
      props: { page: 1, totalPages: 1, totalItems: 4 }
    })
    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('renders page buttons and emits change-page when a valid page is clicked', async () => {
    const wrapper = mount(PaginationBar, {
      props: { page: 1, totalPages: 3, totalItems: 15 }
    })

    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.text()).toContain('Showing page 1 of 3 (15 total events)')

    const nextBtn = wrapper.find('button[aria-label="Next page"]')
    await nextBtn.trigger('click')
    expect(wrapper.emitted('change-page')).toBeTruthy()
    expect(wrapper.emitted('change-page')[0]).toEqual([2])
  })
})
