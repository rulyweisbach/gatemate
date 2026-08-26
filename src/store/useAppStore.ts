import { create } from 'zustand';
import type { Intent, User, Message, Profile } from '../types';

export type SearchMode = 'flight' | 'date' | 'event';
export type EventType = 'concert' | 'sport' | 'conference' | 'other' | '';

interface ChatHistory {
  [userId: string]: Message[];
}

interface AppState {
  // Search mode
  searchMode: SearchMode;

  // Flight search
  flightNumber: string;
  flightDate: string;
  flightDestination: string;
  returnDate: string;

  // Date search
  searchDate: string;
  searchDestination: string;

  // Event search
  eventType: EventType;
  eventText: string;

  // Shared
  selectedIntents: Intent[];
  currentUser: User | null;
  chatHistory: ChatHistory;

  // The signed-in user's own profile (for showing their avatar app-wide).
  myProfile: Profile | null;

  // Actions
  setMyProfile: (profile: Profile | null) => void;
  setSearchMode: (mode: SearchMode) => void;
  setFlight: (patch: Partial<Pick<AppState, 'flightNumber' | 'flightDate' | 'flightDestination' | 'returnDate'>>) => void;
  setDateSearch: (date: string, destination: string) => void;
  setEventSearch: (type: EventType, text: string) => void;
  toggleIntent: (intent: Intent) => void;
  setSelectedIntents: (intents: Intent[]) => void;
  setCurrentUser: (user: User | null) => void;
  addMessage: (userId: string, message: Message) => void;
  getMessages: (userId: string) => Message[];
}

export const useAppStore = create<AppState>((set, get) => ({
  searchMode: 'flight',
  flightNumber: '',
  flightDate: '',
  flightDestination: '',
  returnDate: '',
  searchDate: '',
  searchDestination: '',
  eventType: '',
  eventText: '',
  selectedIntents: [],
  currentUser: null,
  chatHistory: {},
  myProfile: null,

  setMyProfile: (profile) => set({ myProfile: profile }),
  // Switching mode clears the "looking for" picks — options differ per mode.
  setSearchMode: (mode) => set({ searchMode: mode, selectedIntents: [] }),
  setFlight: (patch) => set(patch),
  setDateSearch: (date, destination) => set({ searchDate: date, searchDestination: destination }),
  setEventSearch: (type, text) => set({ eventType: type, eventText: text }),

  toggleIntent: (intent) =>
    set((state) => ({
      selectedIntents: state.selectedIntents.includes(intent)
        ? state.selectedIntents.filter((i) => i !== intent)
        : [...state.selectedIntents, intent],
    })),

  setSelectedIntents: (intents) => set({ selectedIntents: intents }),

  setCurrentUser: (user) => set({ currentUser: user }),

  addMessage: (userId, message) =>
    set((state) => ({
      chatHistory: {
        ...state.chatHistory,
        [userId]: [...(state.chatHistory[userId] || []), message],
      },
    })),

  getMessages: (userId) => get().chatHistory[userId] || [],
}));
