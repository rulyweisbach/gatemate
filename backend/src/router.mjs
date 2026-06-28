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
import { handler as createGroup } from './handlers/createGroup.mjs';
import { handler as listGroups } from './handlers/listGroups.mjs';
import { handler as joinGroup } from './handlers/joinGroup.mjs';
import { handler as leaveGroup } from './handlers/leaveGroup.mjs';
import { handler as deleteGroup } from './handlers/deleteGroup.mjs';
import { handler as getGroup } from './handlers/getGroup.mjs';
import { handler as getGroupMessages } from './handlers/getGroupMessages.mjs';
import { handler as sendGroupMessage } from './handlers/sendGroupMessage.mjs';
import { json } from './lib/http.mjs';

const routes = [
  { method: 'GET',    re: /^\/me$/,                       fn: getMe,       params: [] },
  { method: 'PUT',    re: /^\/me$/,                       fn: updateMe,    params: [] },
  { method: 'GET',    re: /^\/feed$/,                     fn: getFeed,     params: [] },
  { method: 'GET',    re: /^\/users\/([^/]+)$/,           fn: getUser,     params: ['id'] },
  { method: 'POST',   re: /^\/connections\/([^/]+)$/,     fn: sayHi,       params: ['id'] },
  { method: 'GET',    re: /^\/messages\/([^/]+)$/,        fn: getMessages, params: ['otherId'] },
  { method: 'POST',   re: /^\/messages\/([^/]+)$/,        fn: sendMessage, params: ['otherId'] },
  { method: 'POST',   re: /^\/upload-url$/,               fn: uploadUrl,   params: [] },
  { method: 'POST',   re: /^\/groups$/,                   fn: createGroup, params: [] },
  { method: 'GET',    re: /^\/groups$/,                   fn: listGroups,  params: [] },
  { method: 'POST',   re: /^\/groups\/([^/]+)\/join$/,     fn: joinGroup,        params: ['id'] },
  { method: 'POST',   re: /^\/groups\/([^/]+)\/leave$/,    fn: leaveGroup,       params: ['id'] },
  { method: 'GET',    re: /^\/groups\/([^/]+)\/messages$/, fn: getGroupMessages, params: ['id'] },
  { method: 'POST',   re: /^\/groups\/([^/]+)\/messages$/, fn: sendGroupMessage, params: ['id'] },
  { method: 'GET',    re: /^\/groups\/([^/]+)$/,           fn: getGroup,         params: ['id'] },
  { method: 'DELETE', re: /^\/groups\/([^/]+)$/,           fn: deleteGroup,      params: ['id'] },
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
