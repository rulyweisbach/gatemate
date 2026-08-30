import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useApi } from '../../api/client';
import { content, applyContentOverrides } from '../../content';

const c = content.admin;

// Sections that aren't free-text copy (edited in the Options tab or fixed).
const HIDDEN_KEYS = new Set(['_readme', 'tripIntents']);

type Tree = Record<string, unknown>;

function setDeep(obj: Tree, path: string[], value: string) {
  let cur: Tree = obj;
  for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]] as Tree;
  cur[path[path.length - 1]] = value;
}

function getDeep(obj: Tree, path: string[]): string {
  let cur: unknown = obj;
  for (const p of path) cur = (cur as Tree)?.[p];
  return typeof cur === 'string' ? cur : '';
}

// Recursively render inputs for every string leaf under `node`.
function Leaves({ node, path, draft, onChange }: {
  node: Tree;
  path: string[];
  draft: Tree;
  onChange: (path: string[], v: string) => void;
}) {
  return (
    <>
      {Object.entries(node).map(([key, val]) => {
        const p = [...path, key];
        if (typeof val === 'string') {
          const long = val.length > 60;
          return (
            <div key={p.join('.')} className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {p.slice(1).join(' · ')}
              </label>
              {long ? (
                <textarea
                  className="glass-input"
                  rows={2}
                  value={getDeep(draft, p)}
                  onChange={(e) => onChange(p, e.target.value)}
                  style={{ resize: 'none', lineHeight: 1.4, fontSize: 13 }}
                />
              ) : (
                <input
                  className="glass-input"
                  value={getDeep(draft, p)}
                  onChange={(e) => onChange(p, e.target.value)}
                  style={{ fontSize: 13, padding: '10px 14px' }}
                />
              )}
            </div>
          );
        }
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          return <Leaves key={p.join('.')} node={val as Tree} path={p} draft={draft} onChange={onChange} />;
        }
        return null; // arrays (option lists) are edited in the Options tab
      })}
    </>
  );
}

export default function AdminTextsTab() {
  const api = useApi();
  // Deep copy of the LIVE content (defaults + any current overrides).
  const [draft, setDraft] = useState<Tree>(() => JSON.parse(JSON.stringify(content)));
  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const sections = useMemo(
    () => Object.keys(draft).filter((k) => !HIDDEN_KEYS.has(k) && typeof draft[k] === 'object'),
    [draft]
  );

  const onChange = (path: string[], v: string) => {
    setDraft((cur) => {
      const next = { ...cur };
      setDeep(next, path, v);
      return next;
    });
    setNote(null);
  };

  const save = async () => {
    setSaving(true);
    setNote(null);
    try {
      const { _readme, ...toStore } = draft as Tree & { _readme?: string };
      void _readme;
      await api.adminUpdateContent(toStore);
      applyContentOverrides(toStore); // this device sees it immediately
      setNote(c.savedContent);
    } catch (e) {
      setNote(e instanceof Error ? e.message : c.saveContentError);
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!confirm(c.confirmResetContent)) return;
    setSaving(true);
    try {
      await api.adminUpdateContent(null);
      setNote(c.savedContent);
    } catch (e) {
      setNote(e instanceof Error ? e.message : c.saveContentError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs px-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.textsHint}</p>

      {sections.map((sec) => {
        const isOpen = open === sec;
        return (
          <div key={sec} className="glass rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : sec)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <span className="font-bold text-white text-sm capitalize">{sec}</span>
              {isOpen ? <ChevronDown size={16} style={{ color: '#7dd3fc' }} /> : <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />}
            </button>
            {isOpen && (
              <div className="flex flex-col gap-3 px-4 pb-4">
                <Leaves node={draft[sec] as Tree} path={[sec]} draft={draft} onChange={onChange} />
              </div>
            )}
          </div>
        );
      })}

      {note && <p className="text-xs text-center" style={{ color: note === c.savedContent ? '#7df5c0' : '#ffb4b4' }}>{note}</p>}

      <button onClick={save} disabled={saving} className="btn-solid" style={saving ? { opacity: 0.6 } : {}}>
        {saving ? c.savingContent : c.saveContent}
      </button>
      <button
        onClick={reset}
        disabled={saving}
        className="text-xs font-bold py-2.5 rounded-full"
        style={{ background: 'rgba(255,120,120,0.12)', color: '#ffb4b4', border: '1px solid rgba(255,120,120,0.3)' }}
      >
        {c.resetContent}
      </button>
    </div>
  );
}
