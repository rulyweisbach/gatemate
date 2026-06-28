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

// Admin authorization: the caller's verified email must be in the
// ADMIN_EMAILS allowlist (comma-separated). No hardcoded credentials.
export const isAdmin = (event) => {
  const email = (getClaims(event).email || '').toLowerCase();
  const allow = (process.env.ADMIN_EMAILS || '')
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return !!email && allow.includes(email);
};
