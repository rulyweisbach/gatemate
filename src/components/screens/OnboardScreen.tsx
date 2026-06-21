import React from 'react';
import { useAuth } from 'react-oidc-context';

// ── Inline SVG brand logos ────────────────────────────────────────────────────

const GoogleLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const InstagramLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433"/>
        <stop offset="25%" stopColor="#e6683c"/>
        <stop offset="50%" stopColor="#dc2743"/>
        <stop offset="75%" stopColor="#cc2366"/>
        <stop offset="100%" stopColor="#bc1888"/>
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ig-grad)"/>
    <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none"/>
    <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
  </svg>
);

const FacebookLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#1877F2"/>
    <path d="M16 8h-2a1 1 0 0 0-1 1v2h3l-.5 3H13v7h-3v-7H8v-3h2V9a4 4 0 0 1 4-4h2v3z" fill="white"/>
  </svg>
);

type SocialProvider = 'google' | 'instagram' | 'facebook';

const SOCIAL_BUTTONS: {
  id: SocialProvider;
  label: string;
  Logo: () => React.ReactElement;
  border: string;
  bg: string;
}[] = [
  {
    id: 'google',
    label: 'Continue with Google',
    Logo: GoogleLogo,
    bg: 'rgba(255,255,255,0.14)',
    border: 'rgba(255,255,255,0.3)',
  },
  {
    id: 'instagram',
    label: 'Continue with Instagram',
    Logo: InstagramLogo,
    bg: 'rgba(220,39,67,0.15)',
    border: 'rgba(220,39,67,0.35)',
  },
  {
    id: 'facebook',
    label: 'Continue with Facebook',
    Logo: FacebookLogo,
    bg: 'rgba(24,119,242,0.18)',
    border: 'rgba(24,119,242,0.45)',
  },
];

export default function OnboardScreen() {
  const auth = useAuth();

  const handleSocial = (provider: SocialProvider) => {
    if (provider === 'google') {
      // Real Cognito Hosted-UI login, jumping straight to Google.
      void auth.signinRedirect({ extraQueryParams: { identity_provider: 'Google' } });
      return;
    }
    // Facebook / Apple aren't configured as identity providers yet.
    alert(`${provider[0].toUpperCase() + provider.slice(1)} login is coming soon — Google works now!`);
  };

  return (
    <div
      className="flex flex-col px-5"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(2.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Logo + title */}
      <div className="anim-slide-up pt-4 pb-2">
        <div className="flex justify-center mb-3">
          <img
            src="/gatemate-logo.png"
            alt="GateMate logo"
            style={{ width: 90, height: 90, objectFit: 'contain' }}
          />
        </div>
        <h1
          className="text-5xl font-black text-center text-white leading-tight"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          Your next connection
          <br />
          is waiting at your{' '}
          <span style={{ color: '#7dd3fc' }}>Gate</span>
        </h1>
        <p
          className="text-center mt-3 text-sm font-medium leading-relaxed px-4"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          Connect with fellow travelers at your gate, lounge, or terminal on your terms.
        </p>
      </div>

      {/* Social login buttons */}
      <div
        className="flex flex-col gap-3 mt-8"
        style={{
          animation: 'slide-up 0.5s ease-out forwards',
          animationDelay: '0.15s',
          opacity: 0,
        }}
      >
        {SOCIAL_BUTTONS.map((btn, i) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => handleSocial(btn.id)}
            className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all"
            style={{
              background: btn.bg,
              border: `1.5px solid ${btn.border}`,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              animation: `slide-up 0.45s ease-out forwards`,
              animationDelay: `${0.15 + i * 0.08}s`,
              opacity: 0,
            }}
          >
            <span className="shrink-0 flex items-center justify-center" style={{ width: 36, height: 36 }}>
              <btn.Logo />
            </span>
            <span className="font-semibold text-white text-sm">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div
        className="flex items-center gap-3 mt-6"
        style={{
          animation: 'slide-up 0.45s ease-out forwards',
          animationDelay: '0.42s',
          opacity: 0,
        }}
      >
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.18)' }} />
        <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>or</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.18)' }} />
      </div>

      {/* Guest CTA */}
      <div
        className="mt-auto pt-6"
        style={{
          animation: 'slide-up 0.5s ease-out forwards',
          animationDelay: '0.5s',
          opacity: 0,
        }}
      >
        <button
          type="button"
          className="btn-solid w-full"
          onClick={() => void auth.signinRedirect()}
        >
          Get Started
        </button>
        <p
          className="text-center text-xs mt-3"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          By continuing you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
