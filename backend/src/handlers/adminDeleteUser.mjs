import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId, isAdmin } from '../lib/http.mjs';

const cognito = new CognitoIdentityProviderClient({});

// DELETE /admin/users/{id}?sub=<sub> — remove a user: their Cognito account,
// their profile, and any groups they own. Admin only; can't delete yourself.
export const handler = async (event) => {
  const callerSub = getUserId(event);
  if (!callerSub) return json(401, { error: 'unauthorized' });
  if (!isAdmin(event)) return json(403, { error: 'admin only' });

  const username = event.pathParameters?.id;
  const sub = event.queryStringParameters?.sub;
  if (!username) return json(400, { error: 'missing user id' });
  if (sub && sub === callerSub) return json(400, { error: 'you cannot remove your own admin account' });

  // Remove the Cognito account.
  await cognito.send(
    new AdminDeleteUserCommand({ UserPoolId: process.env.USER_POOL_ID, Username: username })
  );

  if (sub) {
    // Remove their profile.
    await ddb.send(new DeleteCommand({ TableName: TABLES.users, Key: { userId: sub } }));
    // Remove groups they own.
    const owned = await ddb.send(
      new QueryCommand({
        TableName: TABLES.groups,
        IndexName: 'owner-index',
        KeyConditionExpression: 'ownerId = :o',
        ExpressionAttributeValues: { ':o': sub },
      })
    );
    await Promise.all(
      (owned.Items ?? []).map((g) =>
        ddb.send(new DeleteCommand({ TableName: TABLES.groups, Key: { groupId: g.groupId } }))
      )
    );
  }

  return json(200, { ok: true });
};
