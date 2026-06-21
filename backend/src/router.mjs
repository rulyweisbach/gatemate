// Single Lambda entrypoint behind the HTTP API's $default route.
// API Gateway validates the Cognito JWT (via the JWT authorizer) before
// invoking this; we just dispatch by method + path. Path params are parsed
// here since the catch-all route has no path template.
import { handler as getMe } from './handlers/getMe.mjs';
import { handler as updateMe } from './handlers/updateMe.mjs';
import { handler as getFeed } from './handlers/getFeed.mjs';
import { handler as getUser } from './handlers/getUser.mjs';
import { handler as sayHi } from './handlers/sayHi.mjs';
import { handler as getMessages } from './handlers/getMessages.mjs';
import { handler as sendMessage } from './handlers/sendMessage.mjs';
import { handler as uploadUrl } from './handlers/uploadUrl.mjs';
import { json } from './lib/http.mjs';

const routes = [
  { method: 'GET',  re: /^\/me$/,                   fn: getMe,       params: [] },
  { method: 'PUT',  re: /^\/me$/,                   fn: updateMe,    params: [] },
  { method: 'GET',  re: /^\/feed$/,                 fn: getFeed,     params: [] },
  { method: 'GET',  re: /^\/users\/([^/]+)$/,       fn: getUser,     params: ['id'] },
  { method: 'POST', re: /^\/connections\/([^/]+)$/, fn: sayHi,       params: ['id'] },
  { method: 'GET',  re: /^\/messages\/([^/]+)$/,    fn: getMessages, params: ['otherId'] },
  { method: 'POST', re: /^\/messages\/([^/]+)$/,    fn: sendMessage, params: ['otherId'] },
  { method: 'POST', re: /^\/upload-url$/,           fn: uploadUrl,   params: [] },
];

export const handler = async (event) => {
  const method = event.requestContext?.http?.method;
  const path = event.rawPath || event.requestContext?.http?.path || '';

  for (const r of routes) {
    if (r.method !== method) continue;
    const m = path.match(r.re);
    if (!m) continue;
    const pathParameters = {};
    r.params.forEach((name, i) => {
      pathParameters[name] = decodeURIComponent(m[i + 1]);
    });
    return r.fn({ ...event, pathParameters });
  }

  return json(404, { error: 'route not found', method, path });
};
