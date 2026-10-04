// The platform seam. A surface provides this; the API is built on top.
//
// There used to be a second seam here, PasskeyClient, because a WebAuthn
// ceremony has to run against a platform credential API that differs per
// surface. Email and password is just HTTP, so one seam is enough.

// Transport: how a surface reaches the backend. Web injects the session cookie
// (credentials: 'include'); native/extension can inject an auth header from
// secure storage instead.
export interface HttpClient {
  request<T>(path: string, init?: RequestInit): Promise<T>
}

export interface Adapters {
  http: HttpClient
}
