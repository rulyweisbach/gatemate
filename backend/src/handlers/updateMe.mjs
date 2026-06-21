import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId, getClaims, parseBody } from '../lib/http.mjs';

// Fields a user may set on their own profile.
const ALLOWED = [
  'name', 'age', 'intents', 'tagline', 'bio',
  'flight', 'gate', 'departure', 'origin', 'destination', 'photo',
];

// PUT /me — upsert the caller's profile (partial update).
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const body = parseBody(event);
  if (!body) return json(400, { error: 'invalid json' });

  const claims = getClaims(event);

  // Build a dynamic update expression. All attribute names go through
  // ExpressionAttributeNames to avoid DynamoDB reserved-word collisions.
  const names = {};
  const values = { ':email': claims.email ?? null, ':updatedAt': Date.now() };
  const sets = ['#email = :email', '#updatedAt = :updatedAt'];
  names['#email'] = 'email';
  names['#updatedAt'] = 'updatedAt';

  for (const key of ALLOWED) {
    if (body[key] !== undefined) {
      names[`#${key}`] = key;
      values[`:${key}`] = body[key];
      sets.push(`#${key} = :${key}`);
    }
  }

  const { Attributes } = await ddb.send(
    new UpdateCommand({
      TableName: TABLES.users,
      Key: { userId },
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    })
  );

  return json(200, { profile: Attributes });
};
