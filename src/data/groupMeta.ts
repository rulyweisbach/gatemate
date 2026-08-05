import type { GroupCategory } from '../types';
import { content } from '../content';

// Group category labels/emojis come from the central content file.
export const groupCategoryMeta = content.groupCategories as Record<
  GroupCategory,
  { label: string; emoji: string }
>;

export const GROUP_CATEGORIES = Object.keys(groupCategoryMeta) as GroupCategory[];
