// Transactional email bodies. Inline styles and a table-free single column,
// because that is the subset mail clients agree on. Every mail ships a text
// part too: some clients prefer it, and spam filters expect it.

type Body = { subject: string; html: string; text: string }

const WRAP = (heading: string, body: string, cta: string, url: string) => `
<div style="margin:0;padding:24px;background:#f6f6f4;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e5e5e1;border-radius:12px;padding:32px">
    <p style="margin:0 0 20px;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#6b6b63">Fullstack Wolfpack</p>
    <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#18181b">${heading}</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#44444a">${body}</p>
    <a href="${url}" style="display:inline-block;padding:11px 20px;background:#18181b;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px">${cta}</a>
    <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8a8a82">If the button does not work, paste this into your browser:<br><span style="color:#44444a;word-break:break-all">${url}</span></p>
  </div>
</div>`

export function resetPasswordEmail(url: string): Body {
  return {
    subject: 'Reset your Fullstack Wolfpack password',
    html: WRAP(
      'Reset your password',
      'Click below to choose a new password. The link expires in an hour. If you did not ask for this, you can ignore this email — nothing has changed.',
      'Choose a new password',
      url,
    ),
    text: `Reset your Fullstack Wolfpack password\n\nOpen this link to choose a new one (it expires in an hour):\n${url}\n\nIf you did not ask for this, ignore this email — nothing has changed.`,
  }
}

export function verifyEmail(url: string): Body {
  return {
    subject: 'Confirm your email address',
    html: WRAP(
      'Confirm your email',
      'Click below to confirm this address belongs to you. You can keep using your account either way — this just lets us reach you about it.',
      'Confirm email',
      url,
    ),
    text: `Confirm your Fullstack Wolfpack email address\n\nOpen this link to confirm it belongs to you:\n${url}\n\nYou can keep using your account either way.`,
  }
}
