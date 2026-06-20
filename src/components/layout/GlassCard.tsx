import type { ReactNode, CSSProperties } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  dark?: boolean;
  onClick?: () => void;
}

export default function GlassCard({ children, className = '', style, dark, onClick }: GlassCardProps) {
  const base = dark ? 'glass-dark' : 'glass';
  return (
    <div
      className={`${base} rounded-2xl ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
