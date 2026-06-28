import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId, getClaims } from '../lib/http.mjs';

// POST /groups/{id}/join — join a group (capacity-checked atomically).
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const id = event.pathParameters?.id;
  if (!id) return json(400, { error: 'missing id' });

  const { Item: group } = await ddb.send(
    new GetCommand({ TableName: TABLES.groups, Key: { groupId: id } })
  );
  if (!group) return json(404, { error: 'not found' });

  const members = group.members ?? [];
  if (members.some((m) => m.userId === userId)) return json(200, { group });
  if (members.length >= group.maxMembers) return json(409, { error: 'group is full' });

  const claims = getClaims(event);
  const member = { userId, name: claims.name || claims.email || 'Traveler', photo: claims.picture || '' };

  try {
    const { Attributes } = await ddb.send(
      new UpdateCommand({
        TableName: TABLES.groups,
        Key: { groupId: id },
        UpdateExpression: 'SET #members = list_append(#members, :m)',
        ConditionExpression: 'size(#members) < :max',
        ExpressionAttributeNames: { '#members': 'members' },
        ExpressionAttributeValues: { ':m': [member], ':max': group.maxMembers },
        ReturnValues: 'ALL_NEW',
      })
    );
    return json(200, { group: Attributes });
  } catch (e) {
    if (e.name === 'ConditionalCheckFailedException') {
      return json(409, { error: 'group is full' });
    }
    throw e;
  }
};
