import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json } from '../lib/http.mjs';

// GET /content — public: the admin-edited content overrides (app copy and
// travel options). The app deep-merges these over the bundled defaults at
// startup. Same data ships in the public JS bundle, so no auth needed.
export const handler = async () => {
  const { Item } = await ddb.send(
    new GetCommand({ TableName: TABLES.content, Key: { contentId: 'overrides' } })
  );
  return json(200, { strings: Item?.strings ?? null, updatedAt: Item?.updatedAt ?? null });
};
