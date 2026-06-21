// Cognito OIDC configuration for the SPA (public client, PKCE — no secret).
// These values are all public identifiers, safe to ship in the bundle.

import type { AuthProviderProps } from 'react-oidc-context';
import { WebStorageStateStore } from 'oidc-client-ts';

const REGION = 'il-central-1';
const USER_POOL_ID = 'il-central-1_5WqL8TYYr';

export const COGNITO = {
  authority: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`,
  clientId: 'j1mji36c25776pf7n0hcqj3lq',
  hostedUiDomain: 'https://gatemate-532993682128.auth.il-central-1.amazoncognito.com',
};

export const API_URL = 'https://1rmtytxl3l.execute-api.il-central-1.amazonaws.com';

export const oidcConfig: AuthProviderProps = {
  authority: COGNITO.authority,
  client_id: COGNITO.clientId,
  redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid email profile',
  // Persist the session across reloads.
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  // Strip the ?code=...&state=... from the URL after a successful login.
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

// Cognito Hosted UI logout (oidc-client-ts can't auto-discover this endpoint).
export const cognitoLogoutUrl = () =>
  `${COGNITO.hostedUiDomain}/logout?client_id=${COGNITO.clientId}` +
  `&logout_uri=${encodeURIComponent(window.location.origin)}`;
