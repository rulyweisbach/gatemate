import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId, isAdmin } from '../lib/http.mjs';
import { tripStatus } from '../lib/trip.mjs';

// GET /admin/trips — every trip, enriched with the owner's name/email.
// Admin only.
export const handler = async (event) => {
  if (!getUserId(event)) return json(401, { error: 'unauthorized' });
  if (!isAdmin(event)) return json(403, { error: 'admin only' });

  const [tripsScan, usersScan] = await Promise.all([
    ddb.send(new ScanCommand({ TableName: TABLES.trips })),
    ddb.send(new ScanCommand({ TableName: TABLES.users })),
  ]);

  const profiles = Object.fromEntries((usersScan.Items ?? []).map((p) => [p.userId, p]));
  const today = new Date().toISOString().slice(0, 10);

  const trips = (tripsScan.Items ?? [])
    .map((t) => ({
      ...t,
      status: tripStatus(t, today),
      ownerName: profiles[t.userId]?.name ?? null,
      ownerEmail: profiles[t.userId]?.email ?? null,
    }))
    .sort((a, b) => (b.travelDate ?? '').localeCompare(a.travelDate ?? '') || (b.createdAt ?? 0) - (a.createdAt ?? 0));

  return json(200, { trips, count: trips.length });
};
