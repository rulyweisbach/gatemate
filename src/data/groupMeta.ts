import type { GroupCategory } from '../types';

export const groupCategoryMeta: Record<GroupCategory, { label: string; emoji: string }> = {
  concert: { label: 'Concert / Show', emoji: '🎵' },
  sport: { label: 'Sport Event', emoji: '🏟️' },
  travel: { label: 'Travel Buddy', emoji: '🧳' },
  cab: { label: 'Share a Ride', emoji: '🚕' },
  family: { label: 'Family Travel', emoji: '👨‍👩‍👧‍👦' },
  other: { label: 'Other', emoji: '✨' },
};

export const GROUP_CATEGORIES = Object.keys(groupCategoryMeta) as GroupCategory[];
