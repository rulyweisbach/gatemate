import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useApi } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import SkyBackground from './SkyBackground';
import BottomNav, { isNavRoute } from './BottomNav';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const auth = useAuth();
  const api = useApi();
  const { pathname } = useLocation();
  const myProfile = useAppStore((s) => s.myProfile);
  const setMyProfile = useAppStore((s) => s.setMyProfile);

  // Load the signed-in user's own profile once, so their avatar can appear
  // across the app (headers, bottom nav, etc.).
  useEffect(() => {
    if (auth.isAuthenticated && !myProfile) {
      api.getMe().then((r) => setMyProfile(r.profile)).catch(() => {});
    }
  }, [auth.isAuthenticated, myProfile, api, setMyProfile]);

  const showNav = auth.isAuthenticated && isNavRoute(pathname);

  return (
    <>
      <SkyBackground />
      <div
        className="relative mx-auto flex flex-col min-h-screen"
        style={{ maxWidth: 430 }}
      >
        {children}
      </div>
      {showNav && <BottomNav />}
    </>
  );
}
