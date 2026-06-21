// Helpers for HTTP API (API Gateway v2) Lambda handlers.

export const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
  },
  body: JSON.stringify(body),
});

// Cognito JWT authorizer puts verified claims here.
export const getUserId = (event) =>
  event.requestContext?.authorizer?.jwt?.claims?.sub;

export const getClaims = (event) =>
  event.requestContext?.authorizer?.jwt?.claims ?? {};

export const parseBody = (event) => {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return null;
  }
};
