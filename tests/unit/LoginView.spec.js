import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { compileStyle, parse } from '@vue/compiler-sfc'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import LoginView from '../../src/views/LoginView.vue'
import loginSource from '../../src/views/LoginView.vue?raw'

const mocks = vi.hoisted(() => ({ auth: null, login: vi.fn(), showToast: vi.fn() }))
vi.mock('../../src/stores/authStore', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('../../src/composables/useToast', () => ({ useToast: () => ({ showToast: mocks.showToast }) }))
function deferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
async function render(path = '/login') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['/login', '/register', '/my-events', '/dashboard', '/admin', '/events/:id'].map(path => ({ path, component: { template: '<div />' } }))
  })
  await router.push(path)
  await router.isReady()
  const push = vi.spyOn(router, 'push')
  const wrapper = mount(LoginView, { attachTo: document.body, global: { plugins: [router] } })
  return { wrapper, router, push }
}
async function fill(wrapper) {
  await wrapper.get('#login-email').setValue('alex@example.com')
  await wrapper.get('#login-password').setValue('Password123!')
}
enableAutoUnmount(afterEach)
beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth = reactive({ loading: false, error: 'Old registration error', roleHomeRoute: '/my-events', login: mocks.login })
  mocks.login.mockResolvedValue({ name: 'Alex', role: 'member' })
})

