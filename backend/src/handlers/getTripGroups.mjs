import { GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';
import { groupMatchesTrip } from '../lib/context.mjs';

// GET /trips/{id}/groups?q=&category= — every group whose shared CONTEXT
// (flight / event / destination+dates) matches this trip, no matter who
// created it or from which trip.
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const { id } = event.pathParameters ?? {};
  const q = (event.queryStringParameters?.q || '').toLowerCase().trim();
  const category = event.queryStringParameters?.category;

  const tripRes = await ddb.send(new GetCommand({ TableName: TABLES.trips, Key: { tripId: id } }));
  const trip = tripRes.Item;
  if (!trip) return json(404, { error: 'trip not found' });
  if (trip.userId !== userId) return json(403, { error: 'not your trip' });

  // Small scale — a scan is cheap and avoids per-context GSIs.
  const res = await ddb.send(new ScanCommand({ TableName: TABLES.groups }));
  let groups = (res.Items ?? []).filter((g) => groupMatchesTrip(g, trip));

  if (category) groups = groups.filter((g) => g.category === category);
  if (q) {
    groups = groups.filter((g) =>
      [g.title, g.description, g.location, g.ownerName]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(q))
    );
  }
  groups.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return json(200, { groups, count: groups.length });
};
