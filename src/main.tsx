import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import './index.css'
import App from './App.tsx'
import { oidcConfig } from './auth/authConfig'
import { loadContentOverrides } from './content'

// Pull admin-edited texts/options before first paint (fails soft to the
// bundled defaults after a short timeout).
loadContentOverrides().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthProvider {...oidcConfig}>
        <App />
      </AuthProvider>
    </StrictMode>,
  )
})
