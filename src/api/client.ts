// Authenticated API client. Returns helpers bound to the current Cognito
// session — the ID token is sent as a Bearer credential, which the HTTP API's
// Cognito JWT authorizer validates (audience = app client id).
import { useMemo } from 'react';
import { useAuth } from 'react-oidc-context';
import { API_URL } from '../auth/authConfig';
import type { Profile, ApiMessage } from '../types';

export function useApi() {
  const auth = useAuth();
  const token = auth.user?.id_token;

  return useMemo(() => {
    const request = async (path: string, options: RequestInit = {}) => {
      const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'content-type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers ?? {}),
        },
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`API ${res.status}: ${body || res.statusText}`);
      }
      if (res.status === 204) return null;
      return res.json();
    };

    return {
      getMe: (): Promise<{ profile: Profile; isNew: boolean }> => request('/me'),

      updateMe: (profile: Partial<Profile>): Promise<{ profile: Profile }> =>
        request('/me', { method: 'PUT', body: JSON.stringify(profile) }),

      getFeed: (flight?: string, intent?: string): Promise<{ users: Profile[]; count: number }> => {
        const qs = new URLSearchParams();
        if (flight) qs.set('flight', flight);
        if (intent) qs.set('intent', intent);
        const q = qs.toString();
        return request(`/feed${q ? `?${q}` : ''}`);
      },

      getUser: (id: string): Promise<{ profile: Profile }> => request(`/users/${id}`),

      sayHi: (id: string): Promise<{ ok: boolean }> =>
        request(`/connections/${id}`, { method: 'POST' }),

      getMessages: (otherId: string): Promise<{ messages: ApiMessage[] }> =>
        request(`/messages/${otherId}`),

      sendMessage: (otherId: string, text: string): Promise<{ message: ApiMessage }> =>
        request(`/messages/${otherId}`, { method: 'POST', body: JSON.stringify({ text }) }),
    };
  }, [token]);
}
