import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { ArrowLeft, Trash2, Users as UsersIcon, ShieldCheck, LogOut, Plane, X } from 'lucide-react';
import { useApi } from '../../api/client';
import type { AdminUser, AdminTrip, Group } from '../../types';
import { groupCategoryMeta } from '../../data/groupMeta';
import { cognitoLogoutUrl } from '../../auth/authConfig';
import { content, fmt } from '../../content';
import Avatar from '../ui/Avatar';
import GlassCard from '../layout/GlassCard';

const c = content.admin;

type Tab = 'users' | 'trips' | 'groups';

export default function AdminScreen() {
  const navigate = useNavigate();
  const auth = useAuth();
  const api = useApi();
  const mySub = auth.user?.profile?.sub;

  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [trips, setTrips] = useState<AdminTrip[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  // Clear the locally stored OIDC session BEFORE the Cognito logout redirect —
  // otherwise the app finds the old token in localStorage and stays signed in.
  const logOut = async () => {
    await auth.removeUser().catch(() => {});
    window.location.href = cognitoLogoutUrl();
  };

  const load = () => {
    setLoading(true);
    Promise.all([api.adminListUsers(), api.adminListTrips(), api.adminListGroups()])
      .then(([u, t, g]) => {
        setUsers(u.users ?? []);
        setTrips(t.trips ?? []);
        setGroups(g.groups ?? []);
      })
      .catch((e) => {
        if (e instanceof Error && e.message.includes('403')) setDenied(true);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const removeUser = async (u: AdminUser) => {
    if (!confirm(fmt(c.confirmRemoveUser, { who: u.email || u.name || 'this user' }))) return;
    try {
      await api.adminDeleteUser(u.username, u.sub);
      setUsers((cur) => cur.filter((x) => x.username !== u.username));
      // Their trips / owned groups / memberships were removed server-side.
      setTrips((cur) => cur.filter((t) => t.userId !== u.sub));
      setGroups((cur) =>
        cur
          .filter((g) => g.ownerId !== u.sub)
          .map((g) => ({ ...g, members: (g.members ?? []).filter((m) => m.userId !== u.sub) }))
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : c.removeUserError);
    }
  };

  const deleteTrip = async (t: AdminTrip) => {
    if (!confirm(fmt(c.confirmDeleteTrip, { label: t.label, who: t.ownerName || t.ownerEmail || t.userId }))) return;
    try {
      await api.adminDeleteTrip(t.tripId);
      setTrips((cur) => cur.filter((x) => x.tripId !== t.tripId));
    } catch (e) {
      alert(e instanceof Error ? e.message : c.deleteTripError);
    }
  };

  const closeGroup = async (g: Group) => {
    if (!confirm(fmt(c.confirmCloseGroup, { title: g.title }))) return;
    try {
      await api.adminDeleteGroup(g.groupId);
      setGroups((cur) => cur.filter((x) => x.groupId !== g.groupId));
    } catch (e) {
      alert(e instanceof Error ? e.message : c.closeGroupError);
    }
  };

  const removeMember = async (g: Group, memberId: string, memberName?: string) => {
    if (!confirm(fmt(c.confirmRemoveMember, { who: memberName || 'this member', title: g.title }))) return;
    try {
      const { group } = await api.adminRemoveMember(g.groupId, memberId);
      setGroups((cur) => cur.map((x) => (x.groupId === g.groupId ? group : x)));
    } catch (e) {
      alert(e instanceof Error ? e.message : c.removeMemberError);
    }
  };

  // ── Access denied ──
  if (denied) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-8 text-center" style={{ minHeight: '100dvh' }}>
        <div className="text-5xl">🚫</div>
        <p className="font-bold text-white text-lg">{c.deniedTitle}</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {fmt(c.deniedBody, { email: (auth.user?.profile?.email as string) || 'unknown' })}
        </p>
        <div className="flex gap-3 mt-2">
          <button className="btn-glass" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => void logOut()}>
            {c.switchAccount}
          </button>
          <button className="btn-solid" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => navigate('/')}>
            {c.home}
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
            <span className="font-bold text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>{c.title}</span>
          </div>
          <button
            onClick={() => void logOut()}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}
          >
            <LogOut size={13} /> {content.common.logOut}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          {(['users', 'trips', 'groups'] as Tab[]).map((t) => {
            const label =
              t === 'users' ? `${c.usersTab} (${users.length})`
              : t === 'trips' ? `${c.tripsTab} (${trips.length})`
              : `${c.groupsTab} (${groups.length})`;
            return (
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
                {label}
              </button>
            );
          })}
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
          const tripCount = trips.filter((t) => t.userId === u.sub).length;
          return (
            <GlassCard key={u.username} className="p-4" style={{ borderRadius: 16 }}>
              <div className="flex items-start gap-3">
                <Avatar photo={p?.photos?.[0] ?? p?.photo} size={48} radius={14} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm truncate">{u.name || p?.name || '—'}</span>
                    {isSelf && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(125,245,192,0.15)', color: '#7df5c0' }}>{c.you}</span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{u.email}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>🔑 {u.provider === 'social' ? c.loginGoogle : c.loginEmail}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>● {u.status}</span>
                    {tripCount > 0 && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>🧳 {tripCount}</span>}
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
          <p className="text-center text-sm py-16" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.noUsers}</p>
        )}

        {/* TRIPS */}
        {!loading && tab === 'trips' && trips.map((t) => (
          <GlassCard key={t.tripId} className="p-4" style={{ borderRadius: 16 }}>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center shrink-0" style={{ width: 44, height: 44, background: 'rgba(125,211,252,0.15)', borderRadius: 12 }}>
                <Plane size={20} style={{ color: '#7dd3fc' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{t.label}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {fmt(c.byOwner, { who: t.ownerName || t.ownerEmail || t.userId })}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                  {t.status && <span className="text-xs capitalize" style={{ color: t.status === 'past' ? 'rgba(255,255,255,0.35)' : '#7dd3fc' }}>● {t.status}</span>}
                  {t.travelDate && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>📅 {t.travelDate}{t.returnDate ? ` → ${t.returnDate}` : ''}</span>}
                  {t.event?.name && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>🎫 {t.event.name}</span>}
                </div>
              </div>
              <button
                onClick={() => deleteTrip(t)}
                aria-label="Delete trip"
                className="flex items-center justify-center rounded-full shrink-0"
                style={{ width: 34, height: 34, background: 'rgba(255,120,120,0.15)', border: '1px solid rgba(255,120,120,0.3)' }}
              >
                <Trash2 size={15} style={{ color: '#ffb4b4' }} />
              </button>
            </div>
          </GlassCard>
        ))}
        {!loading && tab === 'trips' && trips.length === 0 && (
          <p className="text-center text-sm py-16" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.noTrips}</p>
        )}

        {/* GROUPS */}
        {!loading && tab === 'groups' && groups.map((g) => {
          const open = openGroup === g.groupId;
          return (
            <GlassCard key={g.groupId} className="p-4" style={{ borderRadius: 16 }}>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center text-xl shrink-0" style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.12)', borderRadius: 12 }}>
                  {groupCategoryMeta[g.category]?.emoji ?? '✨'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{g.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {content.groups.by} {g.ownerName || 'unknown'} · {groupCategoryMeta[g.category]?.label}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                    {g.date && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>📅 {g.date}</span>}
                    {g.location && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>📍 {g.location}</span>}
                    <button
                      onClick={() => setOpenGroup(open ? null : g.groupId)}
                      className="text-xs flex items-center gap-1 font-semibold"
                      style={{ color: '#7dd3fc' }}
                    >
                      <UsersIcon size={11} /> {g.members?.length ?? 0}/{g.maxMembers} {c.membersLabel} {open ? '▴' : '▾'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => closeGroup(g)}
                  className="text-xs font-bold px-3 py-2 rounded-full shrink-0"
                  style={{ background: 'rgba(255,120,120,0.15)', border: '1px solid rgba(255,120,120,0.3)', color: '#ffb4b4' }}
                >
                  {c.close}
                </button>
              </div>

              {/* Expandable member list with per-member removal */}
              {open && (
                <div className="flex flex-col gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  {(g.members ?? []).map((m) => {
                    const isOwner = m.userId === g.ownerId;
                    return (
                      <div key={m.userId} className="flex items-center gap-2.5">
                        <Avatar photo={m.photo} size={30} radius={9} />
                        <span className="flex-1 text-xs font-semibold text-white truncate">{m.name || m.userId}</span>
                        {isOwner ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(125,245,192,0.15)', color: '#7df5c0' }}>
                            {c.ownerBadge}
                          </span>
                        ) : (
                          <button
                            onClick={() => removeMember(g, m.userId, m.name)}
                            aria-label={`Remove ${m.name || 'member'}`}
                            className="flex items-center justify-center rounded-full shrink-0"
                            style={{ width: 26, height: 26, background: 'rgba(255,120,120,0.15)', border: '1px solid rgba(255,120,120,0.3)' }}
                          >
                            <X size={13} style={{ color: '#ffb4b4' }} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          );
        })}
        {!loading && tab === 'groups' && groups.length === 0 && (
          <p className="text-center text-sm py-16" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.noGroups}</p>
        )}
      </div>
    </div>
  );
}
