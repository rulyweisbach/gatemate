import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plane, DoorOpen, Clock, MapPin, Ticket, Calendar } from 'lucide-react';
import { useApi } from '../../api/client';
import { content, fmt } from '../../content';
import type { Profile, ProfileTrip } from '../../types';

const c = content.profile;
import GlassCard from '../layout/GlassCard';
import VerifiedBadge from '../ui/VerifiedBadge';
import GlassButton from '../ui/GlassButton';
import IntentChip from '../ui/IntentChip';
import Avatar from '../ui/Avatar';

export default function ProfileScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const api = useApi();
  // Opened from this person's chat — Say Hi should just return to it.
  const fromChat = (location.state as { fromChat?: boolean } | null)?.fromChat === true;

  const [user, setUser] = useState<Profile | null>(null);
  const [trips, setTrips] = useState<ProfileTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    api
      .getUser(id)
      .then((res) => {
        if (cancelled) return;
        setUser(res.profile);
        setTrips(res.trips ?? []);
      })
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3" style={{ minHeight: '100dvh' }}>
        <div className="text-4xl anim-float-plane">✈️</div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.loading}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-white text-lg font-bold">{c.notFound}</p>
        <button className="btn-glass" onClick={() => navigate(-1)}>{content.common.back}</button>
      </div>
    );
  }

  const fmtDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const route =
    user.origin && user.destination ? `${user.origin} → ${user.destination}` : '—';
  const infoCards = [
    { icon: Plane, label: c.flight, value: user.flight || '—' },
    { icon: DoorOpen, label: c.gate, value: user.gate || '—' },
    { icon: Clock, label: c.departs, value: user.departure || '—' },
    { icon: MapPin, label: c.route, value: route },
  ];
  const primaryIntent = user.intents?.[0];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center rounded-full shrink-0"
          style={{
            width: 36,
            height: 36,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <span className="font-bold text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>{c.header}</span>
      </div>

      <div className="px-5 pb-10 flex flex-col gap-5">
        {/* Photos or avatar */}
        <div className="flex flex-col items-center gap-3 pt-4 anim-slide-up">
          {user.photos && user.photos.length > 0 ? (
            <div
              className="flex gap-3 overflow-x-auto w-full pb-1"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {user.photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{
                    width: user.photos!.length === 1 ? '100%' : '78%',
                    aspectRatio: '3 / 4',
                    objectFit: 'cover',
                    borderRadius: 22,
                    border: '1px solid rgba(255,255,255,0.2)',
                    flexShrink: 0,
                    scrollSnapAlign: 'center',
                  }}
                />
              ))}
            </div>
          ) : (
            <Avatar photo={user.photo} size={100} radius={28} />
          )}
          <div className="text-center">
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {user.name}
            </h2>
            {!!user.age && (
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{fmt(c.yearsOld, { age: user.age! })}</p>
            )}
            {user.verified && (
              <div className="flex justify-center mt-2"><VerifiedBadge /></div>
            )}
            {user.tagline && (
              <p className="text-sm mt-3 font-medium px-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {user.tagline}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <GlassCard className="p-4" style={{ borderRadius: 18, animation: 'slide-up 0.45s ease-out forwards', animationDelay: '0.1s', opacity: 0 }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.about}</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>{user.bio}</p>
          </GlassCard>
        )}

        {/* Trips (people can have several) — falls back to the legacy
            single-flight info grid for profiles with no trips yet. */}
        {trips.length > 0 ? (
          <div style={{ animation: 'slide-up 0.45s ease-out forwards', animationDelay: '0.15s', opacity: 0 }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.tripsLabel}</p>
            <div className="flex flex-col gap-2">
              {trips.map((t) => {
                const dateBits = [fmtDate(t.travelDate), t.returnDate ? `→ ${fmtDate(t.returnDate)}` : '']
                  .filter(Boolean)
                  .join(' ');
                const Icon = t.event ? Ticket : t.flightNumber ? Plane : MapPin;
                return (
                  <GlassCard key={t.tripId} className="p-3 flex items-center gap-3" style={{ borderRadius: 14 }}>
                    <Icon size={18} style={{ color: '#7dd3fc' }} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-sm truncate">{t.label}</p>
                        {t.planning && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                            style={{ background: 'rgba(125,211,252,0.18)', color: '#7dd3fc' }}
                          >
                            {content.trips.planningBadge}
                          </span>
                        )}
                      </div>
                      {dateBits && (
                        <p className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                          <Calendar size={12} /> {dateBits}
                        </p>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 gap-3"
            style={{ animation: 'slide-up 0.45s ease-out forwards', animationDelay: '0.15s', opacity: 0 }}
          >
            {infoCards.map(({ icon: Icon, label, value }) => (
              <GlassCard key={label} className="p-3" style={{ borderRadius: 14 }}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} style={{ color: '#7dd3fc' }} />
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                </div>
                <p className="font-bold text-white text-sm">{value}</p>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Looking for */}
        {primaryIntent && (
          <div style={{ animation: 'slide-up 0.45s ease-out forwards', animationDelay: '0.2s', opacity: 0 }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.lookingFor}</p>
            <div className="flex flex-wrap gap-2">
              {user.intents?.map((it) => <IntentChip key={it} intent={it} selected readOnly />)}
            </div>
          </div>
        )}

        {/* Actions */}
        <div
          className="flex gap-3 pt-2"
          style={{ animation: 'slide-up 0.45s ease-out forwards', animationDelay: '0.25s', opacity: 0 }}
        >
          <GlassButton variant="glass" onClick={() => navigate(-1)}>{c.pass}</GlassButton>
          {/* Replace the profile in history so Back from the chat returns
              straight to where the person was found (hub / discover). */}
          <GlassButton
            variant="solid"
            onClick={() => (fromChat ? navigate(-1) : navigate(`/chat/${user.userId}`, { replace: true }))}
          >
            {c.sayHi}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
