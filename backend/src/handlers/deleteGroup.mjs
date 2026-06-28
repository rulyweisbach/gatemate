import { GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';

// DELETE /groups/{id} — owner-only delete.
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const id = event.pathParameters?.id;
  if (!id) return json(400, { error: 'missing id' });

  const { Item: group } = await ddb.send(
    new GetCommand({ TableName: TABLES.groups, Key: { groupId: id } })
  );
  if (!group) return json(404, { error: 'not found' });
  if (group.ownerId !== userId) return json(403, { error: 'only the owner can delete this group' });

  await ddb.send(new DeleteCommand({ TableName: TABLES.groups, Key: { groupId: id } }));
  return json(200, { ok: true });
};
