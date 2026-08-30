import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId, isAdmin } from '../lib/http.mjs';

// DELETE /admin/trips/{id} — remove any user's trip. Groups created for the
// trip stay open (close them separately from the Groups tab). Admin only.
export const handler = async (event) => {
  if (!getUserId(event)) return json(401, { error: 'unauthorized' });
  if (!isAdmin(event)) return json(403, { error: 'admin only' });

  const tripId = event.pathParameters?.id;
  if (!tripId) return json(400, { error: 'missing trip id' });

  await ddb.send(new DeleteCommand({ TableName: TABLES.trips, Key: { tripId } }));
  return json(200, { ok: true });
};
