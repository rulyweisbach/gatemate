import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Calendar, MapPin, Mic, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { SearchMode, EventType } from '../../store/useAppStore';
import { content } from '../../content';
import GlassInput from '../ui/GlassInput';
import GlassButton from '../ui/GlassButton';

const c = content.flight;

// ─── Mode tab switcher ────────────────────────────────────────────────────────

const MODES: { id: SearchMode; label: string; emoji: string }[] = [
  { id: 'flight', label: c.modeFlight, emoji: '✈️' },
  { id: 'date',   label: c.modeDate,   emoji: '📅' },
  { id: 'event',  label: c.modeEvent,  emoji: '🎪' },
];

// ─── Destination options for date mode ───────────────────────────────────────

const DESTINATIONS = [
  { code: 'JFK', city: 'New York',    flag: '🇺🇸' },
  { code: 'LHR', city: 'London',      flag: '🇬🇧' },
  { code: 'CDG', city: 'Paris',       flag: '🇫🇷' },
  { code: 'DXB', city: 'Dubai',       flag: '🇦🇪' },
  { code: 'BKK', city: 'Bangkok',     flag: '🇹🇭' },
  { code: 'LAX', city: 'Los Angeles', flag: '🇺🇸' },
];

// ─── Event type options ───────────────────────────────────────────────────────

const EVENT_TYPES: { id: EventType; label: string; emoji: string }[] = [
  { id: 'concert',    label: c.eventTypeConcert,    emoji: '🎵' },
  { id: 'sport',      label: c.eventTypeSport,      emoji: '⚽' },
  { id: 'conference', label: c.eventTypeConference, emoji: '💼' },
  { id: 'other',      label: c.eventTypeOther,      emoji: '✏️' },
];

// ─── Sub-panels ──────────────────────────────────────────────────────────────

function FlightPanel() {
  const { flightNumber, flightDate, flightDestination, returnDate, setFlight } = useAppStore();

  return (
    <div className="flex flex-col gap-4">
      <GlassInput
        label={c.flightNumberLabel}
        icon={Hash}
        placeholder={c.flightNumberPlaceholder}
        value={flightNumber}
        onChange={(e) => setFlight({ flightNumber: e.target.value.toUpperCase() })}
        maxLength={10}
      />

      <GlassInput
        label={c.flightDateLabel}
        icon={Calendar}
        type="date"
        value={flightDate}
        onChange={(e) => setFlight({ flightDate: e.target.value })}
        style={{ colorScheme: 'dark' }}
      />

      <GlassInput
        label={c.flightDestinationLabel}
        icon={MapPin}
        placeholder={c.flightDestinationPlaceholder}
        value={flightDestination}
        onChange={(e) => setFlight({ flightDestination: e.target.value })}
        maxLength={60}
      />

      <GlassInput
        label={c.returnDateLabel}
        icon={RotateCcw}
        type="date"
        value={returnDate}
        min={flightDate || undefined}
        onChange={(e) => setFlight({ returnDate: e.target.value })}
        style={{ colorScheme: 'dark' }}
      />
    </div>
  );
}

