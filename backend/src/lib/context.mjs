// Shared-context model. A trip derives the contexts its owner belongs to
// (their flight, their event, their destination+dates); a group is created
// IN one of those contexts, so everyone whose trip hits the same context
// sees it — regardless of who created it or from which trip.
import { eventKey, windowsOverlap } from './trip.mjs';

const lc = (s) => (s || '').toString().trim().toLowerCase();

export const CONTEXT_TYPES = ['flight', 'event', 'destination'];

// The contexts a trip belongs to, in specificity order.
export function tripContexts(trip) {
  const out = [];
  if (trip.flightNumber) {
    out.push({
      type: 'flight',
      flightNumber: trip.flightNumber,
      flightDate: trip.travelDate || '',
      label: `${trip.flightNumber}${trip.travelDate ? ` · ${trip.travelDate}` : ''}`,
    });
  }
  if (eventKey(trip.event)) {
    out.push({ type: 'event', eventKey: eventKey(trip.event), label: trip.event.name });
  }
  if (trip.destination) {
    out.push({
      type: 'destination',
      destination: trip.destination,
      from: trip.travelDate || '',
      to: trip.returnDate || trip.travelDate || '',
      label: trip.destination,
    });
  }
  return out;
}

// Build a group's stored context from the chosen type + the owner's trip.
export function buildGroupContext(type, trip) {
  const ctx = tripContexts(trip).find((c) => c.type === type);
  return ctx ?? null;
}

// Does this group's context match this trip?
export function groupMatchesTrip(group, trip) {
  const ctx = group.context;
  if (!ctx) return group.tripId === trip.tripId; // legacy trip-scoped group
  switch (ctx.type) {
    case 'flight':
      return (
        !!trip.flightNumber &&
        trip.flightNumber === ctx.flightNumber &&
        // Same flight number on a different day is a different plane.
        (!ctx.flightDate || !trip.travelDate || ctx.flightDate === trip.travelDate)
      );
    case 'event':
      return !!eventKey(trip.event) && eventKey(trip.event) === ctx.eventKey;
    case 'destination': {
      if (!trip.destination || lc(trip.destination) !== lc(ctx.destination)) return false;
      // Overlapping stays only — if either side has no dates, be inclusive.
      if (!ctx.from || !trip.travelDate) return true;
      return windowsOverlap(
        { travelDate: trip.travelDate, returnDate: trip.returnDate },
        { travelDate: ctx.from, returnDate: ctx.to }
      );
    }
    default:
      return false;
  }
}

// Sanitize a raw context object (e.g. from the migration script or admin).
export function normalizeContext(raw) {
  if (!raw || !CONTEXT_TYPES.includes(raw.type)) return null;
  const label = (raw.label || '').toString().slice(0, 80);
  if (raw.type === 'flight') {
    const flightNumber = (raw.flightNumber || '').toString().trim().toUpperCase().slice(0, 10);
    if (!flightNumber) return null;
    return { type: 'flight', flightNumber, flightDate: (raw.flightDate || '').toString().slice(0, 10), label };
  }
  if (raw.type === 'event') {
    const key = (raw.eventKey || '').toString().trim().toLowerCase().slice(0, 100);
    if (!key) return null;
    return { type: 'event', eventKey: key, label };
  }
  const destination = (raw.destination || '').toString().trim().slice(0, 60);
  if (!destination) return null;
  return {
    type: 'destination',
    destination,
    from: (raw.from || '').toString().slice(0, 10),
    to: (raw.to || '').toString().slice(0, 10),
    label: label || destination,
  };
}
