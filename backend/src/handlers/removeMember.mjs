import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';

// DELETE /groups/{id}/members/{memberId} — owner removes a member.
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const id = event.pathParameters?.id;
  const memberId = event.pathParameters?.memberId;
  if (!id || !memberId) return json(400, { error: 'missing id' });

  const { Item: group } = await ddb.send(
    new GetCommand({ TableName: TABLES.groups, Key: { groupId: id } })
  );
  if (!group) return json(404, { error: 'not found' });
  if (group.ownerId !== userId) return json(403, { error: 'only the group owner can remove members' });
  if (memberId === group.ownerId) {
    return json(400, { error: 'the owner cannot be removed — delete the group instead' });
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
