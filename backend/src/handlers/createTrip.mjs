import { randomUUID } from 'node:crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId, parseBody } from '../lib/http.mjs';
import { normalizeTrip, tripLabel } from '../lib/trip.mjs';

// POST /trips — create a trip for the caller.
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const body = parseBody(event);
  if (!body) return json(400, { error: 'invalid json' });

  const t = normalizeTrip(body);
  if (!t.flightNumber && !t.destination) {
    return json(400, { error: 'a flight number or a destination is required' });
  }

  const trip = {
    tripId: randomUUID(),
    userId,
    ...t,
    label: tripLabel(t),
    createdAt: Date.now(),
  };

  await ddb.send(new PutCommand({ TableName: TABLES.trips, Item: trip }));
  return json(201, { trip });
};
