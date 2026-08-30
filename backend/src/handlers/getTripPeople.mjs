import { GetCommand, ScanCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';
import { scoreMatch } from '../lib/trip.mjs';

// GET /trips/{id}/people?filter=sameFlight|sameDate|sameEvent|nearby
// Travelers whose own trips overlap with this trip, scored by relevance.
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const { id } = event.pathParameters ?? {};
  const filter = event.queryStringParameters?.filter;

  const mineRes = await ddb.send(new GetCommand({ TableName: TABLES.trips, Key: { tripId: id } }));
  const mine = mineRes.Item;
  if (!mine) return json(404, { error: 'trip not found' });
  if (mine.userId !== userId) return json(403, { error: 'not your trip' });

  // Small scale (≈100 users) — a scan of the trips table is cheap and avoids
  // maintaining several match GSIs.
  const scan = await ddb.send(new ScanCommand({ TableName: TABLES.trips }));
  const trips = (scan.Items ?? []).filter((t) => t.userId && t.userId !== userId);

  // Best-scoring trip per other traveler.
  const best = new Map(); // userId -> { score, reasons }
  for (const t of trips) {
    const { score, reasons } = scoreMatch(mine, t);
    if (score <= 0) continue;
    if (filter && !reasons.includes(filter)) continue;
    const prev = best.get(t.userId);
    if (!prev || score > prev.score) best.set(t.userId, { score, reasons });
  }

  const ids = [...best.keys()];
  if (!ids.length) return json(200, { people: [], count: 0 });

  // Fetch matched travelers' profiles (BatchGet in chunks of 100).
  const profiles = new Map();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const res = await ddb.send(
      new BatchGetCommand({
        RequestItems: { [TABLES.users]: { Keys: chunk.map((uid) => ({ userId: uid })) } },
      })
    );
    for (const p of res.Responses?.[TABLES.users] ?? []) profiles.set(p.userId, p);
  }

  const maxScore = Math.max(...[...best.values()].map((b) => b.score));
  const people = ids
    .map((uid) => {
      const p = profiles.get(uid);
      if (!p) return null;
      const { score, reasons } = best.get(uid);
      return {
        userId: uid,
        name: p.name,
        photo: p.photos?.[0] ?? p.photo,
        tagline: p.tagline,
        intents: p.intents ?? [],
        reasons,
        relevance: Math.round((score / (maxScore || 1)) * 100),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.relevance - a.relevance);

  return json(200, { people, count: people.length });
};
