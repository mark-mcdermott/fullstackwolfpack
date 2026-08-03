import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter } from 'react-router'
import { AuthProvider } from '@/hooks/auth-provider'
import { TimerProvider } from '@/hooks/timer-provider'
import { DevModeSwitcher } from '@/components/dev-mode/dev-mode-switcher'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TimerProvider>
          <App />
        </TimerProvider>
        {/* Dev Mode role switcher. Shows in local dev, or in a build where
            VITE_ENABLE_DEV_MODE=1 (opt-in). Tree-shaken out otherwise. */}
        {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_MODE === '1') && (
          <DevModeSwitcher />
        )}
      </AuthProvider>
    </BrowserRouter>
    <Analytics />
  </StrictMode>,
)