describe('Sign in', () => {
  it('uses one editorial heading, a labelled form section and the existing registration link', async () => {
    const { wrapper } = await render()
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toContain('Less scrolling.')
    expect(wrapper.get('[aria-labelledby="login-heading"] h2').text()).toBe('Sign in to ApexGrid')
    expect(wrapper.get('.auth-register a').attributes('href')).toBe('/register')
    expect(wrapper.get('.auth-register a').text()).toBe('Join ApexGrid')
    expect(wrapper.text()).not.toMatch(/telemetry|sanctioned|paddock access|JWT|Old registration error|WCAG/i)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
  it('preserves native email/password constraints, autocomplete and labelled hints', async () => {
    const { wrapper } = await render()
    expect(wrapper.get('form').attributes('novalidate')).toBeUndefined()
    for (const id of ['login-email', 'login-password']) {
      const field = wrapper.get(`#${id}`)
      expect(wrapper.get(`label[for="${id}"]`).exists()).toBe(true)
      expect(field.element.required).toBe(true)
      expect(field.element.value).toBe('')
      for (const describedBy of field.attributes('aria-describedby').split(' ')) expect(wrapper.get(`#${describedBy}`).exists()).toBe(true)
    }
    expect(wrapper.get('#login-email').attributes('type')).toBe('email')
    expect(wrapper.get('#login-email').attributes('autocomplete')).toBe('email')
    expect(wrapper.get('#login-password').attributes('type')).toBe('password')
    expect(wrapper.get('#login-password').attributes('minlength')).toBe('6')
    expect(wrapper.get('#login-password').attributes('autocomplete')).toBe('current-password')
  })
  it('retains actual browser validation constraints', async () => {
    const { wrapper } = await render()
    expect(wrapper.get('#login-email').element.checkValidity()).toBe(false)
    await wrapper.get('#login-email').setValue('not-an-email')
    expect(wrapper.get('#login-email').element.checkValidity()).toBe(false)
    await fill(wrapper)
    expect(wrapper.get('form').element.checkValidity()).toBe(true)
  })
  it('only shows the protected-route notice when requested', async () => {
    const { wrapper, router } = await render()
    expect(wrapper.find('.auth-notice').exists()).toBe(false)
    await router.push('/login?notice=auth_required&redirect=/events/1')
    await flushPromises()
    expect(wrapper.get('.auth-notice').attributes('role')).toBe('status')
    expect(wrapper.get('.auth-notice').text()).toContain('Account-role restrictions still apply')
  })
  it('submits exact credentials and returns to the requested event', async () => {
    const { wrapper, push } = await render('/login?redirect=/events/1')
    await fill(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.login).toHaveBeenCalledOnce()
        expect(mocks.login).toHaveBeenCalledWith('alex@example.com', 'Password123!')
    expect(push).toHaveBeenCalledWith('/events/1')
    expect(mocks.showToast).toHaveBeenCalledWith('Welcome back, Alex!', 'success')
  })
  it.each([['member', '/my-events'], ['organizer', '/dashboard'], ['admin', '/admin']])('uses the %s role destination returned after authentication', async (role, destination) => {
    mocks.login.mockImplementation(async () => {
      mocks.auth.roleHomeRoute = destination
      return { name: 'Alex', role }
    })
    const { wrapper, push } = await render()
    await fill(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(push).toHaveBeenCalledWith(destination)
  })
  it('guards repeated submissions and locks fields and demo quick-fill while pending', async () => {
    const request = deferred()
    mocks.login.mockReturnValue(request.promise)
    const { wrapper } = await render()
    await wrapper.get('.auth-demo-toggle').trigger('click')
    await fill(wrapper)
    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')
    expect(mocks.login).toHaveBeenCalledOnce()
    expect(wrapper.get('form').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('fieldset').element.disabled).toBe(true)
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(true)
    expect(wrapper.get('.auth-demo-accounts button').element.disabled).toBe(true)
    expect(wrapper.get('.auth-status').text()).toContain('Signing in')
    request.resolve({ name: 'Alex', role: 'member' })
    await flushPromises()
    await wrapper.get('form').trigger('submit')
    expect(mocks.login).toHaveBeenCalledOnce()
  })
  it('also respects the store loading flag', async () => {
    mocks.auth.loading = true
    const { wrapper } = await render()
    await wrapper.get('form').trigger('submit')
    expect(mocks.login).not.toHaveBeenCalled()
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(true)
  })
  it('preserves credentials on error, focuses feedback and allows retry', async () => {
    mocks.login.mockRejectedValueOnce(new Error('Email or password not recognised.'))
    const { wrapper, push } = await render()
    await fill(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('Email or password not recognised.')
    expect(document.activeElement).toBe(wrapper.get('[role="alert"]').element)
    expect(wrapper.get('#login-password').element.value).toBe('Password123!')
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(false)
    expect(push).not.toHaveBeenCalled()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(push).toHaveBeenCalledWith('/my-events')
  })
  it('uses store failure feedback if a rejected value has no message', async () => {
    mocks.login.mockImplementation(async () => { mocks.auth.error = 'Could not sign in.'; throw null })
    const { wrapper } = await render()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('Could not sign in.')
  })
  it.each(['resolve', 'reject'])('ignores late %s after leaving the sign-in page', async outcome => {
    const request = deferred()
    mocks.login.mockReturnValue(request.promise)
    const { wrapper, push } = await render()
    await fill(wrapper)
    await wrapper.get('form').trigger('submit')
    wrapper.unmount()
    if (outcome === 'resolve') request.resolve({ name: 'Alex', role: 'member' })
    else request.reject(new Error('Late failure'))
    await flushPromises()
    expect(push).not.toHaveBeenCalled()
    expect(mocks.showToast).not.toHaveBeenCalled()
  })
  it('keeps demo accounts behind an ARIA-linked disclosure', async () => {
    const { wrapper } = await render()
    const toggle = wrapper.get('.auth-demo-toggle')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('#login-demo-accounts').exists()).toBe(false)
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.get(`#${toggle.attributes('aria-controls')}`).text()).toContain('Password123!')
    expect(wrapper.get('#login-demo-accounts').text()).toContain('must exist in the active database')
    expect(wrapper.findAll('.auth-demo-accounts li')).toHaveLength(4)
    expect(wrapper.findAll('.auth-demo-home').map(node => node.text())).toEqual(['Default page: /my-events', 'Default page: /dashboard', 'Default page: /dashboard', 'Default page: /admin'])
    await toggle.trigger('click')
    expect(wrapper.find('#login-demo-accounts').exists()).toBe(false)
  })
  it.each([
    ['Member', 'member@apexgrid.com'],
    ['Organizer · Australia', 'organizer@apexgrid.com'],
    ['Organizer · Malaysia', 'naveed@apexgrid.com'],
    ['Admin', 'admin@apexgrid.com']
  ])('quick-fills %s without signing in automatically', async (label, email) => {
    const { wrapper } = await render()
    await wrapper.get('.auth-demo-toggle').trigger('click')
    const account = wrapper.findAll('.auth-demo-accounts button').find(button => button.attributes('aria-label').includes(`Fill ${label} demo`))
    await account.trigger('click')
    await flushPromises()
    expect(wrapper.get('#login-email').element.value).toBe(email)
    expect(wrapper.get('#login-password').element.value).toBe('Password123!')
    expect(document.activeElement).toBe(wrapper.get('#login-email').element)
    expect(mocks.login).not.toHaveBeenCalled()
    expect(mocks.showToast).toHaveBeenCalledWith(`Filled credentials for ${email}`, 'info', 2200)
  })
  it('compiles complete scoped light-theme selectors and responsive focus rules', () => {
    const { descriptor } = parse(loginSource)
    const result = compileStyle({ source: descriptor.styles[0].content, filename: 'LoginView.vue', id: 'data-v-login-test', scoped: true })
    expect(result.errors).toEqual([])
    expect(result.code).toMatch(/\[data-bs-theme=['"]light['"]\] .auth-page\[data-v-login-test\]/)
    expect(result.code).toContain('--auth-bg: #f4f1ea')
    expect(result.code).toContain('color-scheme: light')
    expect(result.code).toContain(':focus-visible')
    expect(result.code).toContain('@media (max-width: 575.98px)')
    expect(result.code).not.toMatch(/animation:|box-shadow: 0/)
  })
})
