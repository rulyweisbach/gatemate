import { useState } from 'react';
import { ArrowUp, ArrowDown, X } from 'lucide-react';
import { useApi } from '../../api/client';
import { content, applyContentOverrides } from '../../content';

const c = content.admin;

interface OptionRow {
  id: string;
  label: string;
  emoji: string;
}

const slugify = (label: string) =>
  label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 30) || 'option';

export default function AdminOptionsTab() {
  const api = useApi();
  const meta = content.intents as Record<string, { label: string; emoji: string }>;

  const [rows, setRows] = useState<OptionRow[]>(() =>
    (content.tripIntents as string[]).map((id) => ({
      id,
      label: meta[id]?.label ?? id,
      emoji: meta[id]?.emoji ?? '🎯',
    }))
  );
  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎯');
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const update = (i: number, patch: Partial<OptionRow>) => {
    setRows((cur) => cur.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    setNote(null);
  };

  const move = (i: number, dir: -1 | 1) => {
    setRows((cur) => {
      const j = i + dir;
      if (j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setNote(null);
  };

  const remove = (i: number) => {
    setRows((cur) => cur.filter((_, j) => j !== i));
    setNote(null);
  };

  const add = () => {
    const label = newLabel.trim();
    if (!label) return;
    let id = slugify(label);
    // keep ids unique
    while (rows.some((r) => r.id === id)) id = `${id}-2`;
    setRows((cur) => [...cur, { id, label, emoji: newEmoji.trim() || '🎯' }]);
    setNewLabel('');
    setNewEmoji('🎯');
    setNote(null);
  };

  const save = async () => {
    setSaving(true);
    setNote(null);
    try {
      // Snapshot the LIVE content and swap in the edited options, so text
      // edits saved from the Texts tab are preserved in the same document.
      const snapshot = JSON.parse(JSON.stringify(content)) as Record<string, unknown> & {
        _readme?: string;
        intents: Record<string, { label: string; emoji: string }>;
        tripIntents: string[];
      };
      delete snapshot._readme;
      snapshot.tripIntents = rows.map((r) => r.id);
      // Update/add metadata; keep entries for removed ids so old selections
      // on existing trips still render with their label.
      for (const r of rows) snapshot.intents[r.id] = { label: r.label, emoji: r.emoji };
      await api.adminUpdateContent(snapshot);
      applyContentOverrides(snapshot);
      setNote(c.savedContent);
    } catch (e) {
      setNote(e instanceof Error ? e.message : c.saveContentError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs px-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.optionsHint}</p>

      {rows.map((r, i) => (
        <div key={r.id} className="glass rounded-2xl p-3 flex items-center gap-2">
          <div className="flex flex-col gap-1 shrink-0">
            <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" style={{ opacity: i === 0 ? 0.25 : 1 }}>
              <ArrowUp size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
            </button>
            <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move down" style={{ opacity: i === rows.length - 1 ? 0.25 : 1 }}>
              <ArrowDown size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
            </button>
          </div>
          <input
            className="glass-input text-center shrink-0"
            value={r.emoji}
            onChange={(e) => update(i, { emoji: e.target.value })}
            aria-label={c.optionEmoji}
            style={{ width: 52, padding: '10px 4px', fontSize: 16 }}
          />
          <input
            className="glass-input flex-1 min-w-0"
            value={r.label}
            onChange={(e) => update(i, { label: e.target.value })}
            aria-label={c.optionLabel}
            maxLength={30}
            style={{ fontSize: 13, padding: '10px 14px' }}
          />
          <button
            onClick={() => remove(i)}
            aria-label={`Remove ${r.label}`}
            className="flex items-center justify-center rounded-full shrink-0"
            style={{ width: 28, height: 28, background: 'rgba(255,120,120,0.15)', border: '1px solid rgba(255,120,120,0.3)' }}
          >
            <X size={13} style={{ color: '#ffb4b4' }} />
          </button>
        </div>
      ))}

      {/* Add new */}
      <div className="glass rounded-2xl p-3 flex items-center gap-2" style={{ border: '1px dashed rgba(125,211,252,0.4)' }}>
        <input
          className="glass-input text-center shrink-0"
          value={newEmoji}
          onChange={(e) => setNewEmoji(e.target.value)}
          aria-label={c.optionEmoji}
          style={{ width: 52, padding: '10px 4px', fontSize: 16 }}
        />
        <input
          className="glass-input flex-1 min-w-0"
          placeholder={c.newOptionPlaceholder}
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          maxLength={30}
          style={{ fontSize: 13, padding: '10px 14px' }}
        />
        <button
          onClick={add}
          className="text-xs font-bold px-3 py-2 rounded-full shrink-0"
          style={{ background: 'rgba(125,211,252,0.2)', color: '#7dd3fc', border: '1px solid rgba(125,211,252,0.4)' }}
        >
          {c.addOption}
        </button>
      </div>

      {note && <p className="text-xs text-center" style={{ color: note === c.savedContent ? '#7df5c0' : '#ffb4b4' }}>{note}</p>}

      <button onClick={save} disabled={saving} className="btn-solid" style={saving ? { opacity: 0.6 } : {}}>
        {saving ? c.savingContent : c.saveContent}
      </button>
    </div>
  );
}
