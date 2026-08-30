import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Users, MessageCircle } from 'lucide-react';
import { useApi } from '../../api/client';
import { content, fmt } from '../../content';
import type { Trip, TripPerson, Group, MatchReason } from '../../types';
import GlassCard from '../layout/GlassCard';
import Avatar from '../ui/Avatar';

const c = content.tripHub;
const cp = content.peopleFeed;

type Tab = 'people' | 'groups';

const FILTERS: { id: MatchReason; label: string }[] = [
  { id: 'sameFlight', label: c.filterSameFlight },
  { id: 'sameDate', label: c.filterSameDate },
  { id: 'sameEvent', label: c.filterSameEvent },
  { id: 'nearby', label: c.filterNearby },
];

const REASON_LABEL: Record<MatchReason, string> = {
  sameFlight: cp.reasonSameFlight,
  sameDate: cp.reasonSameDate,
  sameEvent: cp.reasonSameEvent,
  sameDestination: cp.reasonSameDestination,
  nearby: cp.reasonNearby,
};

export default function TripHubScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const api = useApi();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [tab, setTab] = useState<Tab>('people');
  const [filter, setFilter] = useState<MatchReason | ''>('');

  const [people, setPeople] = useState<TripPerson[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(true);
  const [peopleError, setPeopleError] = useState(false);

  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

  // Trip meta (for the header label / event-aware filters).
  useEffect(() => {
    api.getTrip(id).then((r) => setTrip(r.trip)).catch(() => setTrip(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // People feed — refetch when the filter changes.
  useEffect(() => {
    setPeopleLoading(true);
    setPeopleError(false);
    api.getTripPeople(id, filter || undefined)
      .then((r) => setPeople(r.people ?? []))
      .catch(() => setPeopleError(true))
      .finally(() => setPeopleLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, filter]);

  // Groups for this trip.
  useEffect(() => {
    api.getTripGroups(id)
      .then((r) => setGroups(r.groups ?? []))
      .catch(() => setGroups([]))
      .finally(() => setGroupsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const sayHi = async (person: TripPerson) => {
    try { await api.sayHi(person.userId); } catch { /* ignore */ }
    navigate(`/chat/${person.userId}`);
  };

  // Only show event filter when the trip actually has an event.
  const filters = FILTERS.filter((f) => f.id !== 'sameEvent' || !!trip?.event);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div
        className="glass-dark sticky top-0 z-10 px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/trips')}
            className="flex items-center justify-center rounded-full shrink-0"
            style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
            aria-label={content.common.back}
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-base truncate" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {trip?.label ?? c.title}
            </p>
            <button onClick={() => navigate(`/trips/new?edit=${id}`)} className="text-xs" style={{ color: '#7dd3fc' }}>
              {c.editTrip}
            </button>
          </div>
        </div>

        {/* Tabs */}
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
        {tab === 'people' ? (
          <>
            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              {filters.map((f) => {
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter(active ? '' : f.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: active ? 'rgba(125,211,252,0.28)' : 'rgba(255,255,255,0.08)',
                      color: active ? 'white' : 'rgba(255,255,255,0.6)',
                      border: active ? '1px solid #7dd3fc' : '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {peopleLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="text-4xl anim-float-plane">✈️</div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{cp.loading}</p>
              </div>
            )}

            {!peopleLoading && peopleError && (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
                <div className="text-4xl">😕</div>
                <p className="font-bold text-white">{cp.errorTitle}</p>
              </div>
            )}

            {!peopleLoading && !peopleError && people.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
                <div className="text-5xl">🧭</div>
                <p className="font-bold text-white">{cp.emptyTitle}</p>
                <p className="text-sm px-6" style={{ color: 'rgba(255,255,255,0.5)' }}>{cp.emptyBody}</p>
              </div>
            )}

            {!peopleLoading && !peopleError && people.length > 0 && (
              <>
                <p className="text-xs px-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {fmt(cp.count, { count: people.length })}
                </p>
                {people.map((p, i) => (
                  <GlassCard
                    key={p.userId}
                    className="p-3.5 flex flex-col gap-3"
                    style={{ borderRadius: 18, animation: 'slide-up 0.4s ease-out forwards', animationDelay: `${i * 0.05}s`, opacity: 0 }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar photo={p.photo} size={52} radius={14} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">{p.name}</p>
                        {p.tagline && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{p.tagline}</p>
                        )}
                      </div>
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                        style={{ background: 'rgba(125,211,252,0.18)', color: '#7dd3fc' }}
                      >
                        {fmt(cp.relevant, { percent: p.relevance })}
                      </span>
                    </div>

                    {p.reasons?.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {p.reasons.map((r) => (
                          <span
                            key={r}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                          >
                            {REASON_LABEL[r]}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/profile/${p.userId}`)}
                        className="flex-1 text-xs font-bold py-2 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
                      >
                        {cp.viewProfile}
                      </button>
                      <button
                        onClick={() => sayHi(p)}
                        className="flex-1 text-xs font-bold py-2 rounded-full"
                        style={{ background: '#7dd3fc', color: '#0b1a3b' }}
                      >
                        {cp.sayHi}
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => navigate(`/trips/${id}/groups/new`)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold"
              style={{ background: 'rgba(125,211,252,0.15)', color: '#7dd3fc', border: '1px dashed rgba(125,211,252,0.4)' }}
            >
              <Plus size={16} /> {content.groups.emptyCta}
            </button>

            {groupsLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="text-4xl anim-float-plane">✈️</div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{content.groups.loading}</p>
              </div>
            )}

            {!groupsLoading && groups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14 gap-2 text-center">
                <div className="text-5xl">👥</div>
                <p className="font-bold text-white">{content.groups.emptyTitle}</p>
                <p className="text-sm px-6" style={{ color: 'rgba(255,255,255,0.5)' }}>{content.groups.emptyBody}</p>
              </div>
            )}

            {!groupsLoading && groups.map((g, i) => (
              <GlassCard
                key={g.groupId}
                onClick={() => navigate(`/groups/${g.groupId}/chat`)}
                className="p-3.5 flex items-center gap-3"
                style={{ borderRadius: 18, animation: 'slide-up 0.4s ease-out forwards', animationDelay: `${i * 0.05}s`, opacity: 0 }}
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
            ))}
          </>
        )}
      </div>
    </div>
  );
}
