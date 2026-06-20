import type { ReactNode } from 'react';
import SkyBackground from './SkyBackground';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <>
      <SkyBackground />
      <div
        className="relative mx-auto flex flex-col min-h-screen"
        style={{ maxWidth: 430 }}
      >
        {children}
      </div>
    </>
  );
}
