import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';

// GET /feed?flight=LY002&intent=networking
// Returns other travelers — scoped to the same flight when provided,
// optionally filtered by intent. Excludes the caller.
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const flight = event.queryStringParameters?.flight;
  const intent = event.queryStringParameters?.intent;

  let items = [];
  if (flight) {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.users,
        IndexName: 'flight-index',
        KeyConditionExpression: '#flight = :flight',
        ExpressionAttributeNames: { '#flight': 'flight' },
        ExpressionAttributeValues: { ':flight': flight },
      })
    );
    items = res.Items ?? [];
  } else {
    const res = await ddb.send(
      new ScanCommand({ TableName: TABLES.users, Limit: 50 })
    );
    items = res.Items ?? [];
  }

  items = items.filter((u) => u.userId !== userId);
  if (intent) {
    items = items.filter((u) => Array.isArray(u.intents) && u.intents.includes(intent));
  }

  return json(200, { users: items, count: items.length });
};
