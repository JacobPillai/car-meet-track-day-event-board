import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { compileStyle, parse } from '@vue/compiler-sfc'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import RegisterView from '../../src/views/RegisterView.vue'
import registerSource from '../../src/views/RegisterView.vue?raw'

const mocks = vi.hoisted(() => ({ auth: null, register: vi.fn(), showToast: vi.fn() }))
vi.mock('../../src/stores/authStore', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('../../src/composables/useToast', () => ({ useToast: () => ({ showToast: mocks.showToast }) }))

const deferred = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
async function mountRegister() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['/register', '/login', '/my-events', '/dashboard', '/unrelated'].map(path => ({
      path, component: { template: '<div />' }
    }))
  })
  await router.push('/register?redirect=/unrelated')
  await router.isReady()
  const push = vi.spyOn(router, 'push')
  const wrapper = mount(RegisterView, { attachTo: document.body, global: { plugins: [router] } })
  return { wrapper, router, push }
}
async function fillForm(wrapper) {
  await wrapper.get('#reg-name').setValue('Alex Mercer')
  await wrapper.get('#reg-email').setValue('alex@example.com')
  await wrapper.get('#reg-password').setValue('Password123!')
  await wrapper.get('#reg-confirm').setValue('Password123!')
}
enableAutoUnmount(afterEach)
afterEach(() => document.documentElement.removeAttribute('data-bs-theme'))
beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth = reactive({ loading: false, error: 'Old login failure', roleHomeRoute: '/my-events', register: mocks.register })
  mocks.register.mockResolvedValue({ name: 'Alex Mercer', role: 'member' })
})

