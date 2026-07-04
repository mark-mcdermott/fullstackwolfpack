// Maps a passkey/WebAuthn failure to a friendly message. Shared by the
// sign-in and sign-up forms.
export function authErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === 'NotAllowedError') {
      return 'Passkey prompt was dismissed. Please try again.'
    }
    return err.message
  }
  return 'Something went wrong.'
}
