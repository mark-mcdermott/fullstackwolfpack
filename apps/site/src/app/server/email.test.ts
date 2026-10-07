// @vitest-environment node
import type { SendMailOptions } from 'nodemailer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendEmail, type MailTransport } from './email'

const email = { to: 'a@example.test', subject: 'Hi', html: '<p>hi</p>', text: 'hi' }

type SendMail = (mail: SendMailOptions) => Promise<unknown>

function fakeTransport(impl: SendMail = async () => ({})) {
  const sendMail = vi.fn<SendMail>(impl)
  const transport: MailTransport = { sendMail }
  return { transport, sendMail }
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('sendEmail', () => {
  it('hands the message to the transport with the default sender', async () => {
    const { transport, sendMail } = fakeTransport()
    await sendEmail(email, transport)
    expect(sendMail).toHaveBeenCalledOnce()
    const mail = sendMail.mock.calls[0]?.[0]
    expect(mail?.from).toBe('Fullstack Wolfpack <noreply@mail.fullstackwolfpack.com>')
    expect(mail?.to).toBe('a@example.test')
    expect(mail?.subject).toBe('Hi')
    expect(mail?.text).toBe('hi')
  })

  it('lets EMAIL_FROM override the sender', async () => {
    vi.stubEnv('EMAIL_FROM', 'Pack <hello@example.test>')
    const { transport, sendMail } = fakeTransport()
    await sendEmail(email, transport)
    expect(sendMail.mock.calls[0]?.[0]?.from).toBe('Pack <hello@example.test>')
  })

  it('throws loudly when SMTP is not configured, before touching any transport', async () => {
    for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']) vi.stubEnv(key, '')
    await expect(sendEmail(email)).rejects.toThrow(/SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS/)
  })

  it('rejects a non-numeric port before connecting', async () => {
    vi.stubEnv('SMTP_HOST', 'smtp.example.test')
    vi.stubEnv('SMTP_PORT', 'four-six-five')
    vi.stubEnv('SMTP_USER', 'u')
    vi.stubEnv('SMTP_PASS', 'p')
    await expect(sendEmail(email)).rejects.toThrow(/SMTP_PORT must be a positive integer/)
  })

  it('reports a rejected send with the provider reason', async () => {
    const { transport } = fakeTransport(async () => {
      throw new Error('550 no such user')
    })
    await expect(sendEmail(email, transport)).rejects.toThrow(/rejected the send: 550 no such user/)
  })
})
