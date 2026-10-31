import { GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';
import { tripStatus } from '../lib/trip.mjs';

// GET /users/{id} — fetch a single public profile, plus the person's current
// and upcoming trips (people can have several; past trips stay private).
export const handler = async (event) => {
  if (!getUserId(event)) return json(401, { error: 'unauthorized' });

  const id = event.pathParameters?.id;
  if (!id) return json(400, { error: 'missing id' });

  const { Item } = await ddb.send(
    new GetCommand({ TableName: TABLES.users, Key: { userId: id } })
  );
  if (!Item) return json(404, { error: 'not found' });

  const todayIso = new Date().toISOString().slice(0, 10);
  const scan = await ddb.send(
    new ScanCommand({
      TableName: TABLES.trips,
      FilterExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': id },
    })
  );
  const trips = (scan.Items ?? [])
    .filter((t) => tripStatus(t, todayIso) !== 'past')
    .sort((a, b) => (a.travelDate || '9999').localeCompare(b.travelDate || '9999'))
    .map((t) => ({
      tripId: t.tripId,
      label: t.label,
      destination: t.destination || '',
      travelDate: t.travelDate || '',
      returnDate: t.returnDate || '',
      flightNumber: t.flightNumber || '',
      planning: t.planning === true,
      event: t.event ?? null,
    }));

  return json(200, { profile: Item, trips });
};
