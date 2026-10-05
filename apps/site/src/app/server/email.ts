import process from 'node:process'

/**
 * Transactional email via Resend's HTTP API.
 *
 * Raw `fetch` rather than the `resend` SDK, for the same reason server/llm.ts
 * talks to Anthropic and OpenAI directly: one POST does not earn a dependency.
 *
 * Resend is keyed directly (RESEND_API_KEY from resend.com) rather than through
 * the Vercel Marketplace integration, which has no free tier — see the Setup
 * TODO in CLAUDE.md.
 */

const ENDPOINT = 'https://api.resend.com/emails'

// A dedicated sending subdomain, so deliverability trouble can never touch the
// reputation of the apex that serves the site.
const DEFAULT_FROM = 'Fullstack Wolfpack <noreply@mail.fullstackwolfpack.com>'

export type Email = {
  to: string
  subject: string
  html: string
  text: string
}

export function emailIsConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export async function sendEmail({ to, subject, html, text }: Email): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    // Loud rather than silent: a swallowed failure here means a user who asked
    // for a reset waits forever for mail that was never going to arrive.
    throw new Error(
      'RESEND_API_KEY is not set, so transactional email cannot be sent. ' +
        'Create a key at resend.com and verify mail.fullstackwolfpack.com.',
    )
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? DEFAULT_FROM,
      to,
      subject,
      html,
      text,
    }),
  })

  if (!res.ok) {
    throw new Error(
      `Resend rejected the send (${res.status}): ${await res.text()}`,
    )
  }
}
