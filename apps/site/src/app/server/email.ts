import process from 'node:process'
import { createTransport, type SendMailOptions } from 'nodemailer'

/**
 * Transactional email over SMTP.
 *
 * Provider-neutral on purpose: the sender is whatever `SMTP_*` points at, which
 * today is Forward Email (Enhanced Protection, outbound SMTP for
 * mail.fullstackwolfpack.com). It replaced a single POST to Resend's HTTP API
 * on 2026-10-07: Resend's free tier verifies three domains, and frunk, tova and
 * diamondheart hold them. SMTP earns the one dependency the HTTP call did not.
 */

// A dedicated sending subdomain, so deliverability trouble can never touch the
// reputation of the apex that serves the site.
const DEFAULT_FROM = 'Fullstack Wolfpack <noreply@mail.fullstackwolfpack.com>'

export type Email = {
  to: string
  subject: string
  html: string
  text: string
}

/** The one method this module needs, so a test can hand in a fake. */
export type MailTransport = {
  sendMail(mail: SendMailOptions): Promise<unknown>
}

type SmtpConfig = { host: string; port: number; user: string; pass: string }

function smtpConfig(): SmtpConfig {
  const { SMTP_HOST: host, SMTP_PORT: port, SMTP_USER: user, SMTP_PASS: pass } = process.env
  if (!host || !port || !user || !pass) {
    // Loud rather than silent: a swallowed failure here means a user who asked
    // for a reset waits forever for mail that was never going to arrive.
    throw new Error(
      'SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS must all be set for transactional email. ' +
        'Copy them from the sending provider for mail.fullstackwolfpack.com.',
    )
  }
  const portNumber = Number(port)
  if (!Number.isInteger(portNumber) || portNumber <= 0) {
    throw new Error(`SMTP_PORT must be a positive integer, got "${port}"`)
  }
  return { host, port: portNumber, user, pass }
}

function defaultTransport(): MailTransport {
  const { host, port, user, pass } = smtpConfig()
  // 465 is implicit TLS; anything else negotiates STARTTLS.
  return createTransport({ host, port, secure: port === 465, auth: { user, pass } })
}

export async function sendEmail(
  { to, subject, html, text }: Email,
  transport: MailTransport = defaultTransport(),
): Promise<void> {
  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? DEFAULT_FROM,
      to,
      subject,
      html,
      text,
    })
  } catch (err) {
    throw new Error(
      `The SMTP sender rejected the send: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
}
