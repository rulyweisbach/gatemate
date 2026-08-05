import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useAppStore } from '../../store/useAppStore';
import { useApi } from '../../api/client';
import { content } from '../../content';
import type { Intent } from '../../types';
import IntentChip from '../ui/IntentChip';
import GlassButton from '../ui/GlassButton';

const c = content.intentScreen;

const ALL_INTENTS: Intent[] = [
  'networking',
  'friendship',
  'shared-travel',
  'lounge',
  'dating',
  'local-guide',
  'first-time',
];

export default function IntentScreen() {
  const navigate = useNavigate();
  const auth = useAuth();
  const api = useApi();
  const { selectedIntents, toggleIntent, flightNumber, gate } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    setSaving(true);
    setError(null);
    try {
      // Save the caller's profile so they show up in others' feeds.
      const claims = auth.user?.profile;
      await api.updateMe({
        name: (claims?.name as string) || (claims?.email as string) || 'Traveler',
        photo: (claims?.picture as string) || '',
        flight: flightNumber || undefined,
        gate: gate || undefined,
        intents: selectedIntents,
      });
      navigate('/feed');
    } catch (e) {
      setError(e instanceof Error ? e.message : c.error);
      setSaving(false);
    }
  };

  return (
    <div
      className="flex flex-col px-5 gap-5"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Header */}
      <div className="pt-6 anim-slide-up">
        <h1
          className="text-3xl font-black text-white"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          {c.titleLine1}
          <br />
          <span style={{ color: '#7dd3fc' }}>{c.titleHighlight}</span>
        </h1>
        <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {c.subtitle}
        </p>
      </div>

      {/* Chips */}
      <div
        className="flex flex-wrap gap-3"
        style={{ animation: 'slide-up 0.5s ease-out forwards', animationDelay: '0.1s', opacity: 0 }}
      >
        {ALL_INTENTS.map((intent) => (
          <IntentChip
            key={intent}
            intent={intent}
            selected={selectedIntents.includes(intent)}
            onClick={() => toggleIntent(intent)}
          />
        ))}
      </div>

      {/* Info note */}
      <div
        className="rounded-2xl px-4 py-3"
        style={{
          background: 'rgba(125,211,252,0.1)',
          border: '1px solid rgba(125,211,252,0.25)',
          animation: 'slide-up 0.5s ease-out forwards',
          animationDelay: '0.2s',
          opacity: 0,
        }}
      >
        <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {c.note}
        </p>
      </div>

      {error && (
        <p className="text-xs text-center" style={{ color: '#ffb4b4' }}>
          {error}
        </p>
      )}

      {/* CTA */}
      <div
        className="mt-auto pt-4"
        style={{ animation: 'slide-up 0.5s ease-out forwards', animationDelay: '0.25s', opacity: 0 }}
      >
        <GlassButton
          variant="solid"
          onClick={handleContinue}
          disabled={saving}
          style={saving ? { opacity: 0.6, cursor: 'wait' } : {}}
        >
          {saving ? c.ctaSaving : c.cta}
        </GlassButton>
      </div>
    </div>
  );
}
