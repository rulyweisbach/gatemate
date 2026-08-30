// Authenticated API client. Returns helpers bound to the current Cognito
// session — the ID token is sent as a Bearer credential, which the HTTP API's
// Cognito JWT authorizer validates (audience = app client id).
import { useMemo } from 'react';
import { useAuth } from 'react-oidc-context';
import { API_URL } from '../auth/authConfig';
import type { Profile, ApiMessage, Group, AdminUser, AdminTrip, Match, Trip, TripInput, TripPerson } from '../types';

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

      getMatches: (): Promise<{ matches: Match[] }> => request('/matches'),

      // ── Trips ──
      listTrips: (): Promise<{ trips: Trip[]; count: number }> => request('/trips'),

      getTrip: (id: string): Promise<{ trip: Trip }> => request(`/trips/${id}`),

      createTrip: (trip: TripInput): Promise<{ trip: Trip }> =>
        request('/trips', { method: 'POST', body: JSON.stringify(trip) }),

      updateTrip: (id: string, trip: TripInput): Promise<{ trip: Trip }> =>
        request(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(trip) }),

      deleteTrip: (id: string): Promise<{ ok: boolean }> =>
        request(`/trips/${id}`, { method: 'DELETE' }),

      getTripPeople: (id: string, filter?: string): Promise<{ people: TripPerson[]; count: number }> => {
        const q = filter ? `?filter=${encodeURIComponent(filter)}` : '';
        return request(`/trips/${id}/people${q}`);
      },

      getTripGroups: (id: string, q?: string, category?: string): Promise<{ groups: Group[]; count: number }> => {
        const qs = new URLSearchParams();
        if (q) qs.set('q', q);
        if (category) qs.set('category', category);
        const s = qs.toString();
        return request(`/trips/${id}/groups${s ? `?${s}` : ''}`);
      },

      createTripGroup: (id: string, group: Partial<Group>): Promise<{ group: Group }> =>
        request(`/trips/${id}/groups`, { method: 'POST', body: JSON.stringify(group) }),

      // ── Groups ──
      listGroups: (q?: string, category?: string): Promise<{ groups: Group[]; count: number }> => {
        const qs = new URLSearchParams();
        if (q) qs.set('q', q);
        if (category) qs.set('category', category);
        const s = qs.toString();
        return request(`/groups${s ? `?${s}` : ''}`);
      },

      createGroup: (group: Partial<Group>): Promise<{ group: Group }> =>
        request('/groups', { method: 'POST', body: JSON.stringify(group) }),

      joinGroup: (id: string): Promise<{ group: Group }> =>
        request(`/groups/${id}/join`, { method: 'POST' }),

      leaveGroup: (id: string): Promise<{ group: Group }> =>
        request(`/groups/${id}/leave`, { method: 'POST' }),

      deleteGroup: (id: string): Promise<{ ok: boolean }> =>
        request(`/groups/${id}`, { method: 'DELETE' }),

      getGroup: (id: string): Promise<{ group: Group }> => request(`/groups/${id}`),

      getGroupMessages: (id: string): Promise<{ messages: ApiMessage[] }> =>
        request(`/groups/${id}/messages`),

      sendGroupMessage: (id: string, text: string): Promise<{ message: ApiMessage }> =>
        request(`/groups/${id}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),

      removeMember: (groupId: string, memberId: string): Promise<{ group: Group }> =>
        request(`/groups/${groupId}/members/${encodeURIComponent(memberId)}`, { method: 'DELETE' }),

      // ── Admin (server-side gated by email allowlist) ──
      adminListUsers: (): Promise<{ users: AdminUser[]; count: number }> => request('/admin/users'),

      adminDeleteUser: (username: string, sub?: string): Promise<{ ok: boolean }> =>
        request(`/admin/users/${encodeURIComponent(username)}${sub ? `?sub=${encodeURIComponent(sub)}` : ''}`, { method: 'DELETE' }),

      adminListGroups: (): Promise<{ groups: Group[]; count: number }> => request('/admin/groups'),

      adminDeleteGroup: (id: string): Promise<{ ok: boolean }> =>
        request(`/admin/groups/${id}`, { method: 'DELETE' }),

      adminRemoveMember: (groupId: string, memberId: string): Promise<{ group: Group }> =>
        request(`/admin/groups/${groupId}/members/${encodeURIComponent(memberId)}`, { method: 'DELETE' }),

      adminListTrips: (): Promise<{ trips: AdminTrip[]; count: number }> => request('/admin/trips'),

      adminDeleteTrip: (id: string): Promise<{ ok: boolean }> =>
        request(`/admin/trips/${id}`, { method: 'DELETE' }),
    };
  }, [token]);
}
