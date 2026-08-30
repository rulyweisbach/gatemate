import { PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId, isAdmin, parseBody } from '../lib/http.mjs';

const MAX_BYTES = 300_000;
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

// Only plain string/array/object values, and no prototype-polluting keys.
const sanitize = (val, depth = 0) => {
  if (depth > 8) return undefined;
  if (typeof val === 'string') return val.slice(0, 2000);
  if (Array.isArray(val)) return val.map((v) => sanitize(v, depth + 1)).filter((v) => v !== undefined);
  if (val && typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      if (BAD_KEYS.has(k)) continue;
      const s = sanitize(v, depth + 1);
      if (s !== undefined) out[k] = s;
    }
    return out;
  }
  return undefined; // numbers/booleans/functions have no place in copy text
};

// PUT /admin/content — store the edited content (full strings object).
// Send { strings: null } to reset everything back to the bundled defaults.
export const handler = async (event) => {
  if (!getUserId(event)) return json(401, { error: 'unauthorized' });
  if (!isAdmin(event)) return json(403, { error: 'admin only' });

  const body = parseBody(event);

  if (body?.strings === null) {
    await ddb.send(new DeleteCommand({ TableName: TABLES.content, Key: { contentId: 'overrides' } }));
    return json(200, { ok: true, reset: true });
  }

  if (!body?.strings || typeof body.strings !== 'object' || Array.isArray(body.strings)) {
    return json(400, { error: 'strings must be an object' });
  }
  const strings = sanitize(body.strings);
  if (JSON.stringify(strings).length > MAX_BYTES) {
    return json(400, { error: 'content too large' });
  }

  const updatedAt = Date.now();
  await ddb.send(
    new PutCommand({
      TableName: TABLES.content,
      Item: { contentId: 'overrides', strings, updatedAt, updatedBy: getUserId(event) },
    })
  );
  return json(200, { ok: true, updatedAt });
};
