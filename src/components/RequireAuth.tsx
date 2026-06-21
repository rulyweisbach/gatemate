import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

// Gates the app's authenticated screens. While the OIDC library resolves the
// session (including the post-login code exchange) we show a light loader;
// unauthenticated users are sent back to onboarding.
export default function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();

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
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}
