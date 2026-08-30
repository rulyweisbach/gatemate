import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { Luggage, Compass, MessageCircle, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { content } from '../../content';

// The four core tabs.
const TABS: { to: string; label: string; icon: LucideIcon; match: (p: string) => boolean }[] = [
  { to: '/trips',    label: content.trips.title,       icon: Luggage,       match: (p) => p === '/trips' || p.startsWith('/trips/') },
  { to: '/discover', label: content.nav.discover,      icon: Compass,       match: (p) => p === '/discover' },
  { to: '/chats',    label: content.connections.title, icon: MessageCircle, match: (p) => p === '/chats' },
  { to: '/me',       label: content.nav.profile,       icon: User,          match: (p) => p === '/me' },
];

// The bar shows on the four tab routes plus the trip hub (/trips/:id), but not
// the full-screen trip-creation flow (/trips/new).
export function isNavRoute(pathname: string): boolean {
  if (pathname === '/trips/new') return false;
  return TABS.some((t) => t.match(pathname));
}

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const auth = useAuth();
  const myProfile = useAppStore((s) => s.myProfile);

  const photo =
    myProfile?.photos?.[0] ||
    myProfile?.photo ||
    ((auth.user?.profile?.picture as string) ?? '') ||
    '';
  const photoIsUrl = /^https?:\/\//.test(photo);

  return (
    <nav
      className="fixed left-0 right-0 bottom-0 mx-auto glass-dark"
      style={{
        maxWidth: 430,
        borderTop: '1px solid rgba(255,255,255,0.12)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 40,
      }}
    >
      <div className="flex items-stretch justify-around px-1 pt-1.5 pb-1">
        {TABS.map((t) => {
          const active = t.match(pathname);
          const color = active ? '#7dd3fc' : 'rgba(255,255,255,0.55)';
          const Icon = t.icon;
          return (
            <button
              key={t.to}
              onClick={() => navigate(t.to)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
              aria-label={t.label}
              aria-current={active ? 'page' : undefined}
            >
              {t.to === '/me' ? (
                <span
                  className="flex items-center justify-center rounded-full overflow-hidden"
                  style={{ width: 24, height: 24, border: active ? '2px solid #7dd3fc' : '2px solid transparent' }}
                >
                  {photoIsUrl ? (
                    <img src={photo} referrerPolicy="no-referrer" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : photo ? (
                    <span style={{ fontSize: 15 }}>{photo}</span>
                  ) : (
                    <User size={20} style={{ color }} />
                  )}
                </span>
              ) : (
                <Icon size={22} style={{ color }} />
              )}
              <span style={{ fontSize: 10, fontWeight: 600, color }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
