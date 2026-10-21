import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { computed, defineComponent, nextTick, reactive, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { compileStyle, parse } from '@vue/compiler-sfc'
import Navbar from '../../src/components/Navbar.vue'
import CommandSearchModal from '../../src/components/CommandSearchModal.vue'
import navbarSource from '../../src/components/Navbar.vue?raw'

const mocks = vi.hoisted(() => ({
  auth: null,
  theme: null,
  offline: null,
  showToast: vi.fn(),
  getDb: vi.fn()
}))
vi.mock('../../src/stores/authStore', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('../../src/stores/themeStore', () => ({ useThemeStore: () => mocks.theme }))
vi.mock('../../src/composables/useOfflineEvents', () => ({ useOfflineEvents: () => mocks.offline }))
vi.mock('../../src/composables/useToast', () => ({ useToast: () => ({ showToast: mocks.showToast }) }))
vi.mock('../../src/services/localDb', () => ({ getDb: mocks.getDb }))

const ModalStub = defineComponent({
  name: 'CommandSearchModal',
  props: { open: Boolean },
  emits: ['close'],
  template: '<div v-if="open" role="dialog" aria-label="Quick command search"><button @click="$emit(\'close\')">Close search</button></div>'
})
const RouteView = { template: '<router-view />' }
const publicLinks = [
  ['/', 'Home'], ['/events', 'Events'], ['/explore', 'Explore'], ['/clubs', 'Clubs'], ['/about', 'About']
]
const mountedWrappers = []
const outsideNodes = []

function signIn(role = 'member', overrides = {}) {
  mocks.auth.user = { name: 'Alex Grid', email: 'alex@example.test', role, avatar: '', ...overrides }
  mocks.auth.token = 'test-session'
}

async function mountNavbar({ path = '/', role = 'guest', actualModal = false } = {}) {
  if (role !== 'guest') signIn(role)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: RouteView },
      { path: '/events', component: RouteView, children: [
        { path: 'new', component: RouteView },
        { path: ':id', component: RouteView },
        { path: ':id/edit', component: RouteView }
      ] },
      { path: '/clubs', component: RouteView, children: [{ path: ':id', component: RouteView }] },
      ...['explore', 'about', 'login', 'register', 'my-events', 'profile', 'dashboard', 'admin'].map(name => ({
        path: `/${name}`, component: RouteView,
        children: [{ path: ':section', component: RouteView }]
      })),
      { path: '/:pathMatch(.*)*', component: RouteView }
    ]
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(Navbar, {
    attachTo: document.body,
    global: {
      plugins: [router],
      stubs: actualModal ? {} : { CommandSearchModal: ModalStub },
      directives: { focus: { mounted: el => el.focus() } }
    }
  })
  mountedWrappers.push(wrapper)
  return { wrapper, router }
}

