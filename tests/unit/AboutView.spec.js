import { afterEach, describe, expect, it } from 'vitest'
import { compileStyle, parse } from '@vue/compiler-sfc'
import { enableAutoUnmount, mount, RouterLinkStub } from '@vue/test-utils'
import AboutView from '../../src/views/AboutView.vue'
import aboutSource from '../../src/views/AboutView.vue?raw'

const ids = ['architecture', 'roadmap', 'a11y']
function mountAbout() {
  return mount(AboutView, {
    attachTo: document.body,
    global: { stubs: { RouterLink: RouterLinkStub } }
  })
}
function tab(wrapper, id) {
  return wrapper.get(`#about-tab-${id}`)
}
function panel(wrapper, id) {
  return wrapper.get(`#about-panel-${id}`)
}
function expectSelection(wrapper, selected) {
  for (const id of ids) {
    expect(tab(wrapper, id).attributes('aria-selected')).toBe(String(id === selected))
    expect(tab(wrapper, id).attributes('tabindex')).toBe(id === selected ? '0' : '-1')
    expect(panel(wrapper, id).element.hidden).toBe(id !== selected)
    expect(panel(wrapper, id).isVisible()).toBe(id === selected)
  }
}
enableAutoUnmount(afterEach)
afterEach(() => document.documentElement.removeAttribute('data-bs-theme'))

