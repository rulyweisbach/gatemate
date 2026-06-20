import type { Intent } from '../../types';

const intentMeta: Record<Intent, { label: string; emoji: string }> = {
  networking: { label: 'Networking', emoji: '💼' },
  friendship: { label: 'Friendship', emoji: '🤝' },
  'shared-travel': { label: 'Shared Travel', emoji: '🧳' },
  lounge: { label: 'Lounge Partner', emoji: '🛋️' },
  dating: { label: 'Dating', emoji: '💫' },
  'local-guide': { label: 'Local Guide', emoji: '🗺️' },
  'first-time': { label: 'First Flight Support', emoji: '✈️' },
};

interface IntentChipProps {
  intent: Intent;
  selected?: boolean;
  onClick?: () => void;
  readOnly?: boolean;
}

export default function IntentChip({ intent, selected, onClick, readOnly }: IntentChipProps) {
  const { label, emoji } = intentMeta[intent];
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
