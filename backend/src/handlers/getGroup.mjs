import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';

// GET /groups/{id} — single group (for the chat header + membership check).
export const handler = async (event) => {
  if (!getUserId(event)) return json(401, { error: 'unauthorized' });
  const id = event.pathParameters?.id;
  if (!id) return json(400, { error: 'missing id' });

  const { Item } = await ddb.send(
    new GetCommand({ TableName: TABLES.groups, Key: { groupId: id } })
  );
  if (!Item) return json(404, { error: 'not found' });
  return json(200, { group: Item });
};
