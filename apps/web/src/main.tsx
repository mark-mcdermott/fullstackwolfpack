import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter } from 'react-router'
import { AuthProvider } from '@/hooks/auth-provider'
import { DevModeSwitcher } from '@/components/dev-mode/dev-mode-switcher'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        {/* Dev-only role switcher; tree-shaken out of production builds. */}
        {import.meta.env.DEV && <DevModeSwitcher />}
      </AuthProvider>
    </BrowserRouter>
    <Analytics />
  </StrictMode>,
)
