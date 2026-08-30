// Central place for ALL user-facing copy.
//
// Content editors have two ways to change text:
//  1. Edit `strings.json` in this folder and commit to Git (the defaults).
//  2. Use the in-app Admin → Texts / Options screens — those store overrides
//     in the backend, which are deep-merged over the defaults at app startup
//     (see applyContentOverrides below). Overrides win.
import strings from './strings.json';
import interestOptions from './interestOptions.json';
import { API_URL } from '../auth/authConfig';

export const content = strings;
export { interestOptions };

export interface LookingForOption {
  id: string;
  label: string;
  emoji: string;
}

const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

// Deep-merge overrides into the live content object IN PLACE, so every
// module-scope `const c = content.xyz` reference picks the new values up.
// Arrays are replaced wholesale (they represent ordered option lists).
function mergeInto(target: Record<string, unknown>, src: Record<string, unknown>) {
  for (const [k, v] of Object.entries(src)) {
    if (BAD_KEYS.has(k)) continue;
    const cur = target[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && cur && typeof cur === 'object' && !Array.isArray(cur)) {
      mergeInto(cur as Record<string, unknown>, v as Record<string, unknown>);
    } else if (typeof v === 'string' || Array.isArray(v) || (v && typeof v === 'object')) {
      target[k] = v;
    }
  }
}

export function applyContentOverrides(overrides: unknown) {
  if (overrides && typeof overrides === 'object' && !Array.isArray(overrides)) {
    mergeInto(content as unknown as Record<string, unknown>, overrides as Record<string, unknown>);
  }
}

// Fetch admin-edited overrides before the app renders. Fails soft: on any
// error (offline, cold start, timeout) the bundled defaults are used.
export async function loadContentOverrides(timeoutMs = 2500): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/content`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return;
    const body = await res.json();
    if (body?.strings) applyContentOverrides(body.strings);
  } catch {
    /* bundled defaults it is */
  }
}

function buildLookingForMeta(): Record<string, { label: string; emoji: string }> {
  const map: Record<string, { label: string; emoji: string }> = {};
  const add = (opts: LookingForOption[]) => {
    for (const o of opts) map[o.id] = { label: o.label, emoji: o.emoji };
  };
  add(interestOptions.flight.options);
  add(interestOptions.date.options);
  for (const t of interestOptions.event.types) add(t.options);
  // Last so the admin-editable intents map wins over the legacy option lists.
  for (const [id, meta] of Object.entries(content.intents)) map[id] = meta;
  return map;
}

// Flat `id -> { label, emoji }` map covering every "looking for" option.
// A Proxy so it always reflects the LIVE content (including admin overrides
// applied after this module was imported).
export const lookingForMeta: Record<string, { label: string; emoji: string }> = new Proxy(
  {},
  {
    get: (_t, prop: string) => buildLookingForMeta()[prop],
    has: (_t, prop: string) => prop in buildLookingForMeta(),
    ownKeys: () => Reflect.ownKeys(buildLookingForMeta()),
    getOwnPropertyDescriptor: (_t, prop: string) =>
      Object.getOwnPropertyDescriptor(buildLookingForMeta(), prop),
  }
);

// The intent options offered when creating a trip, in display order.
// Editable from Admin → Options; ids resolve to labels via content.intents.
export function tripIntentOptions(): LookingForOption[] {
  const meta = content.intents as Record<string, { label: string; emoji: string }>;
  return (content.tripIntents as string[]).map((id) => ({
    id,
    label: meta[id]?.label ?? id,
    emoji: meta[id]?.emoji ?? '🎯',
  }));
}

// Fill {placeholders} in a string, e.g. fmt("Hi {name}", { name: "Maya" }).
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] !== undefined ? String(vars[key]) : `{${key}}`
  );
}
