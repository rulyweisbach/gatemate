import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId, isAdmin } from '../lib/http.mjs';

// DELETE /admin/groups/{id} — close any group (admin override). Admin only.
export const handler = async (event) => {
  if (!getUserId(event)) return json(401, { error: 'unauthorized' });
  if (!isAdmin(event)) return json(403, { error: 'admin only' });

  const id = event.pathParameters?.id;
  if (!id) return json(400, { error: 'missing id' });

  await ddb.send(new DeleteCommand({ TableName: TABLES.groups, Key: { groupId: id } }));
  return json(200, { ok: true });
};
