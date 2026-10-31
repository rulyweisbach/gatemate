import { Plane, Ticket, MapPin } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { GroupContext } from '../../types';

// One line saying which trip context a group belongs to, e.g.
// "Las Vegas · Dec 1 → Dec 5", "LY 315 · Sep 15" or the event name.

function fmtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function groupContextText(ctx?: GroupContext | null): string {
  if (!ctx) return '';
  if (ctx.type === 'flight') {
    return [ctx.flightNumber, fmtDate(ctx.flightDate)].filter(Boolean).join(' · ');
  }
  if (ctx.type === 'event') return ctx.label ?? '';
  const from = fmtDate(ctx.from);
  const to = fmtDate(ctx.to);
  const dates = from ? (to && to !== from ? `${from} → ${to}` : from) : '';
  return [ctx.destination || ctx.label, dates].filter(Boolean).join(' · ');
}

const ICONS = { flight: Plane, event: Ticket, destination: MapPin } as const;

export default function GroupContextLine({
  ctx,
  size = 11,
  className = '',
  style,
}: {
  ctx?: GroupContext | null;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const text = groupContextText(ctx);
  if (!ctx || !text) return null;
  const Icon = ICONS[ctx.type] ?? MapPin;
  return (
    <span className={`flex items-center gap-1 min-w-0 ${className}`} style={style}>
      <Icon size={size} className="shrink-0" />
      <span className="truncate">{text}</span>
    </span>
  );
}
