import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, conversationId } from '../lib/dynamo.mjs';
import { json, getUserId, parseBody } from '../lib/http.mjs';

// POST /messages/{otherId}  body: { text }
// Persists a chat message. (Real-time delivery is added later via the
// WebSocket API; this REST route keeps chat functional via polling.)
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const otherId = event.pathParameters?.otherId;
  if (!otherId) return json(400, { error: 'missing otherId' });

  const body = parseBody(event);
  if (!body) return json(400, { error: 'invalid json' });
  const text = (body.text || '').toString().trim();
  if (!text) return json(400, { error: 'empty message' });
  if (text.length > 2000) return json(400, { error: 'message too long' });

  const sentAt = Date.now();
  const message = {
    conversationId: conversationId(userId, otherId),
    sentAt,
    messageId: `${sentAt}-${Math.round(Math.random() * 1e6)}`,
    senderId: userId,
    recipientId: otherId,
    text,
  };

  await ddb.send(new PutCommand({ TableName: TABLES.messages, Item: message }));
  return json(201, { message });
};
