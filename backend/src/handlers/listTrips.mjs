import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';
import { tripStatus } from '../lib/trip.mjs';

// GET /trips — the caller's own trips, tagged active / upcoming / past.
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLES.trips,
      IndexName: 'owner-index',
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': userId },
    })
  );

  const today = new Date().toISOString().slice(0, 10);
  const trips = (res.Items ?? [])
    .map((t) => ({ ...t, status: tripStatus(t, today) }))
    .sort((a, b) => (a.travelDate || '9999').localeCompare(b.travelDate || '9999') || (b.createdAt || 0) - (a.createdAt || 0));

  return json(200, { trips, count: trips.length });
};
