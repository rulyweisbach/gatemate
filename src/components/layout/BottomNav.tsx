import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { Luggage, Compass, MessageCircle, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApi } from '../../api/client';
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
// the full-screen creation flows (/trips/new, /trips/:id/groups/new).
export function isNavRoute(pathname: string): boolean {
  if (pathname === '/trips/new' || pathname.endsWith('/groups/new')) return false;
  return TABS.some((t) => t.match(pathname));
}

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const auth = useAuth();
  const api = useApi();
  const myProfile = useAppStore((s) => s.myProfile);

  // Unread counters: refreshed on every route change and every 30s, so the
  // badge clears shortly after a chat/hub marks itself read.
  const [badges, setBadges] = useState({ chats: 0, discover: 0 });
  useEffect(() => {
    let alive = true;
    const load = () =>
      api.getBadges().then((b) => { if (alive) setBadges(b); }).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const badgeFor = (to: string) =>
    to === '/chats' ? badges.chats : to === '/discover' ? badges.discover : 0;

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
                <span className="relative" style={{ display: 'inline-flex' }}>
                  <Icon size={22} style={{ color }} />
                  {badgeFor(t.to) > 0 && (
                    <span
                      className="absolute flex items-center justify-center font-bold"
                      style={{
                        top: -5,
                        right: -9,
                        minWidth: 16,
                        height: 16,
                        padding: '0 4px',
                        borderRadius: 999,
                        background: '#ff4d67',
                        color: '#fff',
                        fontSize: 9.5,
                        border: '1.5px solid #0b1a3b',
                        lineHeight: 1,
                      }}
                    >
                      {badgeFor(t.to) > 9 ? '9+' : badgeFor(t.to)}
                    </span>
                  )}
                </span>
              )}
              <span style={{ fontSize: 10, fontWeight: 600, color }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