describe('Join ApexGrid registration', () => {
  it('uses a short editorial introduction, one page heading, and the existing sign-in destination', async () => {
    const { wrapper } = await mountRegister()
    expect(wrapper.classes()).toContain('auth-page')
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toContain('Your next meet.')
    expect(wrapper.get('.auth-intro').element.compareDocumentPosition(wrapper.get('form').element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(wrapper.get('a').attributes('href')).toBe('/login')
    expect(wrapper.get('a').text()).toBe('Sign in')
    expect(wrapper.find('main').exists()).toBe(false)
    expect(wrapper.text()).not.toMatch(/licen[cs]e|sanctioned|telemetry|WCAG|Old login failure/i)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('preserves every field, empty defaults, region choices and only member/organizer roles', async () => {
    const { wrapper } = await mountRegister()
    for (const id of ['reg-name', 'reg-email', 'reg-password', 'reg-confirm', 'reg-bio']) {
      expect(wrapper.get(`#${id}`).element.value).toBe('')
    }
    expect(wrapper.findAll('input, select')).toHaveLength(8)
    expect(wrapper.findAll('input[name="account-role"]').map(node => node.element.value)).toEqual(['member', 'organizer'])
    expect(wrapper.get('#role-member').element.checked).toBe(true)
    expect(wrapper.get('#role-organizer').element.checked).toBe(false)
    expect(wrapper.get('#reg-region').element.value).toBe('Australia')
    expect(wrapper.findAll('#reg-region option').map(node => node.element.value)).toEqual(['Australia', 'Malaysia'])
    expect(wrapper.get('button[type="submit"]').text()).toContain('Create Member Account')
    await wrapper.get('#role-organizer').setValue()
    expect(wrapper.get('button[type="submit"]').text()).toContain('Create Organizer Account')
    expect(wrapper.text()).not.toMatch(/admin/i)
  })

  it('retains native required, length, email and password constraints, labels and associated hints', async () => {
    const { wrapper } = await mountRegister()
    expect(wrapper.get('form').attributes('novalidate')).toBeUndefined()
    for (const id of ['reg-name', 'reg-email', 'reg-password', 'reg-confirm', 'reg-region', 'reg-bio']) {
      const field = wrapper.get(`#${id}`)
      expect(wrapper.get(`label[for="${id}"]`).exists()).toBe(true)
      expect(field.element.required).toBe(id !== 'reg-bio')
      for (const hint of field.attributes('aria-describedby').split(' ')) {
        expect(wrapper.get(`#${hint}`).text().length).toBeGreaterThan(0)
      }
    }
    expect(wrapper.get('#reg-name').attributes('minlength')).toBe('3')
    expect(wrapper.get('#reg-name').attributes('autocomplete')).toBe('name')
    expect(wrapper.get('#reg-email').attributes('type')).toBe('email')
    expect(wrapper.get('#reg-email').attributes('autocomplete')).toBe('email')
    for (const id of ['reg-password', 'reg-confirm']) {
      expect(wrapper.get(`#${id}`).attributes('type')).toBe('password')
      expect(wrapper.get(`#${id}`).attributes('minlength')).toBe('8')
      expect(wrapper.get(`#${id}`).attributes('autocomplete')).toBe('new-password')
    }
    expect(wrapper.get('#reg-password').attributes('pattern')).toBe('(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}')
    expect(wrapper.get('#reg-password-rules').text()).toMatch(/8 characters.*uppercase.*lowercase.*number/)
    const email = wrapper.get('#reg-email')
    await email.setValue('not-an-email')
    expect(email.element.validity.typeMismatch).toBe(true)
    expect(wrapper.get('form').element.checkValidity()).toBe(false)
    expect(mocks.register).not.toHaveBeenCalled()
  })

  it.each(['shortA1', 'lowercase123', 'UPPERCASE123', 'NoNumbersHere'])('rejects a password missing a required rule: %s', async password => {
    const { wrapper } = await mountRegister()
    await fillForm(wrapper)
    await wrapper.get('#reg-password').setValue(password)
    expect(wrapper.get('#reg-password').element.validity.patternMismatch).toBe(true)
    expect(wrapper.get('form').element.checkValidity()).toBe(false)
  })

  it.each(['Abcdefg1', 'Password123!'])('accepts a password meeting the existing rules: %s', async password => {
    const { wrapper } = await mountRegister()
    await fillForm(wrapper)
    await wrapper.get('#reg-password').setValue(password)
    await wrapper.get('#reg-confirm').setValue(password)
    expect(wrapper.get('form').element.checkValidity()).toBe(true)
  })

  it.each([
    ['member', '/my-events', 'Australia', ''],
    ['organizer', '/dashboard', 'Malaysia', 'Weekend cruises and a Civic']
  ])('submits the exact %s payload and uses role-home routing, ignoring redirect queries', async (role, home, region, bio) => {
    const { wrapper, router, push } = await mountRegister()
    await fillForm(wrapper)
    await wrapper.get(`#role-${role}`).setValue()
    await wrapper.get('#reg-region').setValue(region)
    await wrapper.get('#reg-bio').setValue(bio)
    mocks.register.mockImplementationOnce(async () => {
      mocks.auth.roleHomeRoute = home
      return { name: 'Alex Mercer', role }
    })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.register).toHaveBeenCalledOnce()
        expect(mocks.register).toHaveBeenCalledWith({
      name: 'Alex Mercer', email: 'alex@example.com', password: 'Password123!', role, region, bio
    })
    expect(mocks.showToast).toHaveBeenCalledOnce()
    expect(mocks.showToast).toHaveBeenCalledWith('Account created! Welcome to ApexGrid, Alex Mercer.', 'success')
    expect(push).toHaveBeenCalledOnce()
    expect(push).toHaveBeenCalledWith(home)
    expect(router.currentRoute.value.path).toBe(home)
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(true)
    await wrapper.get('form').trigger('submit')
    expect(mocks.register).toHaveBeenCalledOnce()
  })

  it('associates an inline mismatch with confirmation, focuses it, and clears feedback when corrected', async () => {
    const { wrapper, push } = await mountRegister()
    await fillForm(wrapper)
    await wrapper.get('#reg-confirm').setValue('Different123!')
    expect(wrapper.find('#reg-confirm-error').exists()).toBe(false)
    await wrapper.get('form').trigger('submit')
    const confirm = wrapper.get('#reg-confirm')
    expect(confirm.attributes('aria-invalid')).toBe('true')
    expect(confirm.attributes('aria-errormessage')).toBe('reg-confirm-error')
    expect(confirm.attributes('aria-describedby')).toBe('reg-confirm-hint reg-confirm-error')
    expect(wrapper.get('#reg-confirm-error[role="alert"]').text()).toContain('Passwords do not match.')
    expect(document.activeElement).toBe(confirm.element)
    expect(mocks.register).not.toHaveBeenCalled()
    expect(mocks.showToast).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    await confirm.setValue('Password123!')
    expect(wrapper.find('#reg-confirm-error').exists()).toBe(false)
    expect(confirm.attributes('aria-invalid')).toBeUndefined()
    expect(confirm.attributes('aria-errormessage')).toBeUndefined()
    expect(confirm.attributes('aria-describedby')).toBe('reg-confirm-hint')
    // Changing the original password must also invalidate a previously checked confirmation.
    await wrapper.get('#reg-password').setValue('Changed123!')
    expect(confirm.attributes('aria-invalid')).toBe('true')
    await confirm.setValue('Changed123!')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.register).toHaveBeenCalledOnce()
  })

  it('shows only this submission’s API failure, focuses it, preserves inputs and clears it on retry', async () => {
    mocks.register.mockRejectedValueOnce(new Error('That email is already registered.'))
    const { wrapper, push } = await mountRegister()
    await fillForm(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    const error = wrapper.get('.auth-error-summary[role="alert"]')
    expect(error.text()).toBe('That email is already registered.')
    expect(document.activeElement).toBe(error.element)
    expect(wrapper.text()).not.toContain('Old login failure')
    expect(wrapper.get('#reg-email').element.value).toBe('alex@example.com')
    expect(wrapper.get('#reg-password').element.value).toBe('Password123!')
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(false)
    expect(mocks.showToast).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    const retry = deferred()
    mocks.register.mockReturnValueOnce(retry.promise)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.find('.auth-error-summary').exists()).toBe(false)
    retry.resolve({ name: 'Alex Mercer' })
    await flushPromises()
    expect(mocks.register).toHaveBeenCalledTimes(2)
    expect(push).toHaveBeenCalledOnce()
  })

  it.each([new Error(''), null])('uses a local fallback for an API failure without a message: %j', async error => {
    mocks.register.mockRejectedValueOnce(error)
    const { wrapper, push } = await mountRegister()
    await fillForm(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('.auth-error-summary').text()).toBe('Registration failed.')
    expect(push).not.toHaveBeenCalled()
  })

  it('locks fields, announces pending state, and blocks duplicate submissions independently of store loading', async () => {
    const pending = deferred()
    mocks.register.mockReturnValueOnce(pending.promise)
    const { wrapper } = await mountRegister()
    await fillForm(wrapper)
    await wrapper.get('form').trigger('submit')
    expect(mocks.auth.loading).toBe(false)
    expect(wrapper.get('form').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('.auth-fields').element.disabled).toBe(true)
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(true)
    expect(wrapper.get('button[type="submit"]').text()).toContain('Creating account…')
    expect(wrapper.get('[role="status"]').text()).toContain('Please wait')
    await wrapper.get('form').trigger('submit')
    expect(mocks.register).toHaveBeenCalledOnce()
    pending.reject(new Error('Try again later'))
    await flushPromises()
    expect(wrapper.get('form').attributes('aria-busy')).toBe('false')
    expect(wrapper.get('.auth-fields').element.disabled).toBe(false)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('also guards against an existing store request without exposing shared auth errors', async () => {
    mocks.auth.loading = true
    const { wrapper } = await mountRegister()
    await wrapper.get('form').trigger('submit')
    expect(mocks.register).not.toHaveBeenCalled()
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    mocks.auth.loading = false
    await wrapper.vm.$nextTick()
    await fillForm(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.register).toHaveBeenCalledOnce()
  })

  it.each(['resolve', 'reject'])('ignores a pending registration %s after unmount with no stale toast, navigation or focus', async outcome => {
    const pending = deferred()
    mocks.register.mockReturnValueOnce(pending.promise)
    const { wrapper, push, router } = await mountRegister()
    await fillForm(wrapper)
    await wrapper.get('form').trigger('submit')
    wrapper.unmount()
    // Vue Router resets its route when the final app using it unmounts.
    const unmountedRoute = router.currentRoute.value
    const focused = document.activeElement
    if (outcome === 'resolve') pending.resolve({ name: 'Alex Mercer' })
    else pending.reject(new Error('Late failure'))
    await flushPromises()
    expect(mocks.register).toHaveBeenCalledOnce()
    expect(mocks.showToast).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    expect(router.currentRoute.value).toBe(unmountedRoute)
    expect(document.activeElement).toBe(focused)
  })

  it('compiles both exact palettes with safe ancestor scoping, native controls, responsive layouts and focus rules', () => {
    const { descriptor, errors: parseErrors } = parse(registerSource)
    expect(parseErrors).toEqual([])
    expect(descriptor.styles).toHaveLength(1)
    expect(descriptor.styles[0].scoped).toBe(true)
    const { code, errors } = compileStyle({ source: descriptor.styles[0].content, id: 'data-v-auth', scoped: true })
    expect(errors).toEqual([])
    expect(code).toContain('.auth-page[data-v-auth]')
    expect(code).toContain("[data-bs-theme='light'] .auth-page[data-v-auth]")
    expect(code).not.toContain("[data-bs-theme='light'][data-v-auth]")
    expect(descriptor.styles[0].content).not.toContain(':global')
    for (const value of [
      '#181a19', '#222523', '#f3f0e9', '#b4b6af', '#41443f', '#ed7059',
      '#f4f1ea', '#e9e6de', '#242722', '#5f625a', '#c8c9bf', '#ae3d29'
    ]) expect(code).toContain(value)
    expect(code).toContain('color-scheme: dark')
    expect(code).toContain('color-scheme: light')
    expect(code).toContain(':focus-visible')
    expect(code).toContain('outline: 3px solid var(--auth-accent)')
    expect(code).toContain('@media (max-width: 991.98px)')
    expect(code).toContain('@media (max-width: 575.98px)')
    expect(code).not.toMatch(/animation:|transition:|gradient\(|box-shadow: (?!none)/)
  })

  it('keeps form values and the chosen role when the ancestor theme changes', async () => {
    const { wrapper } = await mountRegister()
    await fillForm(wrapper)
    await wrapper.get('#role-organizer').setValue()
    await wrapper.get('#reg-region').setValue('Malaysia')
    for (const theme of ['light', 'dark']) {
      document.documentElement.setAttribute('data-bs-theme', theme)
      expect(wrapper.element.closest('[data-bs-theme]').getAttribute('data-bs-theme')).toBe(theme)
      expect(wrapper.get('#reg-name').element.value).toBe('Alex Mercer')
      expect(wrapper.get('#role-organizer').element.checked).toBe(true)
      expect(wrapper.get('#reg-region').element.value).toBe('Malaysia')
    }
  })
})
