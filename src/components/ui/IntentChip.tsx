import type { Intent } from '../../types';
import { lookingForMeta } from '../../content';

// Intent labels/emojis come from the central content files.
const intentMeta = lookingForMeta;

interface IntentChipProps {
  intent: Intent;
  selected?: boolean;
  onClick?: () => void;
  readOnly?: boolean;
}

export default function IntentChip({ intent, selected, onClick, readOnly }: IntentChipProps) {
  const { label, emoji } = intentMeta[intent] ?? { label: intent, emoji: '🎯' };
  return (
    <button
      className={`intent-chip ${selected ? 'selected' : ''}`}
      onClick={readOnly ? undefined : onClick}
      style={readOnly ? { cursor: 'default', pointerEvents: 'none' } : {}}
      type="button"
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

export { intentMeta };
