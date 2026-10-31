import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Users, MessageCircle, Plane, Ticket, MapPin, Compass } from 'lucide-react';
import { useApi } from '../../api/client';
import { content, fmt } from '../../content';
import type { Trip, TripPerson, Group, MatchReason, ContextType } from '../../types';
import GlassCard from '../layout/GlassCard';
import Avatar from '../ui/Avatar';

const c = content.tripHub;
const cp = content.peopleFeed;

const REASON_LABEL: Record<MatchReason, string> = {
  sameFlight: cp.reasonSameFlight,
  sameDate: cp.reasonSameDate,
  sameEvent: cp.reasonSameEvent,
  sameDestination: cp.reasonSameDestination,
  families: cp.reasonFamilies,
  planning: cp.reasonPlanning,
  nearby: cp.reasonNearby,
  sameOrigin: cp.reasonSameOrigin,
  sharedInterests: cp.reasonSharedInterests,
};

type SectionId = ContextType | 'nearby';

interface Section {
  id: SectionId;
  icon: typeof Plane;
  title: string;
  people: TripPerson[];
  groups: Group[];
  canAddGroup: boolean;
}

// The most specific overlap decides which section a person appears in.
function sectionFor(p: TripPerson): SectionId {
  if (p.reasons.includes('sameFlight')) return 'flight';
  if (p.reasons.includes('sameEvent')) return 'event';
  if (
    p.reasons.includes('sameDestination') ||
    p.reasons.includes('sameDate') ||
    p.reasons.includes('planning') ||
    p.reasons.includes('families')
  )
    return 'destination';
  return 'nearby';
}

function buildSections(trip: Trip, people: TripPerson[], groups: Group[]): Section[] {
  const byPerson = new Map<SectionId, TripPerson[]>();
  for (const p of people) {
    const s = sectionFor(p);
    byPerson.set(s, [...(byPerson.get(s) ?? []), p]);
  }
  const byGroup = new Map<SectionId, Group[]>();
  for (const g of groups) {
    const s: SectionId = g.context?.type ?? 'destination';
    byGroup.set(s, [...(byGroup.get(s) ?? []), g]);
  }

  const sections: Section[] = [];
  if (trip.flightNumber) {
    sections.push({
      id: 'flight',
      icon: Plane,
      title: fmt(c.sectionFlight, { label: trip.flightNumber }),
      people: byPerson.get('flight') ?? [],
      groups: byGroup.get('flight') ?? [],
      canAddGroup: true,
    });
  }
  if (trip.event?.name) {
    sections.push({
      id: 'event',
      icon: Ticket,
      title: fmt(c.sectionEvent, { label: trip.event.name }),
      people: byPerson.get('event') ?? [],
      groups: byGroup.get('event') ?? [],
      canAddGroup: true,
    });
  }
  if (trip.destination) {
    sections.push({
      id: 'destination',
      icon: MapPin,
      title: fmt(trip.planning ? c.sectionPlanners : c.sectionDestination, { label: trip.destination }),
      people: byPerson.get('destination') ?? [],
      groups: byGroup.get('destination') ?? [],
      canAddGroup: true,
    });
  }
  const nearby = byPerson.get('nearby') ?? [];
  const nearbyGroups = byGroup.get('nearby') ?? [];
  if (nearby.length || nearbyGroups.length) {
    sections.push({
      id: 'nearby',
      icon: Compass,
      title: c.sectionNearby,
      people: nearby,
      groups: nearbyGroups,
      canAddGroup: false,
    });
  }
  return sections;
}

