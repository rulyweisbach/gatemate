import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';

// GET /groups/{id}/messages — group chat history (members only).
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const id = event.pathParameters?.id;
  if (!id) return json(400, { error: 'missing id' });

  const { Item: group } = await ddb.send(
    new GetCommand({ TableName: TABLES.groups, Key: { groupId: id } })
  );
  if (!group) return json(404, { error: 'not found' });
  if (!(group.members ?? []).some((m) => m.userId === userId)) {
    return json(403, { error: 'join the group to see its chat' });
  }

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLES.messages,
      KeyConditionExpression: 'conversationId = :c',
      ExpressionAttributeValues: { ':c': `group#${id}` },
      ScanIndexForward: true,
    })
  );
  return json(200, { messages: res.Items ?? [] });
};
