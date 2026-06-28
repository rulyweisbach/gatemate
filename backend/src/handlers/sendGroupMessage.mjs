import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId, getClaims, parseBody } from '../lib/http.mjs';

// POST /groups/{id}/messages  body: { text } — post to a group's chat
// (members only). Sender name/photo are denormalized onto the message so the
// UI can show who said what.
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const id = event.pathParameters?.id;
  if (!id) return json(400, { error: 'missing id' });

  const body = parseBody(event);
  if (!body) return json(400, { error: 'invalid json' });
  const text = (body.text || '').toString().trim();
  if (!text) return json(400, { error: 'empty message' });
  if (text.length > 2000) return json(400, { error: 'message too long' });

  const { Item: group } = await ddb.send(
    new GetCommand({ TableName: TABLES.groups, Key: { groupId: id } })
  );
  if (!group) return json(404, { error: 'not found' });
  const me = (group.members ?? []).find((m) => m.userId === userId);
  if (!me) return json(403, { error: 'join the group to chat' });

  const claims = getClaims(event);
  const sentAt = Date.now();
  const message = {
    conversationId: `group#${id}`,
    sentAt,
    messageId: `${sentAt}-${Math.round(Math.random() * 1e6)}`,
    senderId: userId,
    senderName: me.name || claims.name || 'Traveler',
    senderPhoto: me.photo || claims.picture || '',
    text,
  };

  await ddb.send(new PutCommand({ TableName: TABLES.messages, Item: message }));
  return json(201, { message });
};
