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

      // Ask the backend for a presigned S3 URL, then PUT the file straight to S3
      // (no auth header on the S3 request — the presigned URL carries its own).
      uploadPhoto: async (file: File): Promise<string> => {
        const { uploadUrl, publicUrl } = await request('/upload-url', {
          method: 'POST',
          body: JSON.stringify({ contentType: file.type }),
        });
        const put = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'content-type': file.type },
          body: file,
        });
        if (!put.ok) throw new Error(`Upload failed (${put.status})`);
        return publicUrl as string;
      },

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
