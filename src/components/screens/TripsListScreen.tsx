import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, MapPin, Calendar, Ticket, ChevronRight, Plus } from 'lucide-react';
import { useApi } from '../../api/client';
import { content } from '../../content';
import type { Trip, TripStatus } from '../../types';
import GlassCard from '../layout/GlassCard';

const c = content.trips;

const STATUS_LABEL: Record<TripStatus, string> = {
  active: c.active,
  upcoming: c.upcoming,
  past: c.past,
};

const STATUS_COLOR: Record<TripStatus, string> = {
  active: '#7dd3fc',
  upcoming: 'rgba(255,255,255,0.7)',
  past: 'rgba(255,255,255,0.4)',
};

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function TripCard({ trip, delay, onClick }: { trip: Trip; delay: number; onClick: () => void }) {
  const dateBits = [formatDate(trip.travelDate), trip.returnDate ? `→ ${formatDate(trip.returnDate)}` : '']
    .filter(Boolean)
    .join(' ');
  return (
    <GlassCard
      onClick={onClick}
      className="p-4 flex items-center gap-3"
      style={{ borderRadius: 18, animation: 'slide-up 0.4s ease-out forwards', animationDelay: `${delay}s`, opacity: 0 }}
    >
      <div
        className="flex items-center justify-center rounded-2xl shrink-0"
        style={{ width: 48, height: 48, background: 'rgba(125,211,252,0.15)', border: '1px solid rgba(125,211,252,0.25)' }}
      >
        {trip.event ? <Ticket size={22} style={{ color: '#7dd3fc' }} /> : trip.flightNumber ? <Plane size={22} style={{ color: '#7dd3fc' }} /> : <MapPin size={22} style={{ color: '#7dd3fc' }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm truncate">{trip.label}</p>
        <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {dateBits && (
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {dateBits}
            </span>
          )}
          {trip.flightNumber && <span>{trip.flightNumber}</span>}
        </div>
      </div>
      <ChevronRight size={18} style={{ color: 'rgba(255,255,255,0.35)' }} />
    </GlassCard>
  );
}

export default function TripsListScreen() {
  const navigate = useNavigate();
  const api = useApi();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listTrips()
      .then((r) => setTrips(r.trips ?? []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups: { status: TripStatus; items: Trip[] }[] = (['active', 'upcoming', 'past'] as TripStatus[])
    .map((status) => ({ status, items: trips.filter((t) => (t.status ?? 'active') === status) }))
    .filter((g) => g.items.length > 0);

  let idx = 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div
        className="glass-dark sticky top-0 z-10 flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div>
          <p className="font-bold text-white text-base" style={{ fontFamily: 'Nunito, sans-serif' }}>{c.title}</p>
        </div>
        <button
          onClick={() => navigate('/trips/new')}
          className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full shrink-0"
          style={{ background: '#7dd3fc', color: '#0b1a3b' }}
        >
          <Plus size={14} /> {c.addTrip}
        </button>
      </div>

      <div className="flex flex-col gap-5 px-4 py-4" style={{ paddingBottom: 'calc(84px + env(safe-area-inset-bottom))' }}>
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-4xl anim-float-plane">✈️</div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{content.common.loading}</p>
          </div>
        )}

        {!loading && trips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="text-5xl">🧳</div>
            <p className="font-bold text-white">{c.emptyTitle}</p>
            <p className="text-sm px-6" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.emptyBody}</p>
            <button onClick={() => navigate('/trips/new')} className="btn-solid mt-2" style={{ width: 'auto', padding: '12px 28px' }}>
              {c.emptyCta}
            </button>
          </div>
        )}

        {!loading && groups.map((g) => (
          <div key={g.status} className="flex flex-col gap-2.5">
            <p className="text-xs font-bold uppercase tracking-wide px-1" style={{ color: STATUS_COLOR[g.status] }}>
              {STATUS_LABEL[g.status]}
            </p>
            {g.items.map((t) => {
              const delay = (idx++) * 0.05;
              return <TripCard key={t.tripId} trip={t} delay={delay} onClick={() => navigate(`/trips/${t.tripId}`)} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
