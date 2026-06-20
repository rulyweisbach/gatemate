import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { mockUsers } from '../../data/mockUsers';
import GlassCard from '../layout/GlassCard';
import VerifiedBadge from '../ui/VerifiedBadge';
import { intentMeta } from '../ui/IntentChip';

export default function FeedScreen() {
  const navigate = useNavigate();
  const { selectedIntents } = useAppStore();

  const filtered =
    selectedIntents.length === 0
      ? mockUsers
      : mockUsers.filter((u) => selectedIntents.includes(u.intent));

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div
        className="glass-dark sticky top-0 z-10 flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center rounded-full"
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

        <div className="flex-1">
          <p className="font-bold text-white text-base" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Near Your Gate
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {filtered.length} traveler{filtered.length !== 1 ? 's' : ''} nearby
          </p>
        </div>

        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(125,211,252,0.2)', border: '1px solid rgba(125,211,252,0.4)' }}
        >
          <Users size={13} style={{ color: '#7dd3fc' }} />
          <span className="text-xs font-bold" style={{ color: '#7dd3fc' }}>
            {filtered.length}
          </span>
        </div>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-3 px-4 py-4 pb-8">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="text-5xl">🔍</div>
            <p className="font-bold text-white">No matches found</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Try removing some filters to see more travelers
            </p>
          </div>
        )}

        {filtered.map((user, i) => (
          <GlassCard
            key={user.id}
            onClick={() => navigate(`/profile/${user.id}`)}
            className="p-4"
            style={{
              borderRadius: 18,
              animation: 'slide-up 0.45s ease-out forwards',
              animationDelay: `${i * 0.07}s`,
              opacity: 0,
            }}
          >
            <div className="flex gap-3 items-start">
              {/* Avatar */}
              <div
                className="flex items-center justify-center shrink-0 text-3xl"
                style={{
                  width: 56,
                  height: 56,
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                {user.photo}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm">{user.name}</span>
                  {user.verified && <VerifiedBadge small />}
                </div>
                <p
                  className="text-xs mt-0.5 truncate"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  {user.tagline}
                </p>

                {/* Intent pill */}
                <div className="mt-2">
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(125,211,252,0.15)',
                      border: '1px solid rgba(125,211,252,0.3)',
                      color: '#7dd3fc',
                    }}
                  >
                    {intentMeta[user.intent].emoji} {intentMeta[user.intent].label}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    📍 {user.distance}
                  </span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    ✈️ {user.flight}
                  </span>
                  {user.mutualConnections > 0 && (
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      👥 {user.mutualConnections} mutual
                    </span>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
