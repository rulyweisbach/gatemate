import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../api/client';
import { content } from '../../content';
import type { Trip } from '../../types';

// Discover has no screen of its own — it jumps to the People feed of the trip
// hub the user last opened, falling back to the most relevant trip (active →
// soonest upcoming → most recent). With no trips, it sends them to create one.
function pickTrip(trips: Trip[]): Trip | null {
  if (trips.length === 0) return null;
  try {
    const lastId = localStorage.getItem('gm_lastTripId');
    const last = trips.find((t) => t.tripId === lastId);
    if (last) return last;
  } catch { /* ignore */ }
  const active = trips.find((t) => (t.status ?? 'active') === 'active');
  if (active) return active;
  const upcoming = trips
    .filter((t) => t.status === 'upcoming')
    .sort((a, b) => (a.travelDate ?? '').localeCompare(b.travelDate ?? ''));
  if (upcoming.length) return upcoming[0];
  return trips[0];
}

export default function DiscoverScreen() {
  const navigate = useNavigate();
  const api = useApi();

  useEffect(() => {
    api.listTrips()
      .then((r) => {
        const trip = pickTrip(r.trips ?? []);
        navigate(trip ? `/trips/${trip.tripId}` : '/trips/new', { replace: true });
      })
      .catch(() => navigate('/trips', { replace: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-3" style={{ minHeight: '100dvh' }}>
      <div className="text-4xl anim-float-plane">✈️</div>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{content.common.loading}</p>
    </div>
  );
}
