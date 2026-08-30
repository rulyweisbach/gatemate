import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId, parseBody } from '../lib/http.mjs';
import { normalizeTrip, tripLabel } from '../lib/trip.mjs';

// PUT /trips/{id} — edit a trip (owner only).
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const { id } = event.pathParameters ?? {};
  const body = parseBody(event);
  if (!body) return json(400, { error: 'invalid json' });

  const cur = await ddb.send(new GetCommand({ TableName: TABLES.trips, Key: { tripId: id } }));
  if (!cur.Item) return json(404, { error: 'trip not found' });
  if (cur.Item.userId !== userId) return json(403, { error: 'not your trip' });

  const t = normalizeTrip(body);
  if (!t.flightNumber && !t.destination) {
    return json(400, { error: 'a flight number or a destination is required' });
  }

  const trip = {
    ...cur.Item,
    ...t,
    label: tripLabel(t),
    tripId: id,
    userId,
    createdAt: cur.Item.createdAt,
  };

  await ddb.send(new PutCommand({ TableName: TABLES.trips, Item: trip }));
  return json(200, { trip });
};
