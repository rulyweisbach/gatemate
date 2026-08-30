import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';
import { tripStatus } from '../lib/trip.mjs';

// GET /trips/{id} — one trip (owner only).
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const { id } = event.pathParameters ?? {};
  const res = await ddb.send(new GetCommand({ TableName: TABLES.trips, Key: { tripId: id } }));
  const trip = res.Item;
  if (!trip) return json(404, { error: 'trip not found' });
  if (trip.userId !== userId) return json(403, { error: 'not your trip' });

  const today = new Date().toISOString().slice(0, 10);
  return json(200, { trip: { ...trip, status: tripStatus(trip, today) } });
};
