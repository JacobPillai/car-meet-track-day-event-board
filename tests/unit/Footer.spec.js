import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { RouterLinkStub } from '@vue/test-utils'
import { compileStyle, parse } from '@vue/compiler-sfc'
import Footer from '../../src/components/Footer.vue'
import footerSource from '../../src/components/Footer.vue?raw'

const mocks = vi.hoisted(() => ({ offline: null, resetLocalDb: vi.fn() }))
vi.mock('../../src/composables/useOfflineEvents', () => ({ useOfflineEvents: () => mocks.offline }))
vi.mock('../../src/services/localDb', () => ({ resetLocalDb: mocks.resetLocalDb }))
const wrappers = []
function render() {
  const wrapper = mount(Footer, { attachTo: document.body, global: { stubs: { RouterLink: RouterLinkStub } } })
  wrappers.push(wrapper)
  return wrapper
}
function button(wrapper, text) { return wrapper.findAll('button').find(node => node.text().includes(text)) }
beforeEach(() => {
  vi.clearAllMocks()
  mocks.offline = { canInstallPwa: ref(false), savedEvents: ref([]), promptPwaInstall: vi.fn().mockResolvedValue(false) }
})
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
  vi.unstubAllGlobals()
})

describe('Footer', () => {
  it('preserves discovery and account destinations without unsupported verification or health claims', () => {
    const wrapper = render()
    const links = wrapper.findAllComponents(RouterLinkStub).map(link => link.props('to'))
    expect(links).toEqual(['/', '/', '/events', '/explore', '/clubs', '/about', '/login', '/my-events', '/dashboard', '/admin'])
    expect(wrapper.text()).toContain('appropriate account role')
    expect(wrapper.text()).not.toMatch(/verified car clubs|telemetry|mercury ready|pwa live/i)
    expect(wrapper.get('footer').attributes('aria-label')).toBe('Site footer')
  })
  it('keeps academic and team attribution', () => {
    const wrapper = render()
    expect(wrapper.text()).toContain('COS30043')
    expect(wrapper.text()).toContain('Jacob, Syed, Naveed & Gibson')
  })
  it('labels offline saves separately from RSVPs and reacts to changes', async () => {
    const wrapper = render()
    expect(wrapper.get('.footer-offline').text()).toBe('0 events saved for offline')
    mocks.offline.savedEvents.value = [{ id: 1 }]
    await flushPromises()
    expect(wrapper.get('.footer-offline').text()).toBe('1 event saved for offline')
    mocks.offline.savedEvents.value.push({ id: 2 })
    await flushPromises()
    expect(wrapper.get('.footer-offline').text()).toBe('2 events saved for offline')
  })
  it('only offers installation when the browser prompt is available', async () => {
    const wrapper = render()
    expect(wrapper.find('.footer-install').exists()).toBe(false)
    mocks.offline.canInstallPwa.value = true
    await flushPromises()
    await wrapper.get('.footer-install').trigger('click')
    expect(mocks.offline.promptPwaInstall).toHaveBeenCalledOnce()
  })
  it('prevents repeated install prompts while pending and recovers after failure', async () => {
    let rejectInstall
    mocks.offline.canInstallPwa.value = true
    mocks.offline.promptPwaInstall.mockImplementationOnce(() => new Promise((resolve, reject) => { rejectInstall = reject }))
    const wrapper = render()
    await wrapper.get('.footer-install').trigger('click')
    expect(wrapper.get('.footer-install').attributes('disabled')).toBeDefined()
    await wrapper.get('.footer-install').trigger('click')
    expect(mocks.offline.promptPwaInstall).toHaveBeenCalledOnce()
    rejectInstall(new Error('Unavailable'))
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('could not open')
    expect(wrapper.get('.footer-install').attributes('disabled')).toBeUndefined()
    await wrapper.get('.footer-install').trigger('click')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
  it('does not treat a declined installation as an error', async () => {
    mocks.offline.canInstallPwa.value = true
    const wrapper = render()
    await wrapper.get('.footer-install').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
  it('exposes the credits disclosure with synchronized ARIA and all source groups', async () => {
    const wrapper = render()
    const toggle = button(wrapper, 'Sources & credits')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('#apex-footer-credits').exists()).toBe(false)
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    const panel = wrapper.get(`#${toggle.attributes('aria-controls')}`)
    expect(panel.findAll('h3').map(node => node.text())).toEqual(['Built with', 'Type & design', 'Photography & project'])
    expect(panel.text()).toContain('CREDITS.md')
    expect(panel.text()).toContain('OpenStreetMap contributors')
    expect(panel.text()).toContain('licence still need verification')
    await toggle.trigger('click')
    expect(wrapper.find('#apex-footer-credits').exists()).toBe(false)
  })
  it.each(['close button', 'Escape'])('closes credits using %s and returns focus', async method => {
    const wrapper = render()
    const toggle = button(wrapper, 'Sources & credits')
    await toggle.trigger('click')
    const close = wrapper.get('[aria-label="Close credits panel"]')
    close.element.focus()
    if (method === 'Escape') await close.trigger('keydown', { key: 'Escape' })
    else await close.trigger('click')
    await flushPromises()
    expect(wrapper.find('#apex-footer-credits').exists()).toBe(false)
    expect(document.activeElement).toBe(toggle.element)
  })
  it('does not reset local data when confirmation is cancelled', async () => {
    const wrapper = render()
    const confirm = vi.fn().mockReturnValue(false)
    const reload = vi.fn()
    vi.stubGlobal('window', { confirm, location: { reload } })
    button(wrapper, 'Reset seed database').element.click()
    await flushPromises()
    expect(confirm).toHaveBeenCalledOnce()
    expect(confirm.mock.calls[0][0]).toContain('local accounts, events, RSVPs, likes and comments')
    expect(confirm.mock.calls[0][0]).toContain('does not reset the server database or your offline-saved events')
    expect(mocks.resetLocalDb).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })
  it('retains confirmed local reset followed by reload', async () => {
    const wrapper = render()
    const reload = vi.fn()
    vi.stubGlobal('window', { confirm: vi.fn().mockReturnValue(true), location: { reload } })
    button(wrapper, 'Reset seed database').element.click()
    await flushPromises()
    expect(mocks.resetLocalDb).toHaveBeenCalledOnce()
    expect(reload).toHaveBeenCalledOnce()
    expect(mocks.resetLocalDb.mock.invocationCallOrder[0]).toBeLessThan(reload.mock.invocationCallOrder[0])
  })
  it('compiles scoped light-theme overrides and retains responsive/focus rules', () => {
    const { descriptor } = parse(footerSource)
    const result = compileStyle({ source: descriptor.styles[0].content, filename: 'Footer.vue', id: 'data-v-footer-test', scoped: true })
    expect(result.errors).toEqual([])
    expect(result.code).toMatch(/\[data-bs-theme=['"]light['"]\] .site-footer\[data-v-footer-test\]/)
    expect(result.code).toContain('--footer-bg: #eeebe4')
    expect(result.code).toContain(':focus-visible')
    expect(result.code).toContain('@media (max-width: 767px)')
    expect(result.code).not.toContain('animation:')
  })
})
