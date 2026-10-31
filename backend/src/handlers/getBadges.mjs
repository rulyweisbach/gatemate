import { BatchGetCommand, GetCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, conversationId } from '../lib/dynamo.mjs';
import { json, getUserId } from '../lib/http.mjs';
import { scoreMatch } from '../lib/trip.mjs';

// GET /badges — unread counters for the bottom nav.
// chats    = unread DMs + unread group messages + connections someone else
//            started since the caller last opened the Chats tab.
// discover = travelers who newly match one of the caller's trips (their trip
//            was created after the caller last opened that trip's hub).
// "Last read/seen" timestamps live in the caller's profile `reads` map,
// written by POST /reads when a chat, hub, or the Chats tab is opened.
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const meRes = await ddb.send(new GetCommand({ TableName: TABLES.users, Key: { userId } }));
  const me = meRes.Item ?? {};
  const reads = me.reads ?? {};
  const wide = me.discovery !== 'focused';

  const connRes = await ddb.send(
    new QueryCommand({
      TableName: TABLES.connections,
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': userId },
    })
  );
  const conns = connRes.Items ?? [];
  const connected = new Set(conns.map((c) => c.otherUserId));

  // Messages in a conversation that arrived after the caller last read it.
  const countNew = async (convo) => {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.messages,
        KeyConditionExpression: 'conversationId = :c AND sentAt > :t',
        ExpressionAttributeValues: { ':c': convo, ':t': reads[convo] ?? 0 },
      })
    );
    return (res.Items ?? []).filter((m) => m.senderId !== userId).length;
  };

  let chats = 0;

  // New matches: someone said hi to me and I haven't opened Chats since.
  const chatsSeen = reads.chats ?? 0;
  chats += conns.filter((c) => c.initiatedBy !== userId && (c.createdAt ?? 0) > chatsSeen).length;

  for (const c of conns) {
    chats += await countNew(conversationId(userId, c.otherUserId));
  }

  const groupScan = await ddb.send(new ScanCommand({ TableName: TABLES.groups }));
  const myGroups = (groupScan.Items ?? []).filter((g) =>
    (g.members ?? []).some((m) => m.userId === userId)
  );
  for (const g of myGroups) {
    chats += await countNew(`group#${g.groupId}`);
  }

  const tripScan = await ddb.send(new ScanCommand({ TableName: TABLES.trips }));
  const allTrips = tripScan.Items ?? [];
  const myTrips = allTrips.filter((t) => t.userId === userId);
  const others = allTrips.filter(
    (t) => t.userId && t.userId !== userId && !connected.has(t.userId)
  );

  // Per trip: which travelers are new since the caller last opened that hub.
  // The trip switcher shows a dot per trip; the nav badge counts each
  // traveler once even when they match several trips.
  const newByTrip = new Map(); // tripId -> Set of userIds
  const newMatches = new Set();
  for (const mine of myTrips) {
    const seen = reads[`hub#${mine.tripId}`] ?? 0;
    const fresh = new Set();
    for (const t of others) {
      if ((t.createdAt ?? 0) <= seen || fresh.has(t.userId)) continue;
      const { score } = scoreMatch(mine, t, { wide });
      if (score > 0) fresh.add(t.userId);
    }
    if (fresh.size) newByTrip.set(mine.tripId, fresh);
    for (const u of fresh) newMatches.add(u);
  }

  // Travelers without a completed profile never appear in discovery
  // (getTripPeople filters them), so they shouldn't light the badge either.
  const named = new Set();
  const matchIds = [...newMatches];
  for (let i = 0; i < matchIds.length; i += 100) {
    const chunk = matchIds.slice(i, i + 100);
    const res = await ddb.send(
      new BatchGetCommand({
        RequestItems: { [TABLES.users]: { Keys: chunk.map((uid) => ({ userId: uid })) } },
      })
    );
    for (const p of res.Responses?.[TABLES.users] ?? []) if (p.name) named.add(p.userId);
  }

  const discover = [...newMatches].filter((u) => named.has(u)).length;
  const discoverByTrip = {};
  for (const [tripId, fresh] of newByTrip) {
    const n = [...fresh].filter((u) => named.has(u)).length;
    if (n > 0) discoverByTrip[tripId] = n;
  }

  return json(200, { chats, discover, discoverByTrip });
};
