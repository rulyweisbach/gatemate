import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';

// POST /groups/{id}/leave — leave a group. The owner can't leave (they
// delete the group instead).
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const id = event.pathParameters?.id;
  if (!id) return json(400, { error: 'missing id' });

  const { Item: group } = await ddb.send(
    new GetCommand({ TableName: TABLES.groups, Key: { groupId: id } })
  );
  if (!group) return json(404, { error: 'not found' });
  if (group.ownerId === userId) {
    return json(400, { error: 'owner cannot leave — delete the group instead' });
  }

  const members = (group.members ?? []).filter((m) => m.userId !== userId);
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