function outsideButton() {
  const button = document.createElement('button')
  button.textContent = 'Outside navigation'
  document.body.append(button)
  outsideNodes.push(button)
  return button
}
function toggle(wrapper) { return wrapper.get('.nav-account-toggle') }
function modal(wrapper) { return wrapper.findComponent({ name: 'CommandSearchModal' }) }
function hrefs(wrapper, selector) { return wrapper.findAll(selector).map(link => link.attributes('href')) }
async function openMenu(wrapper) {
  await toggle(wrapper).trigger('click')
  expect(toggle(wrapper).attributes('aria-expanded')).toBe('true')
  expect(wrapper.get('#apex-navigation-panel').exists()).toBe(true)
}
async function keydown(key, modifiers = {}, target = window) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...modifiers })
  target.dispatchEvent(event)
  await nextTick()
  return event
}
async function navigate(router, path) {
  await router.push(path)
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  // Mirror Pinia's unwrapped getters, including admin inheriting organizer access.
  mocks.auth = reactive({
    user: null,
    token: null,
    isAuthenticated: computed(() => Boolean(mocks.auth.token && mocks.auth.user)),
    isGuest: computed(() => !mocks.auth.isAuthenticated),
    userRole: computed(() => mocks.auth.user?.role || 'guest'),
    isOrganizer: computed(() => mocks.auth.isAuthenticated && ['organizer', 'admin'].includes(mocks.auth.user.role)),
    isAdmin: computed(() => mocks.auth.isAuthenticated && mocks.auth.user.role === 'admin'),
    roleHomeRoute: computed(() => !mocks.auth.isAuthenticated ? '/login'
      : mocks.auth.isAdmin ? '/admin' : mocks.auth.isOrganizer ? '/dashboard' : '/my-events'),
    logout: vi.fn(() => { mocks.auth.user = null; mocks.auth.token = null })
  })
  mocks.theme = reactive({
    theme: 'dark',
    toggleTheme: vi.fn(() => { mocks.theme.theme = mocks.theme.theme === 'dark' ? 'light' : 'dark' })
  })
  mocks.offline = { isOnline: ref(true), savedEvents: ref([]) }
  mocks.getDb.mockReturnValue({ events: [], clubs: [] })
})
afterEach(() => {
  mountedWrappers.splice(0).forEach(wrapper => wrapper.unmount())
  outsideNodes.splice(0).forEach(node => node.remove())
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Navbar public navigation and current routes', () => {
  it('renders real public links, brand destination, and the four public dock destinations', async () => {
    const { wrapper } = await mountNavbar()
    expect(wrapper.get('.site-brand').attributes('href')).toBe('/')
    expect(wrapper.get('.site-brand').attributes('aria-label')).toBe('ApexGrid home')
    expect(wrapper.get('[aria-label="Primary navigation"]').findAll('a').map(link => [link.attributes('href'), link.text()])).toEqual(publicLinks)
    expect(hrefs(wrapper, '.mobile-dock a').slice(0, 4)).toEqual(publicLinks.slice(0, 4).map(([path]) => path))
    await openMenu(wrapper)
    expect(wrapper.get('[aria-label="More navigation"]').findAll('a').map(link => [link.attributes('href'), link.text()])).toEqual(publicLinks)
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it.each([
    ['/', '/'], ['/events', '/events'], ['/events/42/edit', '/events'],
    ['/clubs/7', '/clubs'], ['/explore', '/explore'], ['/about', '/about'], ['/events-nearby', null]
  ])('marks only the correct public link at %s (including nested routes)', async (path, current) => {
    const { wrapper } = await mountNavbar({ path })
    await openMenu(wrapper)
    for (const selector of ['.desktop-navigation a', '.nav-panel__public a', '.mobile-dock a']) {
      for (const link of wrapper.findAll(selector)) {
        const active = link.attributes('href') === current
        expect(link.attributes('aria-current'), `${selector}: ${link.attributes('href')}`).toBe(active ? 'page' : undefined)
        if (selector !== '.nav-panel__public a') expect(link.classes('is-current')).toBe(active)
      }
    }
  })

  it('updates the active destination after actual router navigation without making Home active', async () => {
    const { wrapper, router } = await mountNavbar()
    await wrapper.get('.desktop-navigation a[href="/events"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/events')
    expect(wrapper.get('.desktop-navigation a[href="/events"]').attributes('aria-current')).toBe('page')
    expect(wrapper.get('.desktop-navigation a[href="/"]').classes()).not.toContain('is-current')
    expect(wrapper.get('.desktop-navigation a[href="/"]').attributes('aria-current')).toBeUndefined()
  })
})

describe('Navbar disclosure and focus', () => {
  it('exposes a button disclosure, opens it, and toggles it closed again', async () => {
    const { wrapper } = await mountNavbar()
    expect(toggle(wrapper).attributes()).toMatchObject({ type: 'button', 'aria-controls': 'apex-navigation-panel', 'aria-expanded': 'false', 'aria-label': 'Open navigation menu' })
    expect(wrapper.find('#apex-navigation-panel').exists()).toBe(false)
    await openMenu(wrapper)
    await toggle(wrapper).trigger('click')
    expect(toggle(wrapper).attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('#apex-navigation-panel').exists()).toBe(false)
  })

  it('closes on Escape and restores focus to the disclosure button', async () => {
    const { wrapper } = await mountNavbar({ role: 'member' })
    await openMenu(wrapper)
    wrapper.get('.nav-panel a').element.focus()
    const event = await keydown('Escape', {}, document.activeElement)
    expect(event.defaultPrevented).toBe(true)
    expect(wrapper.find('.nav-panel').exists()).toBe(false)
    expect(document.activeElement).toBe(toggle(wrapper).element)
  })

  it('does not dismiss for clicks or focus inside the panel or its toggle', async () => {
    const { wrapper } = await mountNavbar({ role: 'member' })
    await openMenu(wrapper)
    await wrapper.get('.nav-panel__identity strong').trigger('click')
    wrapper.get('.nav-panel a').element.focus()
    await nextTick()
    expect(wrapper.find('.nav-panel').exists()).toBe(true)
    toggle(wrapper).element.focus()
    await nextTick()
    expect(wrapper.find('.nav-panel').exists()).toBe(true)
  })

  it('dismisses on an outside click without stealing the outside target focus', async () => {
    const { wrapper } = await mountNavbar()
    const outside = outsideButton()
    outside.focus()
    await openMenu(wrapper)
    outside.click()
    await nextTick()
    expect(wrapper.find('.nav-panel').exists()).toBe(false)
    expect(document.activeElement).toBe(outside)
  })

  it('dismisses when focus leaves the panel without requiring a click', async () => {
    const { wrapper } = await mountNavbar()
    await openMenu(wrapper)
    wrapper.get('.nav-panel a').element.focus()
    const outside = outsideButton()
    outside.focus()
    await nextTick()
    expect(wrapper.find('.nav-panel').exists()).toBe(false)
    expect(document.activeElement).toBe(outside)
  })

  it.each(['/events/42', '/?sort=latest', '/#upcoming'])('closes on a route/fullPath change to %s', async path => {
    const { wrapper, router } = await mountNavbar()
    await openMenu(wrapper)
    await navigate(router, path)
    expect(wrapper.find('.nav-panel').exists()).toBe(false)
    expect(toggle(wrapper).attributes('aria-expanded')).toBe('false')
  })

  it.each(['.nav-panel__public a[href="/events"]', '.site-brand', '.mobile-dock a[href="/events"]'])('closes when navigating via %s', async selector => {
    const { wrapper } = await mountNavbar()
    await openMenu(wrapper)
    await wrapper.get(selector).trigger('click')
    await flushPromises()
    expect(wrapper.find('.nav-panel').exists()).toBe(false)
  })

  it('closes an authenticated disclosure on session expiry and removes private content', async () => {
    const { wrapper } = await mountNavbar({ role: 'admin' })
    await openMenu(wrapper)
    mocks.auth.token = null
    await nextTick()
    expect(wrapper.find('.nav-panel').exists()).toBe(false)
    await openMenu(wrapper)
    expect(wrapper.find('.nav-panel__identity').exists()).toBe(false)
    expect(wrapper.find('.nav-panel__account').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('alex@example.test')
  })

  it('removes all three global handlers on unmount', async () => {
    const windowAdd = vi.spyOn(window, 'addEventListener')
    const windowRemove = vi.spyOn(window, 'removeEventListener')
    const documentAdd = vi.spyOn(document, 'addEventListener')
    const documentRemove = vi.spyOn(document, 'removeEventListener')
    const { wrapper } = await mountNavbar()
    const keyboardHandler = windowAdd.mock.calls.find(([type]) => type === 'keydown')[1]
    const clickHandler = documentAdd.mock.calls.find(([type]) => type === 'click')[1]
    const focusHandler = documentAdd.mock.calls.find(([type]) => type === 'focusin')[1]
    wrapper.unmount()
    mountedWrappers.splice(mountedWrappers.indexOf(wrapper), 1)
    expect(windowRemove).toHaveBeenCalledWith('keydown', keyboardHandler)
    expect(documentRemove).toHaveBeenCalledWith('click', clickHandler)
    expect(documentRemove).toHaveBeenCalledWith('focusin', focusHandler)
    expect((await keydown('k', { ctrlKey: true })).defaultPrevented).toBe(false)
  })
})

describe('Navbar account visibility and mobile portal', () => {
  it.each([
    ['guest', [], '/login', 'Sign in'],
    ['member', ['/my-events', '/profile'], '/my-events', 'My events'],
    ['organizer', ['/my-events', '/profile', '/dashboard', '/events/new'], '/dashboard', 'Dashboard'],
    ['admin', ['/my-events', '/profile', '/dashboard', '/events/new', '/admin'], '/admin', 'Admin']
  ])('shows only %s account links and its correct mobile destination', async (role, accountLinks, destination, label) => {
    const { wrapper, router } = await mountNavbar({ role })
    await openMenu(wrapper)
    expect(hrefs(wrapper, '.nav-panel__account a')).toEqual(accountLinks)
    expect(wrapper.find('.nav-sign-out').exists()).toBe(role !== 'guest')
    expect(wrapper.find('.desktop-auth').exists()).toBe(role === 'guest')
    if (role === 'guest') {
      expect(hrefs(wrapper, '.nav-panel__guest a')).toEqual(['/register', '/login'])
    } else {
      expect(toggle(wrapper).attributes('aria-label')).toBe('Account and navigation')
      expect(wrapper.get('.nav-panel__identity').text()).toContain('alex@example.test')
      expect(wrapper.get('.nav-panel__role').text()).toBe(role)
    }
    const portal = wrapper.findAll('.mobile-dock a')[4]
    expect(portal.attributes('href')).toBe(destination)
    expect(portal.text()).toBe(label)
    await portal.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe(destination)
    expect(wrapper.find('.nav-panel').exists()).toBe(false)
    expect(portal.attributes('aria-current')).toBe('page')
    expect(portal.classes()).toContain('is-current')
    expect(wrapper.get('.mobile-dock a[href="/"]').classes()).not.toContain('is-current')
  })

  it('labels the reactive saved count explicitly as offline saves, not RSVPs', async () => {
    mocks.offline.savedEvents.value = [{ id: 1 }, { id: 2 }]
    const { wrapper } = await mountNavbar({ role: 'member' })
    await openMenu(wrapper)
    const savedLink = wrapper.get('.nav-panel__account a[href="/my-events"]')
    expect(savedLink.text()).toContain('My RSVPs & saved events')
    expect(savedLink.get('small').text()).toBe('2 saved for offline')
    mocks.offline.savedEvents.value.push({ id: 3 })
    await nextTick()
    expect(savedLink.get('small').text()).toBe('3 saved for offline')
    mocks.offline.savedEvents.value = []
    await nextTick()
    expect(savedLink.find('small').exists()).toBe(false)
  })

  it('never exposes a stale user, cached saves, or authenticated actions to a guest', async () => {
    signIn('admin')
    mocks.auth.token = null
    mocks.offline.savedEvents.value = [{ id: 1 }, { id: 2 }]
    const { wrapper } = await mountNavbar()
    await openMenu(wrapper)
    expect(wrapper.find('.nav-panel__account').exists()).toBe(false)
    expect(wrapper.find('.nav-panel__identity').exists()).toBe(false)
    expect(wrapper.find('.nav-avatar').exists()).toBe(false)
    expect(wrapper.find('.nav-sign-out').exists()).toBe(false)
    expect(wrapper.text()).not.toMatch(/Alex Grid|alex@example\.test|saved for offline|Admin moderation|Organizer dashboard|Host an event/)

    for (const path of ['/my-events', '/profile', '/dashboard', '/events/new', '/admin']) {
      expect(hrefs(wrapper, 'a')).not.toContain(path)
    }
  })

  it('reacts to signing in and role changes without remounting', async () => {
    const { wrapper } = await mountNavbar()
    signIn('member')
    await nextTick()
    expect(wrapper.find('.desktop-auth').exists()).toBe(false)
    expect(wrapper.findAll('.mobile-dock a')[4].attributes('href')).toBe('/my-events')
    await openMenu(wrapper)
    mocks.auth.user.role = 'admin'
    await nextTick()
    expect(hrefs(wrapper, '.nav-panel__account a')).toContain('/admin')
    expect(hrefs(wrapper, '.nav-panel__account a')).toContain('/events/new')
    expect(wrapper.findAll('.mobile-dock a')[4].attributes('href')).toBe('/admin')
  })

  it('signs out once, shows the informational toast, closes, and navigates to login', async () => {
    const { wrapper, router } = await mountNavbar({ role: 'member', path: '/profile' })
    await openMenu(wrapper)
    wrapper.get('.nav-sign-out').element.focus()
    await wrapper.get('.nav-sign-out').trigger('click')
    await flushPromises()
    expect(mocks.auth.logout).toHaveBeenCalledTimes(1)
    expect(mocks.showToast).toHaveBeenCalledTimes(1)
    expect(mocks.showToast).toHaveBeenCalledWith('Signed out of your account.', 'info')
    expect(router.currentRoute.value.path).toBe('/login')
    expect(wrapper.find('.nav-panel').exists()).toBe(false)
    expect(document.activeElement).toBe(toggle(wrapper).element)
    expect(wrapper.find('.desktop-auth').exists()).toBe(true)
  })
})

describe('Navbar theme, browser connectivity, and avatar fallbacks', () => {
  it('announces the next theme action and updates the title and icon after each toggle', async () => {
    const { wrapper } = await mountNavbar()
    const themeButton = wrapper.get('button[aria-label="Switch to light theme"]')
    expect(themeButton.attributes('title')).toBe('Switch to light theme')
    expect(themeButton.find('.bi-sun').exists()).toBe(true)
    await themeButton.trigger('click')
    expect(mocks.theme.toggleTheme).toHaveBeenCalledTimes(1)
    expect(themeButton.attributes('aria-label')).toBe('Switch to dark theme')
    expect(themeButton.attributes('title')).toBe('Switch to dark theme')
    expect(themeButton.find('.bi-moon').exists()).toBe(true)
    await themeButton.trigger('click')
    expect(mocks.theme.toggleTheme).toHaveBeenCalledTimes(2)
    expect(themeButton.attributes('aria-label')).toBe('Switch to light theme')
  })

  it('reports browser connectivity only, with a truthful health disclaimer and offline note', async () => {
    const { wrapper } = await mountNavbar()
    expect(wrapper.find('.nav-offline-note').exists()).toBe(false)
    await openMenu(wrapper)
    const status = wrapper.get('.nav-connection')
    expect(status.attributes('role')).toBe('status')
    expect(status.text()).toBe('Browser online')
    expect(status.attributes('title')).toBe('Browser connectivity only; this does not measure API or app health.')
    expect(status.find('.bi-wifi').exists()).toBe(true)
    mocks.offline.isOnline.value = false
    await nextTick()
    expect(status.text()).toBe('Browser offline')
    expect(status.attributes('title')).toBe('Browser is offline; uncached content may be unavailable.')
    expect(status.find('.bi-wifi-off').exists()).toBe(true)
    expect(wrapper.find('.nav-offline-note').exists()).toBe(false)
    await toggle(wrapper).trigger('click')
    expect(wrapper.get('.nav-offline-note').attributes('role')).toBe('status')
    expect(wrapper.get('.nav-offline-note').text()).toBe('Browser offline')
    mocks.offline.isOnline.value = true
    await nextTick()
    expect(wrapper.find('.nav-offline-note').exists()).toBe(false)
  })

  it.each([['Alex Grid', 'AG'], ['  alex   grid racing  ', 'AG'], [undefined, 'A']])('uses initials for a missing avatar (%s)', async (name, initials) => {
    const { wrapper } = await mountNavbar({ role: 'member' })
    mocks.auth.user.name = name
    await nextTick()
    expect(wrapper.find('img.nav-avatar').exists()).toBe(false)
    expect(wrapper.get('.nav-avatar--initials').text()).toBe(initials)
    expect(wrapper.get('.nav-avatar--initials').attributes('aria-hidden')).toBe('true')
    if (!name) expect(wrapper.get('.nav-account-name').text()).toBe('Account')
  })

  it('falls back after an image error, retries a changed URL, and handles removal', async () => {
    const { wrapper } = await mountNavbar({ role: 'member' })
    mocks.auth.user.avatar = '/avatar-one.jpg'
    await nextTick()
    expect(wrapper.get('img.nav-avatar').attributes()).toMatchObject({ src: '/avatar-one.jpg', alt: '' })
    await wrapper.get('img.nav-avatar').trigger('error')
    expect(wrapper.find('img.nav-avatar').exists()).toBe(false)
    expect(wrapper.get('.nav-avatar--initials').text()).toBe('AG')
    mocks.auth.user.avatar = '/avatar-two.jpg'
    await nextTick()
    expect(wrapper.get('img.nav-avatar').attributes('src')).toBe('/avatar-two.jpg')
    expect(wrapper.find('.nav-avatar--initials').exists()).toBe(false)
    mocks.auth.user.avatar = ''
    await nextTick()
    expect(wrapper.get('.nav-avatar--initials').text()).toBe('AG')
  })
})

describe('Navbar search ownership and focus restoration', () => {
  it('opens from the search button, closes the menu, and restores the opener on modal close', async () => {
    const { wrapper } = await mountNavbar()
    await openMenu(wrapper)
    const searchButton = wrapper.get('button[aria-label="Open quick search"]')
    expect(searchButton.attributes('aria-keyshortcuts')).toBe('Control+k Meta+k')
    searchButton.element.focus()
    await searchButton.trigger('click')
    expect(modal(wrapper).props('open')).toBe(true)
    expect(wrapper.find('.nav-panel').exists()).toBe(false)
    wrapper.get('[role="dialog"] button').element.focus()
    await wrapper.get('[role="dialog"] button').trigger('click')
    await flushPromises()
    expect(modal(wrapper).props('open')).toBe(false)
    expect(document.activeElement).toBe(searchButton.element)
  })

  it('opening the disclosure closes search, keeping the two overlays mutually exclusive', async () => {
    const { wrapper } = await mountNavbar()
    await wrapper.get('.nav-search').trigger('click')
    expect(modal(wrapper).props('open')).toBe(true)
    await openMenu(wrapper)
    expect(modal(wrapper).props('open')).toBe(false)
  })

  it('closes search on navigation without restoring stale focus to its opener', async () => {
    const { wrapper, router } = await mountNavbar()
    const opener = wrapper.get('.nav-search').element
    opener.focus()
    await wrapper.get('.nav-search').trigger('click')
    const outside = outsideButton()
    outside.focus()
    await navigate(router, '/events/42')
    expect(modal(wrapper).props('open')).toBe(false)
    expect(document.activeElement).toBe(outside)
  })

  it('does not restore focus to an opener removed from the document', async () => {
    const { wrapper } = await mountNavbar()
    const opener = outsideButton()
    opener.focus()
    await keydown('k', { ctrlKey: true })
    opener.remove()
    const current = outsideButton()
    current.focus()
    modal(wrapper).vm.$emit('close')
    await flushPromises()
    expect(document.activeElement).toBe(current)
  })

  it('ignores plain K and repeated shortcuts while preventing the browser shortcut', async () => {
    const { wrapper } = await mountNavbar()
    expect((await keydown('k')).defaultPrevented).toBe(false)
    expect(modal(wrapper).props('open')).toBe(false)
    expect((await keydown('k', { ctrlKey: true, repeat: true })).defaultPrevented).toBe(true)
    expect(modal(wrapper).props('open')).toBe(false)
    await keydown('k', { ctrlKey: true })
    expect(modal(wrapper).props('open')).toBe(true)
    await keydown('k', { ctrlKey: true, repeat: true })
    expect(modal(wrapper).props('open')).toBe(true)
  })

  it.each([{ ctrlKey: true }, { metaKey: true }])('toggles exactly once per shortcut with the real modal mounted (%j)', async modifiers => {
    vi.useFakeTimers()
    const { wrapper } = await mountNavbar({ actualModal: true })
    const actualModal = wrapper.getComponent(CommandSearchModal)
    const opener = outsideButton()
    opener.focus()
    for (let cycle = 0; cycle < 2; cycle++) {
      const openEvent = await keydown('K', modifiers, document.activeElement)
      expect(openEvent.defaultPrevented).toBe(true)
      expect(actualModal.props('open')).toBe(true)
      expect(actualModal.emitted('close')).toBeUndefined()
      expect(wrapper.findAll('[role="dialog"]')).toHaveLength(1)
      await vi.advanceTimersByTimeAsync(60)
      expect(document.activeElement).toBe(wrapper.get('input[type="search"]').element)
      await keydown('k', { ...modifiers, repeat: true }, document.activeElement)
      expect(actualModal.props('open')).toBe(true)
      await keydown('k', modifiers, document.activeElement)
      expect(actualModal.props('open')).toBe(false)
      expect(actualModal.emitted('close')).toBeUndefined()
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
      expect(document.activeElement).toBe(opener)
    }
    await keydown('k', modifiers)
    await vi.advanceTimersByTimeAsync(60)
    await keydown('Escape', {}, document.activeElement)
    expect(actualModal.emitted('close')).toHaveLength(1)
    expect(actualModal.props('open')).toBe(false)
    expect(document.activeElement).toBe(opener)
  })
})

describe('Navbar compiled responsive styles', () => {
  it('scopes light overrides to both navbar roots, not the theme ancestor', () => {
    const { descriptor } = parse(navbarSource)
    const { code, errors } = compileStyle({ source: descriptor.styles[0].content, id: 'data-v-navbar-test', scoped: true })
    expect(errors).toEqual([])
    expect(code).toContain("[data-bs-theme='light'] .site-header[data-v-navbar-test]")
    expect(code).toContain("[data-bs-theme='light'] .mobile-dock[data-v-navbar-test]")
    expect(code).not.toContain("[data-bs-theme='light'][data-v-navbar-test]")
    expect(code).toMatch(/--nav-text:\s*#1c211d/)
  })

  it('compiles a global mobile body reserve and fixed safe-area-aware five-column dock', () => {
    const { descriptor } = parse(navbarSource)
    const { code, errors } = compileStyle({ source: descriptor.styles[0].content, id: 'data-v-navbar-test', scoped: true })
    expect(errors).toEqual([])
    const mobileCss = code.slice(code.indexOf('@media (max-width: 1199.98px)'))
    expect(mobileCss).toMatch(/body\s*\{\s*padding-bottom:\s*calc\(100px \+ env\(safe-area-inset-bottom, 0px\)\)/)
    expect(mobileCss).not.toContain('body[data-v-navbar-test]')
    expect(mobileCss).toMatch(/\.mobile-dock\[data-v-navbar-test\]\s*\{[^}]*position:\s*fixed/)
    expect(mobileCss).toMatch(/bottom:\s*calc\(12px \+ env\(safe-area-inset-bottom, 0px\)\)/)
    expect(mobileCss).toMatch(/grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/)
    expect(mobileCss).toContain('.mobile-dock a.is-current[data-v-navbar-test]')
  })
})