export default function TripHubScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const api = useApi();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [people, setPeople] = useState<TripPerson[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    Promise.all([api.getTrip(id), api.getTripPeople(id), api.getTripGroups(id)])
      .then(([t, p, g]) => {
        setTrip(t.trip);
        setPeople(p.people ?? []);
        setGroups(g.groups ?? []);
        // Visiting the hub marks its matches as seen (clears the Discover badge).
        api.markRead(`hub#${id}`).catch(() => {});
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const sections = useMemo(
    () => (trip ? buildSections(trip, people, groups) : []),
    [trip, people, groups]
  );

  const sayHi = async (person: TripPerson) => {
    try { await api.sayHi(person.userId); } catch { /* ignore */ }
    navigate(`/chat/${person.userId}`);
  };

  const addGroup = (ctx: SectionId) =>
    navigate(`/trips/${id}/groups/new${ctx !== 'nearby' ? `?context=${ctx}` : ''}`);

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
            <div className="flex items-center gap-2">
              <p className="font-bold text-white text-base truncate" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {trip?.label ?? c.title}
              </p>
              {trip?.planning && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: 'rgba(125,211,252,0.18)', color: '#7dd3fc' }}
                >
                  {content.trips.planningBadge}
                </span>
              )}
            </div>
            <button onClick={() => navigate(`/trips/new?edit=${id}`)} className="text-xs" style={{ color: '#7dd3fc' }}>
              {c.editTrip}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4" style={{ paddingBottom: 'calc(84px + env(safe-area-inset-bottom))' }}>
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="text-4xl anim-float-plane">✈️</div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{cp.loading}</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <div className="text-4xl">😕</div>
            <p className="font-bold text-white">{cp.errorTitle}</p>
          </div>
        )}

        {!loading && !error && sections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <div className="text-5xl">🧭</div>
            <p className="text-sm px-6" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.noSections}</p>
          </div>
        )}

        {!loading && !error && sections.map((s) => {
          const Icon = s.icon;
          const empty = s.people.length === 0 && s.groups.length === 0;
          return (
            <div key={s.id} className="flex flex-col gap-2.5">
              {/* Section header */}
              <div className="flex items-center gap-2 px-1">
                <Icon size={16} style={{ color: '#7dd3fc' }} />
                <p className="flex-1 font-bold text-white text-sm truncate" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {s.title}
                </p>
                {s.canAddGroup && (
                  <button
                    onClick={() => addGroup(s.id)}
                    className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                    style={{ background: 'rgba(125,211,252,0.15)', color: '#7dd3fc', border: '1px dashed rgba(125,211,252,0.4)' }}
                  >
                    {c.sectionAddGroup}
                  </button>
                )}
              </div>
              <p className="text-xs px-1 -mt-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {s.groups.length
                  ? fmt(c.sectionCounts, { people: s.people.length, groups: s.groups.length })
                  : fmt(c.sectionPeopleOnly, { people: s.people.length })}
              </p>

              {/* Empty section — the seeding nudge */}
              {empty && (
                <GlassCard className="p-4" style={{ borderRadius: 16 }}>
                  <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                    {c.sectionEmpty}
                  </p>
                </GlassCard>
              )}

              {/* Groups of this context */}
              {s.groups.map((g) => (
                <GlassCard
                  key={g.groupId}
                  onClick={() => navigate(`/groups/${g.groupId}/chat`)}
                  className="p-3.5 flex items-center gap-3"
                  style={{ borderRadius: 16 }}
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

              {/* People of this context */}
              {s.people.map((p) => (
                <GlassCard key={p.userId} className="p-3.5 flex flex-col gap-2.5" style={{ borderRadius: 16 }}>
                  <div className="flex items-center gap-3">
                    <Avatar photo={p.photo} size={46} radius={13} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{p.name}</p>
                      {(p.trip?.label || p.tagline) && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
                          {p.trip?.label || p.tagline}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                      style={{ background: 'rgba(125,211,252,0.18)', color: '#7dd3fc' }}
                    >
                      {fmt(cp.relevant, { percent: p.relevance })}
                    </span>
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    {p.trip?.planning && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(125,211,252,0.12)', color: '#7dd3fc' }}>
                        💭 {c.planningChip}
                      </span>
                    )}
                    {p.trip?.companions?.type === 'family' && p.trip.companions.kidsAges && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                        👧 {fmt(c.kidsChip, { ages: p.trip.companions.kidsAges })}
                      </span>
                    )}
                    {p.reasons
                      .filter((r) => r !== 'planning')
                      .map((r) => (
                        <span
                          key={r}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                        >
                          {REASON_LABEL[r]}
                        </span>
                      ))}
                  </div>

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
            </div>
          );
        })}

        {/* Fallback add-group for trips with sections (always reachable) */}
        {!loading && !error && sections.length > 0 && (
          <button
            onClick={() => addGroup(sections[0].id)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold"
            style={{ background: 'rgba(125,211,252,0.15)', color: '#7dd3fc', border: '1px dashed rgba(125,211,252,0.4)' }}
          >
            <Plus size={16} /> {content.groups.emptyCta}
          </button>
        )}
      </div>
    </div>
  );
}
