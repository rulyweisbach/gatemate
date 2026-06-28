import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { ArrowLeft, Trash2, Users as UsersIcon, ShieldCheck, LogOut } from 'lucide-react';
import { useApi } from '../../api/client';
import type { AdminUser, Group } from '../../types';
import { groupCategoryMeta } from '../../data/groupMeta';
import { cognitoLogoutUrl } from '../../auth/authConfig';
import Avatar from '../ui/Avatar';
import GlassCard from '../layout/GlassCard';

type Tab = 'users' | 'groups';

export default function AdminScreen() {
  const navigate = useNavigate();
  const auth = useAuth();
  const api = useApi();
  const mySub = auth.user?.profile?.sub;

  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.adminListUsers(), api.adminListGroups()])
      .then(([u, g]) => {
        setUsers(u.users ?? []);
        setGroups(g.groups ?? []);
      })
      .catch((e) => {
        if (e instanceof Error && e.message.includes('403')) setDenied(true);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const removeUser = async (u: AdminUser) => {
    if (!confirm(`Remove ${u.email || u.name || 'this user'}? This deletes their account, profile, and groups they own.`)) return;
    try {
      await api.adminDeleteUser(u.username, u.sub);
      setUsers((cur) => cur.filter((x) => x.username !== u.username));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to remove user');
    }
  };

  const closeGroup = async (g: Group) => {
    if (!confirm(`Close the group "${g.title}"? This permanently removes it.`)) return;
    try {
      await api.adminDeleteGroup(g.groupId);
      setGroups((cur) => cur.filter((x) => x.groupId !== g.groupId));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to close group');
    }
  };

  // ── Access denied ──
  if (denied) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-8 text-center" style={{ minHeight: '100dvh' }}>
        <div className="text-5xl">🚫</div>
        <p className="font-bold text-white text-lg">Access denied</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
          You're signed in as <b>{(auth.user?.profile?.email as string) || 'unknown'}</b>, which isn't an admin account.
        </p>
        <div className="flex gap-3 mt-2">
          <button className="btn-glass" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => (window.location.href = cognitoLogoutUrl())}>
            Switch account
          </button>
          <button className="btn-solid" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => navigate('/')}>
            Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="glass-dark sticky top-0 z-10 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center rounded-full shrink-0"
            style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
            aria-label="Home"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <ShieldCheck size={18} style={{ color: '#7df5c0' }} />
            <span className="font-bold text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>Admin</span>
          </div>
          <button
            onClick={() => (window.location.href = cognitoLogoutUrl())}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}
          >
            <LogOut size={13} /> Log out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          {(['users', 'groups'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all"
              style={{
                background: tab === t ? 'rgba(125,211,252,0.25)' : 'rgba(255,255,255,0.08)',
                border: tab === t ? '1px solid #7dd3fc' : '1px solid rgba(255,255,255,0.15)',
                color: tab === t ? 'white' : 'rgba(255,255,255,0.6)',
              }}
            >
              {t === 'users' ? `Users (${users.length})` : `Groups (${groups.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 py-4 pb-10">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-4xl anim-float-plane">✈️</div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading…</p>
          </div>
        )}

        {/* USERS */}
        {!loading && tab === 'users' && users.map((u) => {
          const p = u.profile;
          const isSelf = u.sub === mySub;
          return (
            <GlassCard key={u.username} className="p-4" style={{ borderRadius: 16 }}>
              <div className="flex items-start gap-3">
                <Avatar photo={p?.photos?.[0] ?? p?.photo} size={48} radius={14} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm truncate">{u.name || p?.name || '—'}</span>
                    {isSelf && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(125,245,192,0.15)', color: '#7df5c0' }}>you</span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{u.email}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>🔑 {u.provider === 'social' ? 'Google' : 'Email'}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>● {u.status}</span>
                    {p?.flight && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>✈️ {p.flight}</span>}
                    {p?.intents?.length ? <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>🎯 {p.intents.length}</span> : null}
                    {u.createdAt && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>📅 {new Date(u.createdAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                {!isSelf && (
                  <button
                    onClick={() => removeUser(u)}
                    aria-label="Remove user"
                    className="flex items-center justify-center rounded-full shrink-0"
                    style={{ width: 34, height: 34, background: 'rgba(255,120,120,0.15)', border: '1px solid rgba(255,120,120,0.3)' }}
                  >
                    <Trash2 size={15} style={{ color: '#ffb4b4' }} />
                  </button>
                )}
              </div>
            </GlassCard>
          );
        })}
        {!loading && tab === 'users' && users.length === 0 && (
          <p className="text-center text-sm py-16" style={{ color: 'rgba(255,255,255,0.5)' }}>No registered users yet.</p>
        )}

        {/* GROUPS */}
        {!loading && tab === 'groups' && groups.map((g) => (
          <GlassCard key={g.groupId} className="p-4" style={{ borderRadius: 16 }}>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center text-xl shrink-0" style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.12)', borderRadius: 12 }}>
                {groupCategoryMeta[g.category]?.emoji ?? '✨'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{g.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  by {g.ownerName || 'unknown'} · {groupCategoryMeta[g.category]?.label}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                  {g.date && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>📅 {g.date}</span>}
                  {g.location && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>📍 {g.location}</span>}
                  <span className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <UsersIcon size={11} /> {g.members?.length ?? 0}/{g.maxMembers}
                  </span>
                </div>
              </div>
              <button
                onClick={() => closeGroup(g)}
                className="text-xs font-bold px-3 py-2 rounded-full shrink-0"
                style={{ background: 'rgba(255,120,120,0.15)', border: '1px solid rgba(255,120,120,0.3)', color: '#ffb4b4' }}
              >
                Close
              </button>
            </div>
          </GlassCard>
        ))}
        {!loading && tab === 'groups' && groups.length === 0 && (
          <p className="text-center text-sm py-16" style={{ color: 'rgba(255,255,255,0.5)' }}>No groups yet.</p>
        )}
      </div>
    </div>
  );
}
