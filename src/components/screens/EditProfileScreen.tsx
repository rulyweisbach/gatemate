import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, LogOut, Trash2, UsersRound } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { useApi } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { Intent, Group } from '../../types';
import { cognitoLogoutUrl } from '../../auth/authConfig';
import { groupCategoryMeta } from '../../data/groupMeta';
import { content, fmt } from '../../content';
import GlassButton from '../ui/GlassButton';
import IntentChip from '../ui/IntentChip';

const c = content.editProfile;

const MAX_PHOTOS = 6;
const ALL_INTENTS: Intent[] = [
  'networking', 'friendship', 'shared-travel', 'lounge', 'dating', 'local-guide', 'first-time',
];
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function EditProfileScreen() {
  const navigate = useNavigate();
  const auth = useAuth();
  const api = useApi();
  const fileInput = useRef<HTMLInputElement>(null);
  const setMyProfile = useAppStore((s) => s.setMyProfile);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [photos, setPhotos] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [intents, setIntents] = useState<Intent[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const myId = auth.user?.profile?.sub;

  // Clear the locally stored OIDC session BEFORE the Cognito logout redirect —
  // otherwise the app finds the old token in localStorage and stays signed in.
  const logOut = async () => {
    await auth.removeUser().catch(() => {});
    window.location.href = cognitoLogoutUrl();
  };

  // Load groups I own.
  const loadMyGroups = () => {
    api.listGroups()
      .then((r) => setMyGroups((r.groups ?? []).filter((g) => g.ownerId === myId)))
      .catch(() => {});
  };
  useEffect(loadMyGroups, []); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteGroup = async (id: string) => {
    if (!confirm(c.confirmDeleteGroup)) return;
    try {
      await api.deleteGroup(id);
      setMyGroups((g) => g.filter((x) => x.groupId !== id));
    } catch { /* ignore */ }
  };

  // Prefill from the saved profile.
  useEffect(() => {
    let cancelled = false;
    api.getMe()
      .then(({ profile }) => {
        if (cancelled || !profile) return;
        setPhotos(profile.photos ?? (profile.photo && /^https?:/.test(profile.photo) ? [profile.photo] : []));
        setName(profile.name ?? (auth.user?.profile?.name as string) ?? '');
        setAge(profile.age ? String(profile.age) : '');
        setTagline(profile.tagline ?? '');
        setBio(profile.bio ?? '');
        setIntents(profile.intents ?? []);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePick = () => {
    if (photos.length >= MAX_PHOTOS || uploading) return;
    fileInput.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(c.badImageType);
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError(c.imageTooLarge);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const url = await api.uploadPhoto(file);
      setPhotos((p) => [...p, url].slice(0, MAX_PHOTOS));
    } catch (err) {
      setError(err instanceof Error ? err.message : c.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const toggleIntent = (it: Intent) =>
    setIntents((cur) => (cur.includes(it) ? cur.filter((x) => x !== it) : [...cur, it]));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { profile } = await api.updateMe({
        name: name.trim() || undefined,
        age: age ? Number(age) : undefined,
        tagline: tagline.trim() || undefined,
        bio: bio.trim() || undefined,
        photos,
        photo: photos[0], // keep the single-photo field in sync for avatars
        intents,
      });
      setMyProfile(profile); // refresh cached avatar app-wide
      navigate(-1);
    } catch (err) {
      setError(err instanceof Error ? err.message : c.saveError);
      setSaving(false);
    }
  };

  // Build 6 grid cells: filled photos first, then a single "add" tile.
  const cells = Array.from({ length: MAX_PHOTOS }, (_, i) => photos[i] ?? null);

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
        <span className="flex-1 font-bold text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>
          {c.header}
        </span>
        <button
          onClick={() => void logOut()}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}
        >
          <LogOut size={13} /> {content.common.logOut}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="text-4xl anim-float-plane">✈️</div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.loading}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 px-5 py-5 pb-28">
          {/* Photos */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {c.photos} <span style={{ color: 'rgba(255,255,255,0.35)' }}>({photos.length}/{MAX_PHOTOS})</span>
            </p>
            <div className="grid grid-cols-3 gap-3">
              {cells.map((photo, i) =>
                photo ? (
                  <div
                    key={i}
                    className="relative overflow-hidden"
                    style={{ aspectRatio: '3 / 4', borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    <img src={photo} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {i === 0 && (
                      <span
                        className="absolute bottom-1 left-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(125,211,252,0.85)', color: '#0b1a3b' }}
                      >
                        {c.main}
                      </span>
                    )}
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 flex items-center justify-center rounded-full"
                      style={{ width: 22, height: 22, background: 'rgba(11,26,59,0.7)', border: '1px solid rgba(255,255,255,0.3)' }}
                      aria-label="Remove photo"
                    >
                      <X size={13} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    key={i}
                    onClick={handlePick}
                    disabled={uploading || photos.length >= MAX_PHOTOS || i !== photos.length}
                    className="flex items-center justify-center"
                    style={{
                      aspectRatio: '3 / 4',
                      borderRadius: 16,
                      background: 'rgba(255,255,255,0.07)',
                      border: '1.5px dashed rgba(255,255,255,0.25)',
                      cursor: i === photos.length ? 'pointer' : 'default',
                      opacity: i === photos.length ? 1 : 0.4,
                    }}
                    aria-label="Add photo"
                  >
                    {i === photos.length && uploading ? (
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{c.uploading}</span>
                    ) : (
                      <Plus size={22} style={{ color: 'rgba(255,255,255,0.5)' }} />
                    )}
                  </button>
                )
              )}
            </div>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} hidden />
            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {c.photosHint}
            </p>
          </div>

          {/* Basic fields */}
          <div className="flex flex-col gap-3">
            <Field label={c.nameLabel}>
              <input className="glass-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} placeholder={c.namePlaceholder} />
            </Field>
            <Field label={c.ageLabel}>
              <input className="glass-input" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 2))} inputMode="numeric" placeholder={c.agePlaceholder} />
            </Field>
            <Field label={c.taglineLabel}>
              <input className="glass-input" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={60} placeholder={c.taglinePlaceholder} />
            </Field>
            <Field label={fmt(c.bioLabel, { count: bio.length })}>
              <textarea
                className="glass-input"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 300))}
                rows={4}
                placeholder={c.bioPlaceholder}
                style={{ resize: 'none', lineHeight: 1.5 }}
              />
            </Field>
          </div>

          {/* Intents */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>{c.lookingFor}</p>
            <div className="flex flex-wrap gap-2">
              {ALL_INTENTS.map((it) => (
                <IntentChip key={it} intent={it} selected={intents.includes(it)} onClick={() => toggleIntent(it)} />
              ))}
            </div>
          </div>

          {/* My Groups */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>{c.myGroups}</p>
              <button onClick={() => navigate('/groups/new')} className="flex items-center gap-1 text-xs font-bold" style={{ color: '#7dd3fc' }}>
                <Plus size={14} /> {c.createGroup}
              </button>
            </div>
            {myGroups.length === 0 ? (
              <button
                onClick={() => navigate('/groups/new')}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px dashed rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.6)' }}
              >
                <UsersRound size={16} /> <span className="text-sm font-semibold">{c.createFirstGroup}</span>
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                {myGroups.map((g) => (
                  <div
                    key={g.groupId}
                    className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <span className="text-xl">{groupCategoryMeta[g.category].emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{g.title}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {fmt(c.joined, { count: g.members?.length ?? 0, max: g.maxMembers })}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteGroup(g.groupId)}
                      aria-label="Delete group"
                      className="flex items-center justify-center rounded-full shrink-0"
                      style={{ width: 32, height: 32, background: 'rgba(255,120,120,0.15)', border: '1px solid rgba(255,120,120,0.3)' }}
                    >
                      <Trash2 size={14} style={{ color: '#ffb4b4' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-center" style={{ color: '#ffb4b4' }}>{error}</p>}

          {/* Save (inline; the bottom nav is fixed below) */}
          <GlassButton variant="solid" onClick={handleSave} disabled={saving} style={saving ? { opacity: 0.6, cursor: 'wait' } : {}}>
            {saving ? c.saving : c.save}
          </GlassButton>
        </div>
      )}
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
