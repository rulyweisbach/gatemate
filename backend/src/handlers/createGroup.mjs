import { randomUUID } from 'node:crypto';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../lib/dynamo.mjs';
import { json, getUserId, getClaims, parseBody } from '../lib/http.mjs';
import { buildGroupContext, CONTEXT_TYPES } from '../lib/context.mjs';

const CATEGORIES = ['concert', 'sport', 'travel', 'cab', 'family', 'other'];

// POST /groups — create a group; the owner is auto-added as the first member.
export const handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const body = parseBody(event);
  if (!body) return json(400, { error: 'invalid json' });

  const title = (body.title || '').toString().trim();
  if (!title) return json(400, { error: 'title is required' });

  const category = CATEGORIES.includes(body.category) ? body.category : 'other';
  let maxMembers = parseInt(body.maxMembers, 10);
  if (!Number.isFinite(maxMembers)) maxMembers = 5;
  maxMembers = Math.min(Math.max(maxMembers, 2), 20);

  const claims = getClaims(event);
  const owner = {
    userId,
    name: claims.name || claims.email || 'Traveler',
    photo: claims.picture || '',
  };

  // A group lives in a shared CONTEXT (flight / event / destination) derived
  // from the creator's trip, so everyone whose trip hits that context sees it.
  // tripId is kept only as provenance.
  const tripId = (event.pathParameters?.id || body.tripId || '').toString().trim();
  let context = null;
  if (tripId) {
    const tripRes = await ddb.send(new GetCommand({ TableName: TABLES.trips, Key: { tripId } }));
    const trip = tripRes.Item;
    if (!trip) return json(404, { error: 'trip not found' });
    if (trip.userId !== userId) return json(403, { error: 'not your trip' });
    const wanted = CONTEXT_TYPES.includes(body.contextType) ? body.contextType : null;
    context =
      (wanted && buildGroupContext(wanted, trip)) ||
      // Default to the most specific context the trip has.
      buildGroupContext('flight', trip) ||
      buildGroupContext('event', trip) ||
      buildGroupContext('destination', trip);
    if (!context) return json(400, { error: 'trip has no context to attach the group to' });
  }

  const group = {
    groupId: randomUUID(),
    ownerId: userId,
    ownerName: owner.name,
    tripId,
    context,
    title: title.slice(0, 80),
    description: (body.description || '').toString().slice(0, 500),
    category,
    date: (body.date || '').toString().slice(0, 40),
    location: (body.location || '').toString().slice(0, 80),
    maxMembers,
    members: [owner],
    createdAt: Date.now(),
  };

  await ddb.send(new PutCommand({ TableName: TABLES.groups, Item: group }));
  return json(201, { group });
};
