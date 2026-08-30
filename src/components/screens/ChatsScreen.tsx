import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { MessageCircle, Users } from 'lucide-react';
import { useApi } from '../../api/client';
import { content } from '../../content';
import type { Match, Group } from '../../types';
import GlassCard from '../layout/GlassCard';
import Avatar from '../ui/Avatar';

const c = content.connections;

type Tab = 'people' | 'groups';

export default function ChatsScreen() {
  const navigate = useNavigate();
  const api = useApi();
  const auth = useAuth();
  const myId = auth.user?.profile?.sub;

  const [tab, setTab] = useState<Tab>('people');
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMatches().then((r) => r.matches ?? []).catch(() => []),
      api.listGroups().then((r) => r.groups ?? []).catch(() => []),
    ])
      .then(([m, g]) => {
        setMatches(m);
        setGroups(g.filter((grp) => grp.ownerId === myId || grp.members?.some((mem) => mem.userId === myId)));
      })
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
        <p className="font-bold text-white text-base" style={{ fontFamily: 'Nunito, sans-serif' }}>{c.title}</p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.subtitle}</p>
        <div className="flex gap-2 mt-3">
          {([
            { id: 'people' as Tab, label: c.peopleTab },
            { id: 'groups' as Tab, label: c.groupsTab },
          ]).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: active ? '#7dd3fc' : 'rgba(255,255,255,0.08)',
                  color: active ? '#0b1a3b' : 'rgba(255,255,255,0.65)',
                  border: active ? '1px solid #7dd3fc' : '1px solid rgba(255,255,255,0.12)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 py-4" style={{ paddingBottom: 'calc(84px + env(safe-area-inset-bottom))' }}>
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-4xl anim-float-plane">✈️</div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.loading}</p>
          </div>
        )}

        {/* People */}
        {!loading && tab === 'people' && (
          matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="text-5xl">💬</div>
              <p className="font-bold text-white">{c.emptyPeopleTitle}</p>
              <p className="text-sm px-6" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.emptyPeopleBody}</p>
              <button onClick={() => navigate('/discover')} className="btn-solid mt-2" style={{ width: 'auto', padding: '12px 28px' }}>
                {c.discoverCta}
              </button>
            </div>
          ) : (
            matches.map((m, i) => (
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
                <div className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full shrink-0" style={{ background: '#7dd3fc', color: '#0b1a3b' }}>
                  <MessageCircle size={13} /> {c.open}
                </div>
              </GlassCard>
            ))
          )
        )}

        {/* Groups */}
        {!loading && tab === 'groups' && (
          groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="text-5xl">👥</div>
              <p className="font-bold text-white">{c.emptyGroupsTitle}</p>
              <p className="text-sm px-6" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.emptyGroupsBody}</p>
              <button onClick={() => navigate('/trips')} className="btn-solid mt-2" style={{ width: 'auto', padding: '12px 28px' }}>
                {content.trips.title}
              </button>
            </div>
          ) : (
            groups.map((g, i) => (
              <GlassCard
                key={g.groupId}
                onClick={() => navigate(`/groups/${g.groupId}/chat`)}
                className="p-3.5 flex items-center gap-3"
                style={{ borderRadius: 16, animation: 'slide-up 0.4s ease-out forwards', animationDelay: `${i * 0.05}s`, opacity: 0 }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{g.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    <span className="flex items-center gap-1"><Users size={12} /> {g.members?.length ?? 0}/{g.maxMembers}</span>
                    {g.location && <span className="truncate">{g.location}</span>}
                  </div>
                </div>
                <MessageCircle size={18} style={{ color: '#7dd3fc' }} />
              </GlassCard>
            ))
          )
        )}
      </div>
    </div>
  );
}
