import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { content } from '../../content';

export default function SplashScreen() {
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    // While returning from Google, the auth lib exchanges the code — wait for it.
    if (auth.isLoading) return;
    // Logged in → into the app (returning to a deep-linked page if one was
    // saved, e.g. /admin); otherwise → onboarding.
    const authed = auth.isAuthenticated;
    const t = setTimeout(() => {
      if (!authed) {
        navigate('/welcome');
        return;
      }
      let dest = '/trips';
      try {
        const rt = localStorage.getItem('gm_returnTo');
        if (rt) {
          localStorage.removeItem('gm_returnTo');
          dest = rt;
        }
      } catch { /* ignore */ }
      navigate(dest);
    }, authed ? 400 : 2500);
    return () => clearTimeout(t);
  }, [auth.isLoading, auth.isAuthenticated, navigate]);

  return (
    <div
      className="flex flex-col items-center justify-center gap-6 px-6 anim-fade-in"
      style={{ minHeight: '100dvh', paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
    >
      <img
        src="/gatemate-logo.png"
        alt="GateMate logo"
        className="anim-float-plane select-none"
        style={{ width: 160, height: 160, objectFit: 'contain' }}
      />

      <div className="text-center">
        <h1
          className="text-5xl font-black tracking-tight mb-2"
          style={{ fontFamily: 'Nunito, sans-serif', lineHeight: 1.1 }}
        >
          <span className="text-white">{content.splash.brandFirst}</span>
          <span style={{ color: '#7dd3fc' }}>{content.splash.brandSecond}</span>
        </h1>
        <p
          className="text-base font-medium"
          style={{ color: 'rgba(255,255,255,0.65)', letterSpacing: '0.02em' }}
        >
          {content.splash.tagline}
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        {[0, 0.3, 0.6].map((d, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-white"
            style={{
              animation: `twinkle 1.2s ease-in-out infinite`,
              animationDelay: `${d}s`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    </div>
  );
}
