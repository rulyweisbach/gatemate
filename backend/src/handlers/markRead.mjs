import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId, parseBody } from '../lib/http.mjs';

// POST /reads { key } — record "seen up to now" on the caller's profile.
// Keys: a DM conversationId ("a#b"), "group#<groupId>", "hub#<tripId>", or
// "chats" (the Chats tab itself). Read back by GET /badges.
const KEY_RE = /^[A-Za-z0-9#_-]{1,100}$/;

export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const key = (parseBody(event)?.key ?? '').toString();
  if (!KEY_RE.test(key)) return json(400, { error: 'bad key' });

  // Ensure the map exists, then stamp the key (two steps — a map path update
  // fails when the map attribute is missing).
  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.users,
      Key: { userId },
      UpdateExpression: 'SET #reads = if_not_exists(#reads, :empty)',
      ExpressionAttributeNames: { '#reads': 'reads' },
      ExpressionAttributeValues: { ':empty': {} },
    })
  );
  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.users,
      Key: { userId },
      UpdateExpression: 'SET #reads.#k = :now',
      ExpressionAttributeNames: { '#reads': 'reads', '#k': key },
      ExpressionAttributeValues: { ':now': Date.now() },
    })
  );

  return json(200, { ok: true });
};
