import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plane, DoorOpen, Clock, MapPin } from 'lucide-react';
import { useApi } from '../../api/client';
import type { Profile } from '../../types';
import GlassCard from '../layout/GlassCard';
import VerifiedBadge from '../ui/VerifiedBadge';
import GlassButton from '../ui/GlassButton';
import IntentChip from '../ui/IntentChip';
import Avatar from '../ui/Avatar';

export default function ProfileScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const api = useApi();

  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    api
      .getUser(id)
      .then((res) => !cancelled && setUser(res.profile))
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
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading profile…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-white text-lg font-bold">Profile not found</p>
        <button className="btn-glass" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const route =
    user.origin && user.destination ? `${user.origin} → ${user.destination}` : '—';
  const infoCards = [
    { icon: Plane, label: 'Flight', value: user.flight || '—' },
    { icon: DoorOpen, label: 'Gate', value: user.gate || '—' },
    { icon: Clock, label: 'Departs', value: user.departure || '—' },
    { icon: MapPin, label: 'Route', value: route },
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
        <span className="font-bold text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>Profile</span>
      </div>

      <div className="px-5 pb-10 flex flex-col gap-5">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 pt-4 anim-slide-up">
          <Avatar photo={user.photo} size={100} radius={28} />
          <div className="text-center">
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {user.name}
            </h2>
            {!!user.age && (
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{user.age} years old</p>
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
            <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>ABOUT</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>{user.bio}</p>
          </GlassCard>
        )}

        {/* Info grid */}
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

        {/* Looking for */}
        {primaryIntent && (
          <div style={{ animation: 'slide-up 0.45s ease-out forwards', animationDelay: '0.2s', opacity: 0 }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>LOOKING FOR</p>
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
          <GlassButton variant="glass" onClick={() => navigate(-1)}>Pass</GlassButton>
          <GlassButton variant="solid" onClick={() => navigate(`/chat/${user.userId}`)}>Say Hi 👋</GlassButton>
        </div>
      </div>
    </div>
  );
}
