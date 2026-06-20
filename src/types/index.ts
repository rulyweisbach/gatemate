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
