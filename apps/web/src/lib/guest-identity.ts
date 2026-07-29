// A username a guest "claims" (e.g. from the leaderboard "you made the board"
// moment), kept in localStorage so the signup form can prefill it later — the
// guest gets to lock in their name before committing to an account.

const KEY = 'fw-guest-username'

export function getClaimedUsername(): string {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function setClaimedUsername(name: string): void {
  try {
    localStorage.setItem(KEY, name.trim())
  } catch {
    /* storage disabled — the name just isn't remembered */
  }
}

export function clearClaimedUsername(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
