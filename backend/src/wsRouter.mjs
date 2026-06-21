// Single Lambda handling all WebSocket routes ($connect / $disconnect /
// sendMessage), dispatched by routeKey.
import { PutCommand, DeleteCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { ddb, TABLES, conversationId } from './lib/dynamo.mjs';

export const handler = async (event) => {
  const { routeKey, connectionId, domainName, stage } = event.requestContext;

  if (routeKey === '$connect') {
    const userId = event.requestContext.authorizer?.userId;
    await ddb.send(new PutCommand({
      TableName: TABLES.ws,
      Item: { connectionId, userId, connectedAt: Date.now() },
    }));
    return { statusCode: 200 };
  }

  if (routeKey === '$disconnect') {
    await ddb.send(new DeleteCommand({
      TableName: TABLES.ws,
      Key: { connectionId },
    }));
    return { statusCode: 200 };
  }

  if (routeKey === 'sendMessage') {
    // Resolve the sender from their stored connection.
    const { Item: conn } = await ddb.send(new GetCommand({
      TableName: TABLES.ws,
      Key: { connectionId },
    }));
    const senderId = conn?.userId;
    if (!senderId) return { statusCode: 401 };

    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400 }; }
    const to = (body.to || '').toString();
    const text = (body.text || '').toString().trim();
    if (!to || !text) return { statusCode: 400 };
    if (text.length > 2000) return { statusCode: 400 };

    const sentAt = Date.now();
    const message = {
      conversationId: conversationId(senderId, to),
      sentAt,
      messageId: `${sentAt}-${Math.round(Math.random() * 1e6)}`,
      senderId,
      recipientId: to,
      text,
    };

    // Persist the message.
    await ddb.send(new PutCommand({ TableName: TABLES.messages, Item: message }));

    // Push to all live connections of both participants (multi-device).
    const mgmt = new ApiGatewayManagementApiClient({
      endpoint: `https://${domainName}/${stage}`,
    });

    const targets = await Promise.all([to, senderId].map((uid) =>
      ddb.send(new QueryCommand({
        TableName: TABLES.ws,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :u',
        ExpressionAttributeValues: { ':u': uid },
      }))
    ));

    const connectionIds = targets.flatMap((r) => (r.Items ?? []).map((i) => i.connectionId));
    await Promise.all(connectionIds.map(async (cid) => {
      try {
        await mgmt.send(new PostToConnectionCommand({
          ConnectionId: cid,
          Data: Buffer.from(JSON.stringify({ type: 'message', message })),
        }));
      } catch (e) {
        // Stale connection — clean it up.
        if (e?.$metadata?.httpStatusCode === 410) {
          await ddb.send(new DeleteCommand({ TableName: TABLES.ws, Key: { connectionId: cid } }));
        }
      }
    }));

    return { statusCode: 200 };
  }

  return { statusCode: 200 };
};
