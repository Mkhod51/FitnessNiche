import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { setupPwa } from './pwa.ts'
import { applyStoredTheme } from './theme.ts'

// Before the first paint, so a manual light/dark choice does not flash the
// other ground on every launch.
applyStoredTheme()

setupPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
