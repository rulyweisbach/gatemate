import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';

// POST /connections/{id} — record that the caller said hi to another user.
// Writes both directions so each side sees the connection.
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const otherId = event.pathParameters?.id;
  if (!otherId) return json(400, { error: 'missing id' });
  if (otherId === userId) return json(400, { error: 'cannot connect with yourself' });

  const now = Date.now();
  await Promise.all([
    ddb.send(new PutCommand({
      TableName: TABLES.connections,
      Item: { userId, otherUserId: otherId, initiatedBy: userId, createdAt: now },
    })),
    ddb.send(new PutCommand({
      TableName: TABLES.connections,
      Item: { userId: otherId, otherUserId: userId, initiatedBy: userId, createdAt: now },
    })),
  ]);

  return json(201, { ok: true, connectedWith: otherId });
};
