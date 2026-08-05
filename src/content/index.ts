// Central place for ALL user-facing copy.
//
// Content editors: edit `strings.json` in this folder — it's plain text,
// grouped by screen. Change the wording between the quotes, commit to Git,
// and the next build shows your new text. Keep the "keys" (the words before
// each colon) and any {placeholders} unchanged.
import strings from './strings.json';

export const content = strings;

// Fill {placeholders} in a string, e.g. fmt("Hi {name}", { name: "Maya" }).
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] !== undefined ? String(vars[key]) : `{${key}}`
  );
}
