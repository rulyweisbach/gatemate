import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';

// GET /trips/{id}/groups?q=&category= — groups created for this trip.
export const handler = async (event) => {
  if (!getUserId(event)) return json(401, { error: 'unauthorized' });

  const { id } = event.pathParameters ?? {};
  const q = (event.queryStringParameters?.q || '').toLowerCase().trim();
  const category = event.queryStringParameters?.category;

  const res = await ddb.send(new ScanCommand({ TableName: TABLES.groups }));
  let groups = (res.Items ?? []).filter((g) => g.tripId === id);

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
