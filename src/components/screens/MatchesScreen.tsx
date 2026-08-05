import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useApi } from '../../api/client';
import { content } from '../../content';
import type { Match } from '../../types';
import GlassCard from '../layout/GlassCard';
import Avatar from '../ui/Avatar';

const c = content.matches;

export default function MatchesScreen() {
  const navigate = useNavigate();
  const api = useApi();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMatches()
      .then((r) => setMatches(r.matches ?? []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div
        className="glass-dark sticky top-0 z-10 px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <p className="font-bold text-white text-base" style={{ fontFamily: 'Nunito, sans-serif' }}>
          {c.title}
        </p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.subtitle}</p>
      </div>

      <div className="flex flex-col gap-3 px-4 py-4" style={{ paddingBottom: 'calc(84px + env(safe-area-inset-bottom))' }}>
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-4xl anim-float-plane">✈️</div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.loading}</p>
          </div>
        )}

        {!loading && matches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="text-5xl">💬</div>
            <p className="font-bold text-white">{c.emptyTitle}</p>
            <p className="text-sm px-6" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.emptyBody}</p>
            <button onClick={() => navigate('/feed')} className="btn-solid mt-2" style={{ width: 'auto', padding: '12px 28px' }}>
              {c.emptyCta}
            </button>
          </div>
        )}

        {!loading && matches.map((m, i) => (
          <GlassCard
            key={m.userId}
            onClick={() => navigate(`/chat/${m.userId}`)}
            className="p-3 flex items-center gap-3"
            style={{ borderRadius: 16, animation: 'slide-up 0.4s ease-out forwards', animationDelay: `${i * 0.05}s`, opacity: 0 }}
          >
            <Avatar photo={m.photo} size={52} radius={14} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate">{m.name}</p>
              {m.tagline && (
                <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{m.tagline}</p>
              )}
            </div>
            <div
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full shrink-0"
              style={{ background: '#7dd3fc', color: '#0b1a3b' }}
            >
              <MessageCircle size={13} /> {c.openChat}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
