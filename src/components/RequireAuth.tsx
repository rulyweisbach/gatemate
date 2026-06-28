import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

// Gates the app's authenticated screens. While the OIDC library resolves the
// session (including the post-login code exchange) we show a light loader;
// unauthenticated users are remembered and sent to onboarding, then returned
// to where they were headed after they sign in.
export default function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh' }}>
        <div className="text-5xl anim-float-plane">✈️</div>
        <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Signing you in…
        </p>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    try {
      localStorage.setItem('gm_returnTo', location.pathname + location.search);
    } catch { /* ignore */ }
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}
