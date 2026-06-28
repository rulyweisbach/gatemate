import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId, isAdmin } from '../lib/http.mjs';

// GET /admin/groups — all groups with owner + member info. Admin only.
export const handler = async (event) => {
  if (!getUserId(event)) return json(401, { error: 'unauthorized' });
  if (!isAdmin(event)) return json(403, { error: 'admin only' });

  const res = await ddb.send(new ScanCommand({ TableName: TABLES.groups }));
  const groups = (res.Items ?? []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return json(200, { groups, count: groups.length });
};
