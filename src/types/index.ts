export type Intent =
  | 'networking'
  | 'friendship'
  | 'shared-travel'
  | 'lounge'
  | 'dating'
  | 'local-guide'
  | 'first-time';

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
  intents?: Intent[];
  flight?: string;
  gate?: string;
  departure?: string;
  origin?: string;
  destination?: string;
  distance?: string;
  mutualConnections?: number;
}

// Chat message as returned by the backend.
export interface ApiMessage {
  conversationId: string;
  sentAt: number;
  messageId: string;
  senderId: string;
  recipientId: string;
  text: string;
}
