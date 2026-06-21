import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, conversationId } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';

// GET /messages/{otherId} — chat history between the caller and otherId,
// ordered oldest -> newest.
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const otherId = event.pathParameters?.otherId;
  if (!otherId) return json(400, { error: 'missing otherId' });

  const convo = conversationId(userId, otherId);
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLES.messages,
      KeyConditionExpression: 'conversationId = :c',
      ExpressionAttributeValues: { ':c': convo },
      ScanIndexForward: true,
    })
  );

  return json(200, { messages: res.Items ?? [] });
};
