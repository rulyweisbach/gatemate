// Central place for ALL user-facing copy.
//
// Content editors: edit `strings.json` in this folder — it's plain text,
// grouped by screen. Change the wording between the quotes, commit to Git,
// and the next build shows your new text. Keep the "keys" (the words before
// each colon) and any {placeholders} unchanged.
import strings from './strings.json';
import interestOptions from './interestOptions.json';

export const content = strings;
export { interestOptions };

export interface LookingForOption {
  id: string;
  label: string;
  emoji: string;
}

// Flat `id -> { label, emoji }` map covering every "looking for" option across
// all modes/event types, plus the legacy intents. Used to render an intent chip
// from just its id anywhere in the app (feed, profile, edit-profile).
export const lookingForMeta: Record<string, { label: string; emoji: string }> = (() => {
  const map: Record<string, { label: string; emoji: string }> = {};
  for (const [id, meta] of Object.entries(strings.intents)) map[id] = meta;
  const add = (opts: LookingForOption[]) => {
    for (const o of opts) map[o.id] = { label: o.label, emoji: o.emoji };
  };
  add(interestOptions.flight.options);
  add(interestOptions.date.options);
  for (const t of interestOptions.event.types) add(t.options);
  return map;
})();

// Fill {placeholders} in a string, e.g. fmt("Hi {name}", { name: "Maya" }).
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] !== undefined ? String(vars[key]) : `{${key}}`
  );
}
