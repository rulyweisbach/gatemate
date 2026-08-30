import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plane, Hash, Calendar, MapPin, RotateCcw, ArrowLeft, Mic, Trash2 } from 'lucide-react';
import { useApi } from '../../api/client';
import { content, tripIntentOptions } from '../../content';
import type { TripEventType } from '../../types';
import GlassInput from '../ui/GlassInput';
import GlassButton from '../ui/GlassButton';
import IntentChip from '../ui/IntentChip';

const c = content.tripSetup;
const ci = content.intentScreen;

const EVENT_TYPES: { id: TripEventType; label: string }[] = [
  { id: 'concert',    label: c.eventTypeConcert },
  { id: 'sport',      label: c.eventTypeSport },
  { id: 'conference', label: c.eventTypeConference },
  { id: 'other',      label: c.eventTypeOther },
];

type Method = 'flight' | 'destination';

export default function AddTripScreen() {
  const navigate = useNavigate();
  const api = useApi();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [method, setMethod] = useState<Method>('flight');
  const [flightNumber, setFlightNumber] = useState('');
  const [destination, setDestination] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [eventType, setEventType] = useState<TripEventType | ''>('');
  const [eventName, setEventName] = useState('');
  const [intents, setIntents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleIntent = (id: string) =>
    setIntents((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  // Edit mode: prefill from the existing trip.
  useEffect(() => {
    if (!editId) return;
    api.getTrip(editId)
      .then(({ trip }) => {
        setMethod(trip.flightNumber ? 'flight' : 'destination');
        setFlightNumber(trip.flightNumber ?? '');
        setDestination(trip.destination ?? '');
        setTravelDate(trip.travelDate ?? '');
        setReturnDate(trip.returnDate ?? '');
        setEventType(trip.event?.type ?? '');
        setEventName(trip.event?.name ?? '');
        setIntents(trip.intents ?? []);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const canCreate = method === 'flight' ? !!flightNumber.trim() : !!destination.trim();

  const create = async () => {
    setSaving(true);
    setError(null);
    try {
      const input = {
        flightNumber: method === 'flight' ? flightNumber.trim().toUpperCase() : '',
        destination: destination.trim(),
        travelDate: travelDate || '',
        returnDate: returnDate || '',
        origin: 'TLV',
        event: eventType && eventName.trim() ? { type: eventType, name: eventName.trim() } : null,
        intents,
      };
      const { trip } = editId ? await api.updateTrip(editId, input) : await api.createTrip(input);
      navigate(`/trips/${trip.tripId}`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : c.error);
      setSaving(false);
    }
  };

  const removeTrip = async () => {
    if (!editId || !window.confirm(c.confirmDelete)) return;
    try {
      await api.deleteTrip(editId);
      navigate('/trips', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : c.error);
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
          aria-label={content.common.back}
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="flex-1">
          <p className="font-bold text-white text-base" style={{ fontFamily: 'Nunito, sans-serif' }}>{c.title}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.subtitle}</p>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-5 py-5" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}>
        {/* Method toggle */}
        <div
          className="flex gap-2 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          {([
            { id: 'flight' as Method, title: c.flightOptionTitle, hint: c.flightOptionHint, Icon: Plane },
            { id: 'destination' as Method, title: c.destinationOptionTitle, hint: c.destinationOptionHint, Icon: Calendar },
          ]).map((opt) => {
            const active = method === opt.id;
            const Icon = opt.Icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMethod(opt.id)}
                className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all"
                style={{
                  background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                  border: active ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent',
                  boxShadow: active ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                }}
              >
                <Icon size={20} style={{ color: active ? '#7dd3fc' : 'rgba(255,255,255,0.6)' }} />
                <span className="text-sm font-bold" style={{ color: active ? 'white' : 'rgba(255,255,255,0.6)' }}>{opt.title}</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{opt.hint}</span>
              </button>
            );
          })}
        </div>

        {/* Method inputs */}
        {method === 'flight' ? (
          <>
            <GlassInput
              label={c.flightNumberLabel}
              icon={Hash}
              placeholder={c.flightNumberPlaceholder}
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
              maxLength={10}
            />
            <GlassInput
              label={c.dateLabel}
              icon={Calendar}
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          </>
        ) : (
          <>
            <GlassInput
              label={c.destinationLabel}
              icon={MapPin}
              placeholder={c.destinationPlaceholder}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              maxLength={60}
            />
            <GlassInput
              label={c.dateLabel}
              icon={Calendar}
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          </>
        )}

        <GlassInput
          label={content.flight.returnDateLabel}
          icon={RotateCcw}
          type="date"
          value={returnDate}
          min={travelDate || undefined}
          onChange={(e) => setReturnDate(e.target.value)}
          style={{ colorScheme: 'dark' }}
        />

        {/* Optional event */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {c.eventQuestion} <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>· {c.eventOptional}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((et) => (
              <button
                key={et.id}
                type="button"
                onClick={() => setEventType(eventType === et.id ? '' : et.id)}
                className="intent-chip"
                style={eventType === et.id ? { background: 'rgba(125,211,252,0.28)', borderColor: '#7dd3fc' } : {}}
              >
                {et.label}
              </button>
            ))}
          </div>
          {eventType && (
            <div className="relative mt-1">
              <Mic size={16} className="absolute top-1/2 -translate-y-1/2 left-4 pointer-events-none" style={{ color: 'rgba(255,255,255,0.5)' }} />
              <input
                className="glass-input pl-10"
                placeholder={c.eventNamePlaceholder}
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                maxLength={80}
              />
            </div>
          )}
        </div>

        {/* Choose intent */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{ci.title}</label>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{ci.subtitle}</p>
          <div className="flex flex-wrap gap-2.5 mt-1">
            {tripIntentOptions().map((o) => (
              <IntentChip key={o.id} intent={o.id} selected={intents.includes(o.id)} onClick={() => toggleIntent(o.id)} />
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-center" style={{ color: '#ffb4b4' }}>{error}</p>}

        {editId && (
          <button
            type="button"
            onClick={removeTrip}
            className="flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-full"
            style={{ background: 'rgba(255,107,107,0.12)', color: '#ffb4b4', border: '1px solid rgba(255,107,107,0.3)' }}
          >
            <Trash2 size={14} /> {c.deleteTrip}
          </button>
        )}
      </div>

      {/* Sticky create */}
      <div
        className="fixed left-0 right-0 bottom-0 mx-auto px-5 pt-3 glass-dark"
        style={{ maxWidth: 430, borderTop: '1px solid rgba(255,255,255,0.1)', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <GlassButton
          variant="solid"
          onClick={create}
          disabled={!canCreate || saving}
          style={!canCreate || saving ? { opacity: 0.5, cursor: saving ? 'wait' : 'not-allowed' } : {}}
        >
          {saving ? ci.ctaSaving : editId ? content.common.save : ci.cta}
        </GlassButton>
      </div>
    </div>
  );
}