describe('About page redesign', () => {
  it('keeps the community context, academic identity and home destination', () => {
    const wrapper = mountAbout()
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toContain('Made for community.')
    for (const text of [
      'car meets, shows, cruises, drift, drag and track days', 'Melbourne / Victoria (AU)',
      'Sepang & Sarawak (MY)', 'Swinburne University', 'COS30043',
      'Interface Design & Development', 'Semester 2, 2026', '4-person group capstone'
    ]) expect(wrapper.text()).toContain(text)
    expect(wrapper.get('[aria-current="page"]').text()).toBe('About ApexGrid')
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toBe('/')
    expect(wrapper.text()).not.toMatch(/sanctioned|Project Telemetry|PWA LIVE|WCAG 2\.1 AA Compliance/)
  })

  it('retains all four attributed team roles, technical contributions and key files', () => {
    const wrapper = mountAbout()
    const members = wrapper.findAll('.about-member')
    expect(members).toHaveLength(4)
    const expected = [
      ['Jacob Pillai', 'PWA & Social API Lead', 'Workbox', 'RSVP and likes', 'comment ratings', 'useOfflineEvents.js', 'earlier “F1 Telemetry HUD”'],
      ['Syed Rahman', 'Auth, DB & Pinia Lead', 'Seven-table MySQL', 'MariaDB 5.5', 'PHP 5.4+', 'HMAC-SHA256 JWT', 'authStore.js / jwt.php'],
      ['Naveed Khan', 'Map & Calendar Lead', 'Leaflet.js', 'OpenStreetMap', 'FullCalendar v6', 'Haversine', 'EventMap.vue / ExploreView.vue'],
      ['Gibson Tan', 'Analytics & Testing Lead', 'three Chart.js', 'vue-chartjs', 'Vitest', 'RSVP capacity', 'OrganizerDashboardView.vue']
    ]
    expected.forEach((texts, index) => {
      for (const text of texts) expect(members[index].text()).toContain(text)
    })
    expect(panel(wrapper, 'architecture').text()).toContain('Week 12 academic submission')
  })

  it('retains architecture details without deployment, data-sync or security guarantees', () => {
    const wrapper = mountAbout()
    const text = panel(wrapper, 'architecture').text()
    for (const value of [
      'Mercury Web Server', 'Apache, PHP 5.4 and MariaDB 5.5', 'createWebHashHistory()',
      'api/index.php?endpoint=/events', 'mod_rewrite', 'PDO PHP REST API',
      'src/services/api.js', 'localStorage', 'localDb.js', 'some remote failures also fall back',
      'not a synchronised copy', 'not a guarantee', 'environment-specific checks',
      'Guests can browse', 'authenticated members', 'member, organizer and admin',
      'UI visibility is not a security boundary', 'server authorization needs independent verification'
    ]) expect(text).toContain(value)
    expect(text).not.toMatch(/never 404|identical responses|prevent overcrowding/)
  })

  it('links the labelled tablist, tabs and persistent panels with one roving tab stop', () => {
    const wrapper = mountAbout()
    const list = wrapper.get('[role="tablist"]')
    expect(list.attributes('aria-label')).toBe('About the project')
    expect(list.attributes('aria-orientation')).toBe('horizontal')
    expect(list.findAll('[role="tab"]')).toHaveLength(3)
    expect(wrapper.findAll('[role="tabpanel"]')).toHaveLength(3)
    for (const id of ids) {
      expect(tab(wrapper, id).element.tagName).toBe('BUTTON')
      expect(tab(wrapper, id).attributes('type')).toBe('button')
      expect(tab(wrapper, id).attributes('aria-controls')).toBe(panel(wrapper, id).attributes('id'))
      expect(panel(wrapper, id).attributes('aria-labelledby')).toBe(tab(wrapper, id).attributes('id'))
      expect(panel(wrapper, id).attributes('tabindex')).toBe('0')
    }
    expectSelection(wrapper, 'architecture')
    expect(wrapper.find('main').exists()).toBe(false) // The app owns the main landmark.
  })

  it('switches every section by click and can return to architecture', async () => {
    const wrapper = mountAbout()
    for (const id of ['roadmap', 'a11y', 'architecture']) {
      await tab(wrapper, id).trigger('click')
      expectSelection(wrapper, id)
    }
  })

  it.each([
    ['architecture', 'ArrowRight', 'roadmap'],
    ['roadmap', 'ArrowRight', 'a11y'],
    ['a11y', 'ArrowRight', 'architecture'],
    ['architecture', 'ArrowLeft', 'a11y'],
    ['a11y', 'ArrowLeft', 'roadmap'],
    ['roadmap', 'ArrowLeft', 'architecture'],
    ['roadmap', 'Home', 'architecture'],
    ['architecture', 'End', 'a11y']
  ])('activates and focuses %s + %s → %s', async (from, key, to) => {
    const wrapper = mountAbout()
    await tab(wrapper, from).trigger('click')
    tab(wrapper, from).element.focus()
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    tab(wrapper, from).element.dispatchEvent(event)
    await wrapper.vm.$nextTick()
    expect(event.defaultPrevented).toBe(true)
    expectSelection(wrapper, to)
    expect(document.activeElement).toBe(tab(wrapper, to).element)
  })

  it.each([
    { key: 'Tab' }, { key: 'Tab', shiftKey: true }, { key: 'ArrowDown' },
    { key: 'ArrowUp' }, { key: 'Escape' }, { key: 'ArrowRight', ctrlKey: true },
    { key: 'ArrowRight', metaKey: true }, { key: 'Home', altKey: true },
    { key: 'End', shiftKey: true }
  ])('does not intercept unrelated or modified keyboard input: %j', async (options) => {
    const wrapper = mountAbout()
    const current = tab(wrapper, 'architecture')
    current.element.focus()
    const event = new KeyboardEvent('keydown', { ...options, bubbles: true, cancelable: true })
    current.element.dispatchEvent(event)
    await wrapper.vm.$nextTick()
    expect(event.defaultPrevented).toBe(false)
    expectSelection(wrapper, 'architecture')
    expect(document.activeElement).toBe(current.element)
  })

  it('keeps all roadmap concepts explicitly proposed with indicative dates and dependencies', async () => {
    const wrapper = mountAbout()
    await tab(wrapper, 'roadmap').trigger('click')
    const text = panel(wrapper, 'roadmap').text()
    expect(text).toContain('5–10 minute demonstration')
    expect(text).toContain('proposals, not available features')
    expect(text).toContain('indicative, not delivery commitments')
    expect(wrapper.findAll('.about-roadmap-entry')).toHaveLength(3)
    for (const value of [
      'Phase 2.1', 'Proposed / Q1 2027', 'workshop & dyno tuner locator',
      'CAMS / Motorsport Australia', 'roll-cage tagging', 'corner weighting', 'dyno sheet uploads',
      'Phase 2.2', 'Proposed / Q2 2027', 'Used track parts & JDM swap board',
      'Paddock pick-up points', 'PCD & fitment matching', 'future vehicle profile', 'tread-depth inspection photos',
      'Phase 2.3', 'Proposed / Q3 2027', 'Mylaps / Dorian', 'WebSockets',
      'Sandown and Sepang', 'personal best laps', 'provider access, venue permission'
    ]) expect(text).toContain(value)
    expect(text).not.toMatch(/verified performance garages|Verified PCD/)
  })

  it('retains accessibility engineering information with honest compliance and offline limits', async () => {
    const wrapper = mountAbout()
    await tab(wrapper, 'a11y').trigger('click')
    const text = panel(wrapper, 'a11y').text()
    expect(wrapper.findAll('.about-practices article')).toHaveLength(4)
    for (const value of [
      'WCAG 2.1 AA', 'not a conformance certification', 'assistive-technology and contrast checks',
      ':user-invalid', ':user-valid', 'aria-describedby', 'aria-errormessage', 'aria-invalid',
      'Each form still needs individual review', 'visible focus', 'Home and End',
      'no automatic animation', 'prefers-reduced-motion: reduce', 'opacity', 'transform',
      'JetBrains Mono', 'font-variant-numeric: tabular-nums', 'useOfflineEvents.js',
      'Vite PWA / Workbox', 'OpenStreetMap tiles and Google Fonts', 'prior loading',
      'service-worker readiness', 'browser storage', 'maps may be incomplete',
      'saved details may be out of date', 'live actions still need connectivity'
    ]) expect(text).toContain(value)
    expect(text).not.toMatch(/Zero-Dependency|zero cellular|all motion respects|Pause\/Play/)
  })

  it('compiles both palettes with safe ancestor theme scoping, responsive layouts and focus rules', () => {
    const { descriptor, errors: parseErrors } = parse(aboutSource)
    expect(parseErrors).toEqual([])
    expect(descriptor.styles).toHaveLength(1)
    expect(descriptor.styles[0].scoped).toBe(true)
    const { code, errors } = compileStyle({
      source: descriptor.styles[0].content, id: 'data-v-about', scoped: true
    })
    expect(errors).toEqual([])
    expect(code).toContain('.about-page[data-v-about]')
    expect(code).toContain("[data-bs-theme='light'] .about-page[data-v-about]")
    expect(code).not.toContain("[data-bs-theme='light'][data-v-about]")
    expect(descriptor.styles[0].content).not.toContain(':global')
    for (const value of ['#181a19', '#f3f0e9', '#ed7059', '#f4f1ea', '#242722', '#ae3d29']) {
      expect(code).toContain(value)
    }
    expect(code).toContain(':focus-visible')
    expect(code).toContain('outline: 3px solid var(--about-accent)')
    expect(code).toContain("[aria-selected='true']")
    expect(code).toContain('.about-panel[hidden][data-v-about]')
    expect(code).toContain('@media (max-width: 991.98px)')
    expect(code).toContain('@media (max-width: 575.98px)')
    expect(code).not.toMatch(/animation:|transition:|box-shadow: (?!none)/)
  })

  it('preserves the selected section when the ancestor theme changes', async () => {
    const wrapper = mountAbout()
    await tab(wrapper, 'roadmap').trigger('click')
    for (const theme of ['light', 'dark']) {
      document.documentElement.setAttribute('data-bs-theme', theme)
      expect(wrapper.element.closest('[data-bs-theme]').getAttribute('data-bs-theme')).toBe(theme)
      expectSelection(wrapper, 'roadmap')
    }
  })
})
