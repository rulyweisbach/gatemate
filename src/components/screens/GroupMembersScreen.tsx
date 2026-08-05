import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { ArrowLeft, Crown, UserMinus } from 'lucide-react';
import { useApi } from '../../api/client';
import type { Group } from '../../types';
import { groupCategoryMeta } from '../../data/groupMeta';
import { content, fmt } from '../../content';
import Avatar from '../ui/Avatar';
import GlassCard from '../layout/GlassCard';

const c = content.members;

export default function GroupMembersScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const api = useApi();
  const myId = auth.user?.profile?.sub;

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getGroup(id)
      .then((r) => setGroup(r.group))
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isOwner = !!group && group.ownerId === myId;

  const remove = async (memberId: string) => {
    if (!id || !confirm(c.confirmRemove)) return;
    setBusyId(memberId);
    try {
      const r = await api.removeMember(id, memberId);
      setGroup(r.group);
    } catch (e) {
      alert(e instanceof Error ? e.message : c.removeError);
    } finally {
      setBusyId(null);
    }
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
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {group ? group.title : c.fallbackTitle}
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {group ? fmt(c.count, { count: group.members?.length ?? 0, max: group.maxMembers }) : ' '}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-4 py-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="text-4xl anim-float-plane">✈️</div>
          </div>
        )}

        {!loading && !group && (
          <p className="text-center text-sm py-16" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.notFound}</p>
        )}

        {!loading && group && (
          <>
            {isOwner && (
              <p className="text-xs px-1 pb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {fmt(c.ownerHint, { emoji: groupCategoryMeta[group.category]?.emoji ?? '' })}
              </p>
            )}
            {group.members?.map((m) => {
              const isTheOwner = m.userId === group.ownerId;
              const isMe = m.userId === myId;
              return (
                <GlassCard key={m.userId} className="p-3 flex items-center gap-3" style={{ borderRadius: 14 }}>
                  <Avatar photo={m.photo} size={44} radius={12} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">{m.name || 'Traveler'}</span>
                      {isMe && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>{c.you}</span>
                      )}
                    </div>
                    {isTheOwner && (
                      <span className="text-xs flex items-center gap-1 mt-0.5" style={{ color: '#7df5c0' }}>
                        <Crown size={11} /> {c.organizer}
                      </span>
                    )}
                  </div>
                  {isOwner && !isTheOwner && (
                    <button
                      onClick={() => remove(m.userId)}
                      disabled={busyId === m.userId}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full shrink-0"
                      style={{ background: 'rgba(255,120,120,0.15)', border: '1px solid rgba(255,120,120,0.3)', color: '#ffb4b4' }}
                    >
                      <UserMinus size={13} /> {busyId === m.userId ? '…' : c.remove}
                    </button>
                  )}
                </GlassCard>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
