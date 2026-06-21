// REQUEST authorizer for the WebSocket $connect route.
// Validates the Cognito ID token passed as ?token=... using the official
// aws-jwt-verify library (never hand-roll JWT verification).
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID,
  tokenUse: 'id',
  clientId: process.env.USER_POOL_CLIENT_ID,
});

const policy = (effect, resource, principalId, context) => ({
  principalId,
  policyDocument: {
    Version: '2012-10-17',
    Statement: [{ Action: 'execute-api:Invoke', Effect: effect, Resource: resource }],
  },
  context,
});

export const handler = async (event) => {
  const token = event.queryStringParameters?.token;
  if (!token) return policy('Deny', event.methodArn, 'anonymous');
  try {
    const payload = await verifier.verify(token);
    return policy('Allow', event.methodArn, payload.sub, { userId: payload.sub });
  } catch {
    return policy('Deny', event.methodArn, 'anonymous');
  }
};