function DatePanel() {
  const { searchDate, searchDestination, setDateSearch } = useAppStore();
  const [date, setDate]           = useState(searchDate || '');
  // gridDest = airport code from the preset tiles; customDest = free text
  const presetCodes = DESTINATIONS.map((d) => d.code);
  const isPreset = presetCodes.includes(searchDestination);
  const [gridDest, setGridDest]   = useState(isPreset ? searchDestination : '');
  const [customDest, setCustomDest] = useState(!isPreset ? searchDestination : '');

  const handleDate = (v: string) => {
    setDate(v);
    setDateSearch(v, gridDest || customDest);
  };

  const handleGridDest = (code: string) => {
    const next = gridDest === code ? '' : code;
    setGridDest(next);
    setCustomDest('');           // clear free text when grid tile picked
    setDateSearch(date, next);
  };

  const handleCustomDest = (v: string) => {
    setCustomDest(v);
    setGridDest('');             // deselect grid tile when typing
    setDateSearch(date, v);
  };

  const activeDest = gridDest || customDest;

  return (
    <div className="flex flex-col gap-5">
      {/* Date picker */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {c.dateLabel}
        </label>
        <div className="relative">
          <Calendar
            size={16}
            className="absolute top-1/2 -translate-y-1/2 left-4 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          />
          <input
            type="date"
            className="glass-input pl-10"
            value={date}
            onChange={(e) => handleDate(e.target.value)}
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>

      {/* Destination */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {c.destinationLabel} <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{c.optional}</span>
        </label>

        {/* Preset grid */}
        <div className="grid grid-cols-3 gap-2">
          {DESTINATIONS.map((d) => {
            const selected = gridDest === d.code;
            return (
              <button
                key={d.code}
                type="button"
                onClick={() => handleGridDest(d.code)}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-2xl transition-all"
                style={{
                  background: selected ? 'rgba(125,211,252,0.28)' : 'rgba(255,255,255,0.08)',
                  border: selected ? '1.5px solid #7dd3fc' : '1.5px solid rgba(255,255,255,0.15)',
                  boxShadow: selected ? '0 0 14px rgba(125,211,252,0.35)' : 'none',
                  opacity: customDest ? 0.4 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <span className="text-xl">{d.flag}</span>
                <span className="text-xs font-bold text-white">{d.code}</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{d.city}</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>{c.orTypeCity}</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Free-text input */}
        <div className="relative">
          <MapPin
            size={16}
            className="absolute top-1/2 -translate-y-1/2 left-4 pointer-events-none"
            style={{ color: customDest ? '#7dd3fc' : 'rgba(255,255,255,0.5)' }}
          />
          <input
            className="glass-input pl-10"
            placeholder={c.cityPlaceholder}
            value={customDest}
            onChange={(e) => handleCustomDest(e.target.value)}
            maxLength={60}
          />
        </div>
      </div>

      {/* Summary pill */}
      {(date || activeDest) && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
          style={{ background: 'rgba(125,211,252,0.12)', border: '1px solid rgba(125,211,252,0.3)' }}
        >
          <MapPin size={14} style={{ color: '#7dd3fc' }} />
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {date
              ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              : c.anyDate}
            {activeDest ? ` · TLV → ${activeDest}` : ` · ${c.allDestinations}`}
          </p>
        </div>
      )}
    </div>
  );
}

function EventPanel() {
  const { eventType, eventText, setEventSearch } = useAppStore();
  const [type, setType]   = useState<EventType>(eventType || '');
  const [text, setText]   = useState(eventText || '');

  const handleType = (t: EventType) => {
    const next = type === t ? '' : t;
    setType(next);
    setEventSearch(next, text);
  };
  const handleText = (v: string) => {
    setText(v);
    setEventSearch(type, v);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Event type chips */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {c.eventTypeLabel}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {EVENT_TYPES.map((et) => {
            const selected = type === et.id;
            return (
              <button
                key={et.id}
                type="button"
                onClick={() => handleType(et.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                style={{
                  background: selected ? 'rgba(125,211,252,0.28)' : 'rgba(255,255,255,0.08)',
                  border: selected ? '1.5px solid #7dd3fc' : '1.5px solid rgba(255,255,255,0.15)',
                  boxShadow: selected ? '0 0 14px rgba(125,211,252,0.35)' : 'none',
                }}
              >
                <span className="text-xl">{et.emoji}</span>
                <span className="text-sm font-semibold text-white">{et.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Free text — always visible, label changes with type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {type === 'concert'    ? c.eventArtist
          : type === 'sport'    ? c.eventTeam
          : type === 'conference' ? c.eventConference
          : c.eventOther}
        </label>
        <div className="relative">
          <Mic
            size={16}
            className="absolute top-1/2 -translate-y-1/2 left-4 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          />
          <input
            className="glass-input pl-10"
            placeholder={
              type === 'concert'      ? c.eventArtistPlaceholder
              : type === 'sport'     ? c.eventTeamPlaceholder
              : type === 'conference' ? c.eventConferencePlaceholder
              : c.eventOtherPlaceholder
            }
            value={text}
            onChange={(e) => handleText(e.target.value)}
            maxLength={80}
          />
        </div>
      </div>

      {/* Preview pill */}
      {(type || text) && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
          style={{ background: 'rgba(125,211,252,0.12)', border: '1px solid rgba(125,211,252,0.3)' }}
        >
          <span className="text-base">
            {EVENT_TYPES.find((e) => e.id === type)?.emoji ?? '🎪'}
          </span>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {text || EVENT_TYPES.find((e) => e.id === type)?.label || c.anyEvent}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function FlightScreen() {
  const navigate = useNavigate();
  const { searchMode, setSearchMode, flightNumber, setFlight,
          searchDate, searchDestination, eventType, eventText } = useAppStore();

  const canContinue = (() => {
    if (searchMode === 'flight') return true; // defaults fill in
    if (searchMode === 'date')   return !!(searchDate || searchDestination);
    if (searchMode === 'event')  return !!(eventType || eventText.trim());
    return false;
  })();

  const handleContinue = () => {
    if (searchMode === 'flight') {
      setFlight({ flightNumber: flightNumber || 'LY 002' });
    }
    navigate('/intent');
  };

  return (
    <div
      className="flex flex-col px-5 gap-5"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'calc(84px + env(safe-area-inset-bottom))',
      }}
    >
      {/* Mode switcher */}
      <div
        className="flex gap-2 p-1 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          animation: 'slide-up 0.4s ease-out forwards',
          animationDelay: '0.05s',
          opacity: 0,
        }}
      >
        {MODES.map((m) => {
          const active = searchMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSearchMode(m.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all text-sm font-semibold"
              style={{
                background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: active ? 'white' : 'rgba(255,255,255,0.5)',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                border: active ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent',
              }}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active panel — re-mounts on mode switch for clean state */}
      <div
        key={searchMode}
        style={{ animation: 'slide-up 0.35s ease-out forwards', opacity: 0 }}
      >
        {searchMode === 'flight' && <FlightPanel />}
        {searchMode === 'date'   && <DatePanel />}
        {searchMode === 'event'  && <EventPanel />}
      </div>

      {/* CTA — mt-auto pins it to the bottom */}
      <div
        className="mt-auto pt-4"
        style={{ animation: 'slide-up 0.5s ease-out forwards', animationDelay: '0.2s', opacity: 0 }}
      >
        <GlassButton
          variant="solid"
          onClick={handleContinue}
          disabled={!canContinue}
          style={!canContinue ? { opacity: 0.45, cursor: 'not-allowed', transform: 'none' } : {}}
        >
          {c.cta}
        </GlassButton>
      </div>
    </div>
  );
}
