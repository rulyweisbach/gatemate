import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Users } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { useApi } from '../../api/client';
import type { Group, GroupCategory } from '../../types';
import { groupCategoryMeta, GROUP_CATEGORIES } from '../../data/groupMeta';
import { content } from '../../content';
import GlassCard from '../layout/GlassCard';

const c = content.groups;

export default function GroupsScreen() {
  const navigate = useNavigate();
  const auth = useAuth();
  const api = useApi();
  const myId = auth.user?.profile?.sub;

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<GroupCategory | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.listGroups()
      .then((r) => setGroups(r.groups ?? []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = groups.filter((g) => {
    if (cat && g.category !== cat) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return [g.title, g.description, g.location, g.ownerName]
        .filter(Boolean)
        .some((f) => f!.toLowerCase().includes(q));
    }
    return true;
  });

  const updateOne = (g: Group) => setGroups((cur) => cur.map((x) => (x.groupId === g.groupId ? g : x)));

  const join = async (g: Group) => {
    setBusyId(g.groupId);
    try { updateOne((await api.joinGroup(g.groupId)).group); } catch { /* full or error */ load(); }
    finally { setBusyId(null); }
  };
  const leave = async (g: Group) => {
    setBusyId(g.groupId);
    try { updateOne((await api.leaveGroup(g.groupId)).group); } catch { /* ignore */ }
    finally { setBusyId(null); }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div
        className="glass-dark sticky top-0 z-10 flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center rounded-full shrink-0"
          style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <span className="flex-1 font-bold text-white text-base" style={{ fontFamily: 'Nunito, sans-serif' }}>
          {c.title}
        </span>
        <button
          onClick={() => navigate('/groups/new')}
          className="flex items-center gap-1.5 font-bold text-sm rounded-full px-3.5 py-2"
          style={{ background: '#7dd3fc', color: '#0b1a3b' }}
        >
          <Plus size={16} /> {c.create}
        </button>
      </div>

      {/* Search + filters */}
      <div className="px-4 pt-4 flex flex-col gap-3">
        <div className="relative">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 left-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
          <input
            className="glass-input pl-10"
            placeholder={c.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCat(null)}
            className="intent-chip shrink-0"
            style={!cat ? { background: 'rgba(125,211,252,0.28)', borderColor: '#7dd3fc' } : {}}
          >
            {c.all}
          </button>
          {GROUP_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(cat === c ? null : c)}
              className="intent-chip shrink-0"
              style={cat === c ? { background: 'rgba(125,211,252,0.28)', borderColor: '#7dd3fc' } : {}}
            >
              {groupCategoryMeta[c].emoji} {groupCategoryMeta[c].label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3 px-4 py-4 pb-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="text-4xl anim-float-plane">✈️</div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.loading}</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="text-5xl">🧩</div>
            <p className="font-bold text-white">{c.emptyTitle}</p>
            <p className="text-sm px-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {c.emptyBody}
            </p>
            <button onClick={() => navigate('/groups/new')} className="btn-solid mt-2" style={{ width: 'auto', padding: '12px 28px' }}>
              {c.emptyCta}
            </button>
          </div>
        )}

        {!loading && filtered.map((g, i) => {
          const meta = groupCategoryMeta[g.category];
          const isOwner = g.ownerId === myId;
          const isMember = g.members?.some((m) => m.userId === myId);
          const full = (g.members?.length ?? 0) >= g.maxMembers;
          return (
            <GlassCard
              key={g.groupId}
              className="p-4"
              style={{ borderRadius: 18, animation: 'slide-up 0.4s ease-out forwards', animationDelay: `${i * 0.05}s`, opacity: 0 }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center shrink-0 text-2xl"
                  style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.12)', borderRadius: 14 }}
                >
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm leading-snug">{g.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {meta.label} · {c.by} {isOwner ? c.you : g.ownerName || c.aTraveler}
                  </p>
                  {g.description && (
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {g.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    {g.date && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>📅 {g.date}</span>}
                    {g.location && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>📍 {g.location}</span>}
                    <span className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      <Users size={12} /> {g.members?.length ?? 0}/{g.maxMembers}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {(isOwner || isMember) && (
                  <>
                    <button
                      onClick={() => navigate(`/groups/${g.groupId}/chat`)}
                      className="text-xs font-bold px-4 py-2 rounded-full"
                      style={{ background: '#7dd3fc', color: '#0b1a3b' }}
                    >
                      {c.openChat}
                    </button>
                    <button
                      onClick={() => navigate(`/groups/${g.groupId}/members`)}
                      className="text-xs font-bold px-4 py-2 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white' }}
                    >
                      {c.members}
                    </button>
                  </>
                )}
                {isOwner ? (
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full inline-block"
                    style={{ background: 'rgba(125,245,192,0.15)', border: '1px solid rgba(125,245,192,0.4)', color: '#7df5c0' }}>
                    {c.yourGroup}
                  </span>
                ) : isMember ? (
                  <button
                    onClick={() => leave(g)}
                    disabled={busyId === g.groupId}
                    className="text-xs font-bold px-4 py-2 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white' }}
                  >
                    {busyId === g.groupId ? '…' : c.leave}
                  </button>
                ) : full ? (
                  <span className="text-xs font-semibold px-4 py-2 rounded-full inline-block"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                    {c.full}
                  </span>
                ) : (
                  <button
                    onClick={() => join(g)}
                    disabled={busyId === g.groupId}
                    className="text-xs font-bold px-5 py-2 rounded-full"
                    style={{ background: '#7dd3fc', color: '#0b1a3b' }}
                  >
                    {busyId === g.groupId ? '…' : c.join}
                  </button>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
