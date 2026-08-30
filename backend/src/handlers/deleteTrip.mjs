import { GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';

// DELETE /trips/{id} — remove a trip (owner only). Groups created for the trip
// are left intact (they carry their own ownership).
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const { id } = event.pathParameters ?? {};
  const cur = await ddb.send(new GetCommand({ TableName: TABLES.trips, Key: { tripId: id } }));
  if (!cur.Item) return json(404, { error: 'trip not found' });
  if (cur.Item.userId !== userId) return json(403, { error: 'not your trip' });

  await ddb.send(new DeleteCommand({ TableName: TABLES.trips, Key: { tripId: id } }));
  return json(200, { ok: true });
};
