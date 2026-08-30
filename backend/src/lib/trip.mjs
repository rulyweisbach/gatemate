// Shared trip helpers: normalization, display label, status, and the
// people-matching score used by GET /trips/{id}/people.

export const EVENT_TYPES = ['concert', 'sport', 'conference', 'other'];

const lc = (s) => (s || '').toString().trim().toLowerCase();

// Stable key for an event so two travelers going to the same thing match,
// e.g. { type:'concert', name:'Celine Dion' } -> "concert#celine dion".
export const eventKey = (event) =>
  event && event.type && event.name ? `${lc(event.type)}#${lc(event.name)}` : '';

// Normalize a raw request body into a stored trip shape (no ids/timestamps).
export function normalizeTrip(body) {
  const flightNumber = (body.flightNumber || '').toString().trim().toUpperCase().slice(0, 10);
  const destination = (body.destination || '').toString().trim().slice(0, 60);
  const travelDate = (body.travelDate || '').toString().trim().slice(0, 10); // YYYY-MM-DD
  const returnDate = (body.returnDate || '').toString().trim().slice(0, 10);
  const origin = (body.origin || 'TLV').toString().trim().slice(0, 40);

  let event = null;
  if (body.event && EVENT_TYPES.includes(lc(body.event.type)) && (body.event.name || '').toString().trim()) {
    event = { type: lc(body.event.type), name: body.event.name.toString().trim().slice(0, 80) };
  }

  const intents = Array.isArray(body.intents)
    ? body.intents.filter((i) => typeof i === 'string').slice(0, 12)
    : [];

  return { flightNumber, destination, travelDate, returnDate, origin, event, intents };
}

// Short human label, e.g. "Paris · Sep 12 · LY325 · Celine Dion".
export function tripLabel(t) {
  const parts = [];
  if (t.destination) parts.push(t.destination);
  if (t.travelDate) {
    const d = new Date(t.travelDate + 'T00:00:00');
    if (!isNaN(d)) parts.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  if (t.flightNumber) parts.push(t.flightNumber);
  if (t.event?.name) parts.push(t.event.name);
  return parts.join(' · ') || 'My trip';
}

// active / upcoming / past, derived from the travel window at read time.
export function tripStatus(t, todayIso) {
  const end = t.returnDate || t.travelDate;
  const start = t.travelDate;
  if (!start && !end) return 'active'; // dateless (flight-only, no date) — treat as active
  if (end && end < todayIso) return 'past';
  if (start && start > todayIso) return 'upcoming';
  return 'active';
}

const daysApart = (a, b) => {
  if (!a || !b) return Infinity;
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  if (isNaN(da) || isNaN(db)) return Infinity;
  return Math.abs((da - db) / 86400000);
};

// Score how relevant `other` is to `mine`. Returns { score, reasons }.
// Reason keys map to peopleFeed.matchReason* strings on the client.
export function scoreMatch(mine, other) {
  const reasons = [];
  let score = 0;

  if (mine.flightNumber && other.flightNumber && mine.flightNumber === other.flightNumber) {
    score += 100; reasons.push('sameFlight');
  }
  if (eventKey(mine.event) && eventKey(mine.event) === eventKey(other.event)) {
    score += 60; reasons.push('sameEvent');
  }
  if (mine.travelDate && other.travelDate && mine.travelDate === other.travelDate) {
    score += 40; reasons.push('sameDate');
  }
  if (mine.destination && other.destination && lc(mine.destination) === lc(other.destination)) {
    score += 30; reasons.push('sameDestination');
  }
  // Nearby: same origin airport, or travel dates within 2 days, when nothing
  // stronger already matched.
  if (!reasons.length) {
    const closeDates = daysApart(mine.travelDate, other.travelDate) <= 2;
    const sameOrigin = mine.origin && other.origin && lc(mine.origin) === lc(other.origin);
    if (closeDates || sameOrigin) { score += 10; reasons.push('nearby'); }
  }

  return { score, reasons };
}
