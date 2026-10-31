import { Music, Trophy, Plane, Car, Users, Sparkles, MessageCircle } from 'lucide-react';
import type { GroupCategory } from '../../types';

// Vector icon per group category — replaces the emoji glyphs, which render
// as missing-glyph boxes on some platforms and never matched the UI style.
const ICONS: Record<GroupCategory, typeof Music> = {
  concert: Music,
  sport: Trophy,
  travel: Plane,
  cab: Car,
  family: Users,
  other: Sparkles,
};

export default function GroupCategoryIcon({
  category,
  size = 18,
  color = '#7dd3fc',
}: {
  category?: GroupCategory;
  size?: number;
  color?: string;
}) {
  const Icon = (category && ICONS[category]) || MessageCircle;
  return <Icon size={size} style={{ color }} />;
}
