import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useApi } from '../../api/client';
import type { Profile } from '../../types';
import GlassCard from '../layout/GlassCard';
import VerifiedBadge from '../ui/VerifiedBadge';
import Avatar from '../ui/Avatar';
import { intentMeta } from '../ui/IntentChip';

export default function FeedScreen() {
  const navigate = useNavigate();
  const api = useApi();
  const { selectedIntents, flightNumber, searchMode } = useAppStore();

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    // Scope by flight only in flight-search mode; otherwise show everyone nearby.
    const flight = searchMode === 'flight' ? flightNumber || undefined : undefined;
    api
      .getFeed(flight)
      .then((res) => {
        if (cancelled) return;
        setUsers(res.users ?? []);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightNumber, searchMode]);

  // Client-side intent filter (multi-select).
  const filtered =
    selectedIntents.length === 0
      ? users
      : users.filter((u) => (u.intents ?? []).some((i) => selectedIntents.includes(i)));

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
            {loading ? 'Looking around…' : `${filtered.length} traveler${filtered.length !== 1 ? 's' : ''} nearby`}
          </p>
        </div>

        <button
          onClick={() => navigate('/me')}
          className="flex items-center justify-center rounded-full"
          style={{
            width: 36,
            height: 36,
            background: 'rgba(125,211,252,0.2)',
            border: '1px solid rgba(125,211,252,0.4)',
          }}
          aria-label="Edit my profile"
        >
          <UserCircle size={20} style={{ color: '#7dd3fc' }} />
        </button>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-3 px-4 py-4 pb-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-4xl anim-float-plane">✈️</div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Finding travelers nearby…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="text-5xl">⚠️</div>
            <p className="font-bold text-white">Couldn't load the feed</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="text-5xl">🔍</div>
            <p className="font-bold text-white">No one here yet</p>
            <p className="text-sm px-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
              No travelers match your flight and filters right now. Check back closer to boarding!
            </p>
          </div>
        )}

        {!loading && !error && filtered.map((user, i) => {
          const primaryIntent = user.intents?.[0];
          return (
            <GlassCard
              key={user.userId}
              onClick={() => navigate(`/profile/${user.userId}`)}
              className="p-4"
              style={{
                borderRadius: 18,
                animation: 'slide-up 0.45s ease-out forwards',
                animationDelay: `${i * 0.07}s`,
                opacity: 0,
              }}
            >
              <div className="flex gap-3 items-start">
                <Avatar photo={user.photos?.[0] ?? user.photo} size={56} radius={16} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{user.name}</span>
                    {user.verified && <VerifiedBadge small />}
                  </div>
                  {user.tagline && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {user.tagline}
                    </p>
                  )}

                  {primaryIntent && intentMeta[primaryIntent] && (
                    <div className="mt-2">
                      <span
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(125,211,252,0.15)',
                          border: '1px solid rgba(125,211,252,0.3)',
                          color: '#7dd3fc',
                        }}
                      >
                        {intentMeta[primaryIntent].emoji} {intentMeta[primaryIntent].label}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    {user.distance && (
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>📍 {user.distance}</span>
                    )}
                    {user.flight && (
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>✈️ {user.flight}</span>
                    )}
                    {!!user.mutualConnections && (
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        👥 {user.mutualConnections} mutual
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
