// Shared DynamoDB document client + table names.
// AWS SDK v3 is bundled in the Node.js 20 Lambda runtime — no install needed.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});

export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const TABLES = {
  users: process.env.USERS_TABLE,
  messages: process.env.MESSAGES_TABLE,
  connections: process.env.CONNECTIONS_TABLE,
  ws: process.env.WS_TABLE,
};

// A conversation id is the two user ids sorted + joined, so both
// participants resolve to the same chat thread regardless of direction.
export const conversationId = (a, b) => [a, b].sort().join('#');
