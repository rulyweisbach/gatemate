import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';
import { useApi } from '../../api/client';
import type { GroupCategory } from '../../types';
import { groupCategoryMeta, GROUP_CATEGORIES } from '../../data/groupMeta';
import GlassButton from '../ui/GlassButton';

export default function CreateGroupScreen() {
  const navigate = useNavigate();
  const api = useApi();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GroupCategory>('travel');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [maxMembers, setMaxMembers] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Give your group a title');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createGroup({
        title: title.trim(),
        category,
        description: description.trim() || undefined,
        date: date || undefined,
        location: location.trim() || undefined,
        maxMembers,
      });
      navigate('/groups');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create group');
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div
        className="glass-dark sticky top-0 z-10 flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center rounded-full shrink-0"
          style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <span className="font-bold text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>Create a Group</span>
      </div>

      <div className="flex flex-col gap-5 px-5 py-5 pb-28">
        {/* Title */}
        <Field label="What's the plan?">
          <input
            className="glass-input"
            placeholder="e.g. Rock concert in LA — looking for 5"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
        </Field>

        {/* Category */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Type</label>
          <div className="flex flex-wrap gap-2">
            {GROUP_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className="intent-chip"
                style={category === c ? { background: 'rgba(125,211,252,0.28)', borderColor: '#7dd3fc' } : {}}
              >
                {groupCategoryMeta[c].emoji} {groupCategoryMeta[c].label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <Field label="Details">
          <textarea
            className="glass-input"
            placeholder="Who are you looking for and what's the plan? e.g. Sharing a cab from LAX to downtown hotels around 6pm."
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            rows={3}
            style={{ resize: 'none', lineHeight: 1.5 }}
          />
        </Field>

        {/* Date + location */}
        <Field label="Date">
          <div className="relative">
            <Calendar size={16} className="absolute top-1/2 -translate-y-1/2 left-4 pointer-events-none" style={{ color: 'rgba(255,255,255,0.5)' }} />
            <input type="date" className="glass-input pl-10" value={date} onChange={(e) => setDate(e.target.value)} style={{ colorScheme: 'dark' }} />
          </div>
        </Field>
        <Field label="Where">
          <div className="relative">
            <MapPin size={16} className="absolute top-1/2 -translate-y-1/2 left-4 pointer-events-none" style={{ color: 'rgba(255,255,255,0.5)' }} />
            <input className="glass-input pl-10" placeholder="e.g. Los Angeles, Athens, LAX" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80} />
          </div>
        </Field>

        {/* Max members */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <Users size={15} /> Group size — up to {maxMembers} people
          </label>
          <input
            type="range"
            min={2}
            max={20}
            value={maxMembers}
            onChange={(e) => setMaxMembers(Number(e.target.value))}
            style={{ accentColor: '#7dd3fc' }}
          />
          <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span>2</span><span>20</span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            You count as the first member, so {maxMembers - 1} more can join.
          </p>
        </div>

        {error && <p className="text-xs text-center" style={{ color: '#ffb4b4' }}>{error}</p>}
      </div>

      {/* Sticky create */}
      <div
        className="fixed left-0 right-0 bottom-0 mx-auto px-5 pt-3 glass-dark"
        style={{ maxWidth: 430, borderTop: '1px solid rgba(255,255,255,0.1)', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <GlassButton variant="solid" onClick={handleCreate} disabled={saving} style={saving ? { opacity: 0.6, cursor: 'wait' } : {}}>
          {saving ? 'Creating…' : 'Create Group'}
        </GlassButton>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</label>
      {children}
    </div>
  );
}
