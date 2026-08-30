import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId, isAdmin } from '../lib/http.mjs';

// DELETE /admin/groups/{id}/members/{memberId} — admin removes any member
// from any group. The owner can't be removed — close the group instead.
export const handler = async (event) => {
  if (!getUserId(event)) return json(401, { error: 'unauthorized' });
  if (!isAdmin(event)) return json(403, { error: 'admin only' });

  const id = event.pathParameters?.id;
  const memberId = event.pathParameters?.memberId;
  if (!id || !memberId) return json(400, { error: 'missing id' });

  const { Item: group } = await ddb.send(
    new GetCommand({ TableName: TABLES.groups, Key: { groupId: id } })
  );
  if (!group) return json(404, { error: 'not found' });
  if (memberId === group.ownerId) {
    return json(400, { error: 'the owner cannot be removed — close the group instead' });
  }

  const members = (group.members ?? []).filter((m) => m.userId !== memberId);
  const { Attributes } = await ddb.send(
    new UpdateCommand({
      TableName: TABLES.groups,
      Key: { groupId: id },
      UpdateExpression: 'SET #members = :m',
      ExpressionAttributeNames: { '#members': 'members' },
      ExpressionAttributeValues: { ':m': members },
      ReturnValues: 'ALL_NEW',
    })
  );
  return json(200, { group: Attributes });
};
