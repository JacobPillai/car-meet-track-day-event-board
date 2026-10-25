/**
 * ApexGrid — Email notifications through EmailJS (browser, REST API, no extra package).
 *
 * Needs three PUBLIC values in .env.local (see .env.example). The EmailJS PRIVATE key
 * is never used here and must never be put in any VITE_ variable: everything starting
 * with VITE_ is copied into the public bundle.
 *
 * With the values missing, every function quietly does nothing, so the app and the tests
 * run fine without EmailJS.
 */

const ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send'

function emailConfig() {
  const env = import.meta.env || {}
  return {
    serviceId: env.VITE_EMAILJS_SERVICE_ID,
    templateId: env.VITE_EMAILJS_TEMPLATE_ID,
    publicKey: env.VITE_EMAILJS_PUBLIC_KEY
  }
}

export function isEmailConfigured() {
  const { serviceId, templateId, publicKey } = emailConfig()
  return Boolean(serviceId && templateId && publicKey)
}

/**
 * Send one email through the shared EmailJS template.
 * Template variables: to_email, to_name, subject, message.
 * Never throws: a failed email must not break sign-up or RSVP.
 */
export async function sendEmail({ toEmail, toName, subject, message }) {
  if (!isEmailConfigured() || !toEmail) return false
  const { serviceId, templateId, publicKey } = emailConfig()
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: toEmail,
          to_name: toName || 'ApexGrid driver',
          subject,
          message
        }
      })
    })
    return res.ok
  } catch {
    return false
  }
}

export function sendWelcomeEmail(user) {
  return sendEmail({
    toEmail: user.email,
    toName: user.name,
    subject: 'Welcome to ApexGrid',
    message: `Hi ${user.name}, your ApexGrid account is ready. Browse car meets and track days, RSVP, and save events for offline.`
  })
}

export function sendRsvpEmail(user, event, status) {
  const verb = status === 'going' ? 'You are going to' : 'You are interested in'
  return sendEmail({
    toEmail: user.email,
    toName: user.name,
    subject: `${verb} ${event.title}`,
    message: `${verb} ${event.title} on ${event.start_datetime} at ${event.venue}.`
  })
}
