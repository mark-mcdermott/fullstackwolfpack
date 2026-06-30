import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser'

// The two platform seams. A surface provides these; the API is built on top.

// Transport: how a surface reaches the backend. Web injects the session cookie
// (credentials: 'include'); native/extension can inject an auth header from
// secure storage instead.
export interface HttpClient {
  request<T>(path: string, init?: RequestInit): Promise<T>
}

// Passkey ceremonies: web wraps @simplewebauthn/browser; native wraps the
// platform credential API (iOS Credential Manager, Android, etc.).
export interface PasskeyClient {
  create(
    optionsJSON: PublicKeyCredentialCreationOptionsJSON,
  ): Promise<RegistrationResponseJSON>
  get(
    optionsJSON: PublicKeyCredentialRequestOptionsJSON,
  ): Promise<AuthenticationResponseJSON>
}

export interface Adapters {
  http: HttpClient
  passkeys: PasskeyClient
}
