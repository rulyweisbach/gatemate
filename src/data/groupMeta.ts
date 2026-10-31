import { Music, Trophy, Backpack, CarTaxiFront, Users, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { GroupCategory } from '../types';
import { content } from '../content';

// Group category labels come from the central content file.
export const groupCategoryMeta = content.groupCategories as Record<
  GroupCategory,
  { label: string; emoji: string }
>;

// Rendered icons per category (SVG, so they draw the same on every platform —
// emoji glyphs are unreliable in webviews).
export const groupCategoryIcon: Record<GroupCategory, LucideIcon> = {
  concert: Music,
  sport: Trophy,
  travel: Backpack,
  cab: CarTaxiFront,
  family: Users,
  other: Sparkles,
};

// Only categories the backend accepts (the content file may carry extras).
export const GROUP_CATEGORIES = (Object.keys(groupCategoryMeta) as GroupCategory[]).filter(
  (c) => c in groupCategoryIcon
);
