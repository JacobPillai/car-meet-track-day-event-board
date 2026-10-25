import { describe, it, expect, vi, afterEach } from 'vitest'
import { sendEmail, isEmailConfigured, sendWelcomeEmail } from '../../src/services/emailService'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('emailService', () => {
  it('does nothing when EmailJS is not configured', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(isEmailConfigured()).toBe(false)
    await expect(sendEmail({ toEmail: 'a@b.co', subject: 's', message: 'm' })).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts the template params to EmailJS when configured', async () => {
    vi.stubEnv('VITE_EMAILJS_SERVICE_ID', 'service_x')
    vi.stubEnv('VITE_EMAILJS_TEMPLATE_ID', 'template_x')
    vi.stubEnv('VITE_EMAILJS_PUBLIC_KEY', 'pub_x')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    await expect(sendWelcomeEmail({ name: 'Alex', email: 'alex@example.com' })).resolves.toBe(true)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toMatchObject({ service_id: 'service_x', template_id: 'template_x', user_id: 'pub_x' })
    expect(body.template_params).toMatchObject({ to_email: 'alex@example.com', to_name: 'Alex' })
  })

  it('never throws when the network fails', async () => {
    vi.stubEnv('VITE_EMAILJS_SERVICE_ID', 's')
    vi.stubEnv('VITE_EMAILJS_TEMPLATE_ID', 't')
    vi.stubEnv('VITE_EMAILJS_PUBLIC_KEY', 'p')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    await expect(sendEmail({ toEmail: 'a@b.co', subject: 's', message: 'm' })).resolves.toBe(false)
  })
})
