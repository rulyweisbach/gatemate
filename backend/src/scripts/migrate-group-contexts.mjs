// One-time migration: attach a shared context to every existing group.
//
//   node scripts/migrate-group-contexts.mjs          # dry run (prints plan)
//   node scripts/migrate-group-contexts.mjs --apply  # write changes
//
// - Group with a tripId whose trip still exists -> context derived from that
//   trip (category hints which: cab -> flight, concert/sport -> event,
//   otherwise the most specific the trip has).
// - Group with no tripId, or whose trip is gone (legacy pre-redesign data) ->
//   deleted.
import { ScanCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { buildGroupContext } from '../lib/context.mjs';

const apply = process.argv.includes('--apply');

const preferredType = (category) => {
  if (category === 'cab') return 'flight';
  if (category === 'concert' || category === 'sport') return 'event';
  return 'destination';
};

const res = await ddb.send(new ScanCommand({ TableName: TABLES.groups }));
const groups = res.Items ?? [];
let migrated = 0, deleted = 0, kept = 0;

for (const g of groups) {
  if (g.context) { kept++; continue; }

  let context = null;
  if (g.tripId) {
    const tripRes = await ddb.send(new GetCommand({ TableName: TABLES.trips, Key: { tripId: g.tripId } }));
    const trip = tripRes.Item;
    if (trip) {
      context =
        buildGroupContext(preferredType(g.category), trip) ||
        buildGroupContext('flight', trip) ||
        buildGroupContext('event', trip) ||
        buildGroupContext('destination', trip);
    }
  }

  if (context) {
    console.log(`MIGRATE  ${g.groupId}  "${g.title}"  -> ${context.type}: ${context.label}`);
    if (apply) {
      await ddb.send(new UpdateCommand({
        TableName: TABLES.groups,
        Key: { groupId: g.groupId },
        UpdateExpression: 'SET #ctx = :ctx',
        ExpressionAttributeNames: { '#ctx': 'context' },
        ExpressionAttributeValues: { ':ctx': context },
      }));
    }
    migrated++;
  } else {
    console.log(`DELETE   ${g.groupId}  "${g.title}"  (no trip/context — legacy)`);
    if (apply) {
      await ddb.send(new DeleteCommand({ TableName: TABLES.groups, Key: { groupId: g.groupId } }));
    }
    deleted++;
  }
}

console.log(`\n${apply ? 'Applied' : 'Dry run'}: ${migrated} migrated, ${deleted} deleted, ${kept} already had a context.`);
