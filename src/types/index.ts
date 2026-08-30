// An intent / "looking for" option id. Options are content-driven
// (see src/content/interestOptions.json), so this is an open string.
export type Intent = string;

export interface User {
  id: string;
  name: string;
  age: number;
  intent: Intent;
  verified: boolean;
  photo: string;
  tagline: string;
  flight: string;
  gate: string;
  departure: string;
  destination: string;
  origin: string;
  mutualConnections: number;
  distance: string;
  bio?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

// Profile as stored/returned by the backend API (userId key, intents array).
export interface Profile {
  userId: string;
  name?: string;
  email?: string;
  photo?: string;
  verified?: boolean;
  age?: number;
  tagline?: string;
  bio?: string;
  photos?: string[];
  intents?: Intent[];
  flight?: string;
  gate?: string;
  departure?: string;
  origin?: string;
  destination?: string;
  distance?: string;
  mutualConnections?: number;
}

// ── Trips ──────────────────────────────────────────────────────────
export type TripEventType = 'concert' | 'sport' | 'conference' | 'other';
export type TripStatus = 'active' | 'upcoming' | 'past';

export interface TripEvent {
  type: TripEventType;
  name: string;
}

export interface Trip {
  tripId: string;
  userId: string;
  flightNumber?: string;
  destination?: string;
  travelDate?: string;
  returnDate?: string;
  origin?: string;
  event?: TripEvent | null;
  intents: string[];
  label: string;
  status?: TripStatus;
  createdAt?: number;
}

// A trip a user is creating/editing (no server-assigned fields yet).
export type TripInput = Omit<Trip, 'tripId' | 'userId' | 'label' | 'status' | 'createdAt'>;

// A matched traveler in a trip's People feed.
export type MatchReason = 'sameFlight' | 'sameEvent' | 'sameDate' | 'sameDestination' | 'nearby';

export interface TripPerson {
  userId: string;
  name?: string;
  photo?: string;
  tagline?: string;
  intents?: string[];
  reasons: MatchReason[];
  relevance: number;
}

export type GroupCategory = 'concert' | 'sport' | 'travel' | 'cab' | 'family' | 'other';

export interface GroupMember {
  userId: string;
  name?: string;
  photo?: string;
}

export interface Group {
  groupId: string;
  ownerId: string;
  ownerName?: string;
  tripId?: string;
  title: string;
  description?: string;
  category: GroupCategory;
  date?: string;
  location?: string;
  maxMembers: number;
  members: GroupMember[];
  createdAt: number;
}

// A person the user is connected with (for the Matches tab).
export interface Match {
  userId: string;
  name?: string;
  photo?: string;
  tagline?: string;
  connectedAt?: number;
  initiatedByMe?: boolean;
}

// Admin view of a trip (owner details merged in).
export interface AdminTrip extends Trip {
  ownerName?: string | null;
  ownerEmail?: string | null;
}

// Admin view of a registered user (Cognito + merged profile).
export interface AdminUser {
  username: string;
  sub?: string;
  email?: string;
  name?: string;
  provider?: 'social' | 'email';
  status?: string;
  enabled?: boolean;
  createdAt?: string;
  profile?: Profile | null;
}

// Chat message as returned by the backend.
export interface ApiMessage {
  conversationId: string;
  sentAt: number;
  messageId: string;
  senderId: string;
  recipientId?: string;
  senderName?: string;
  senderPhoto?: string;
  text: string;
}
