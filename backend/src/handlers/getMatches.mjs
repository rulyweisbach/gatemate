import { QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';

// GET /matches — people the caller has connected with (said hi / started a
// conversation), newest first, enriched with their profile.
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLES.connections,
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': userId },
    })
  );
  const conns = res.Items ?? [];
  if (!conns.length) return json(200, { matches: [] });

  // Fetch each connected user's profile.
  const profiles = await Promise.all(
    conns.map((c) =>
      ddb
        .send(new GetCommand({ TableName: TABLES.users, Key: { userId: c.otherUserId } }))
        .then((r) => r.Item)
        .catch(() => null)
    )
  );

  const matches = conns
    .map((c, i) => {
      const p = profiles[i];
      return {
        userId: c.otherUserId,
        connectedAt: c.createdAt ?? 0,
        initiatedByMe: c.initiatedBy === userId,
        name: p?.name ?? 'Traveler',
        photo: p?.photos?.[0] ?? p?.photo ?? '',
        tagline: p?.tagline ?? '',
      };
    })
    .sort((a, b) => (b.connectedAt || 0) - (a.connectedAt || 0));

  return json(200, { matches });
};
