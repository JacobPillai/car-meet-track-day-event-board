import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api } from '../../src/services/api'

describe('api client in PHP mode', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USE_PHP_API', 'true')
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('returns the server JSON on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ data: [1] })
    }))
    await expect(api.get('/events')).resolves.toEqual({ data: [1] })
  })

  it('shows an error instead of falling back to localStorage when the server is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')))
    await expect(api.post('/auth/login', { email: 'a@b.co', password: 'x' })).rejects.toMatchObject({ status: 503 })
  })

  it('rejects a non-JSON reply (PHP not running)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'text/html' },
      json: async () => ({})
    }))
    await expect(api.get('/events')).rejects.toMatchObject({ status: 502 })
  })

  it('passes API error codes through', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'Too many failed sign-ins.' })
    }))
    await expect(api.post('/auth/login', {})).rejects.toMatchObject({ status: 429, message: 'Too many failed sign-ins.' })
  })
})
