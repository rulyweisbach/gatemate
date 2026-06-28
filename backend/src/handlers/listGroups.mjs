import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';

// GET /groups?q=&category= — all groups, newest first, with optional
// text search (title/description/location) and category filter.
export const handler = async (event) => {
  if (!getUserId(event)) return json(401, { error: 'unauthorized' });

  const q = (event.queryStringParameters?.q || '').toLowerCase().trim();
  const category = event.queryStringParameters?.category;

  const res = await ddb.send(new ScanCommand({ TableName: TABLES.groups }));
  let groups = res.Items ?? [];

  if (category) groups = groups.filter((g) => g.category === category);
  if (q) {
    groups = groups.filter((g) =>
      [g.title, g.description, g.location, g.ownerName]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(q))
    );
  }
  groups.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return json(200, { groups, count: groups.length });
};
