import { createContext, useContext } from 'react'

export type AuthUser = {
  id: string
  email: string
  displayName: string
  totpEnabled: boolean
}

export type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  register: (email: string, displayName: string) => Promise<void>
  login: (email: string) => Promise<void>
  recover: (email: string, token: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
