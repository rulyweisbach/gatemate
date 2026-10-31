// Native (Capacitor) sign-in. Google blocks OAuth inside embedded webviews,
// so on iOS the Cognito Hosted UI must open in the system browser sheet and
// hand the auth code back through the gatemate:// deep link. The signed-in
// user is written to the same localStorage store the web AuthProvider reads,
// then the app reloads and react-oidc-context picks the session up.

import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { OidcClient, UserManager, User, WebStorageStateStore } from 'oidc-client-ts';
import { COGNITO } from './authConfig';

export const isNativeApp = Capacitor.isNativePlatform();

const NATIVE_CALLBACK = 'gatemate://callback';
const NATIVE_SIGNOUT = 'gatemate://signout';

const nativeSettings = {
  authority: COGNITO.authority,
  client_id: COGNITO.clientId,
  redirect_uri: NATIVE_CALLBACK,
  response_type: 'code',
  scope: 'openid email profile',
  // Signin state (PKCE verifier etc.) must survive the trip to the browser.
  stateStore: new WebStorageStateStore({ store: window.localStorage }),
};

// Same authority/client/store as the AuthProvider, so storeUser lands on the
// exact key react-oidc-context loads at startup.
const nativeUserManager = () =>
  new UserManager({
    ...nativeSettings,
    userStore: new WebStorageStateStore({ store: window.localStorage }),
  });

export async function nativeSignIn(extraQueryParams?: Record<string, string>) {
  const client = new OidcClient(nativeSettings);
  const req = await client.createSigninRequest({ request_type: 'si:r', extraQueryParams });
  await Browser.open({ url: req.url });
}

export async function nativeSignOut() {
  await nativeUserManager().removeUser().catch(() => {});
  // Also clear the Cognito session cookie in the browser sheet, otherwise the
  // next sign-in silently reuses the previous account.
  const url =
    `${COGNITO.hostedUiDomain}/logout?client_id=${COGNITO.clientId}` +
    `&logout_uri=${encodeURIComponent(NATIVE_SIGNOUT)}`;
  await Browser.open({ url });
}

async function handleUrl(url: string) {
  if (url.startsWith(NATIVE_CALLBACK)) {
    await Browser.close().catch(() => {});
    const client = new OidcClient(nativeSettings);
    const response = await client.processSigninResponse(url);
    await nativeUserManager().storeUser(new User(response));
    window.location.reload();
  } else if (url.startsWith(NATIVE_SIGNOUT)) {
    await Browser.close().catch(() => {});
    window.location.reload();
  }
}

export function initNativeAuth() {
  if (!isNativeApp) return;
  void CapApp.addListener('appUrlOpen', ({ url }) => {
    handleUrl(url).catch((e) => console.error('native auth callback failed', e));
  });
  // Cold start straight from the deep link (app was killed mid sign-in).
  void CapApp.getLaunchUrl().then((launch) => {
    if (launch?.url) handleUrl(launch.url).catch(() => {});
  });
}
