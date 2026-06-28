import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId, isAdmin } from '../lib/http.mjs';

const cognito = new CognitoIdentityProviderClient({});

// GET /admin/users — every registered Cognito user, enriched with their
// DynamoDB profile. Admin only.
export const handler = async (event) => {
  if (!getUserId(event)) return json(401, { error: 'unauthorized' });
  if (!isAdmin(event)) return json(403, { error: 'admin only' });

  const users = [];
  let token;
  do {
    const res = await cognito.send(
      new ListUsersCommand({ UserPoolId: process.env.USER_POOL_ID, Limit: 60, PaginationToken: token })
    );
    for (const u of res.Users ?? []) {
      const attrs = Object.fromEntries((u.Attributes ?? []).map((a) => [a.Name, a.Value]));
      users.push({
        username: u.Username,
        sub: attrs.sub,
        email: attrs.email,
        name: attrs.name,
        provider: attrs.identities ? 'social' : 'email',
        status: u.UserStatus,
        enabled: u.Enabled,
        createdAt: u.UserCreateDate,
      });
    }
    token = res.PaginationToken;
  } while (token);

  // Merge profile details (intents, flight, photos…) keyed by sub.
  const scan = await ddb.send(new ScanCommand({ TableName: TABLES.users }));
  const profiles = Object.fromEntries((scan.Items ?? []).map((p) => [p.userId, p]));

  const merged = users.map((u) => ({ ...u, profile: profiles[u.sub] ?? null }));
  return json(200, { users: merged, count: merged.length });
};
