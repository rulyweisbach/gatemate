import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId, getClaims } from '../lib/http.mjs';

// GET /me — return the caller's profile, or a stub built from their
// identity-provider claims if they haven't completed onboarding yet.
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const { Item } = await ddb.send(
    new GetCommand({ TableName: TABLES.users, Key: { userId } })
  );

  if (!Item) {
    const claims = getClaims(event);
    return json(200, {
      isNew: true,
      profile: {
        userId,
        email: claims.email,
        name: claims.name || claims.given_name || '',
        photo: claims.picture || '',
        verified: claims.email_verified === 'true',
      },
    });
  }

  return json(200, { isNew: false, profile: Item });
};
