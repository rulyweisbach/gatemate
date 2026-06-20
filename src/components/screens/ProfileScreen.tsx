import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plane, DoorOpen, Clock, MapPin } from 'lucide-react';
import { mockUsers } from '../../data/mockUsers';
import GlassCard from '../layout/GlassCard';
import VerifiedBadge from '../ui/VerifiedBadge';
import GlassButton from '../ui/GlassButton';
import IntentChip from '../ui/IntentChip';

export default function ProfileScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = mockUsers.find((u) => u.id === id);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-white text-lg font-bold">User not found</p>
        <button className="btn-glass" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  const infoCards = [
    { icon: Plane, label: 'Flight', value: user.flight },
    { icon: DoorOpen, label: 'Gate', value: user.gate },
    { icon: Clock, label: 'Departs', value: user.departure },
    { icon: MapPin, label: 'Route', value: `${user.origin} → ${user.destination}` },
  ];

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
        <span className="font-bold text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>
          Profile
        </span>
      </div>

      <div className="px-5 pb-10 flex flex-col gap-5">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 pt-4 anim-slide-up">
          <div
            className="flex items-center justify-center text-6xl"
            style={{
              width: 100,
              height: 100,
              background: 'rgba(255,255,255,0.13)',
              borderRadius: 28,
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            {user.photo}
          </div>
          <div className="text-center">
            <h2
              className="text-2xl font-black text-white"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {user.name}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {user.age} years old
            </p>
            {user.verified && (
              <div className="flex justify-center mt-2">
                <VerifiedBadge />
              </div>
            )}
            <p
              className="text-sm mt-3 font-medium px-4 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              {user.tagline}
            </p>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <GlassCard
            className="p-4"
            style={{
              borderRadius: 18,
              animation: 'slide-up 0.45s ease-out forwards',
              animationDelay: '0.1s',
              opacity: 0,
            }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              ABOUT
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {user.bio}
            </p>
          </GlassCard>
        )}

        {/* Info grid */}
        <div
          className="grid grid-cols-2 gap-3"
          style={{
            animation: 'slide-up 0.45s ease-out forwards',
            animationDelay: '0.15s',
            opacity: 0,
          }}
        >
          {infoCards.map(({ icon: Icon, label, value }) => (
            <GlassCard key={label} className="p-3" style={{ borderRadius: 14 }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} style={{ color: '#7dd3fc' }} />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {label}
                </span>
              </div>
              <p className="font-bold text-white text-sm">{value}</p>
            </GlassCard>
          ))}
        </div>

        {/* Looking for */}
        <div
          style={{
            animation: 'slide-up 0.45s ease-out forwards',
            animationDelay: '0.2s',
            opacity: 0,
          }}
        >
          <p
            className="text-xs font-semibold mb-2"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            LOOKING FOR
          </p>
          <IntentChip intent={user.intent} selected readOnly />
        </div>

        {/* Actions */}
        <div
          className="flex gap-3 pt-2"
          style={{
            animation: 'slide-up 0.45s ease-out forwards',
            animationDelay: '0.25s',
            opacity: 0,
          }}
        >
          <GlassButton variant="glass" onClick={() => navigate(-1)}>
            Pass
          </GlassButton>
          <GlassButton variant="solid" onClick={() => navigate(`/chat/${user.id}`)}>
            Say Hi 👋
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
