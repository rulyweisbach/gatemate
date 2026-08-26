# Editing GateMate's text (for content editors)

Two files in this folder hold the wording — you can change both without
touching code:

- **`strings.json`** — all the general screen text.
- **`interestOptions.json`** — the *"What are you looking for?"* options on the
  Interest screen (see the section at the bottom of this guide).

## How to change text

1. Open `src/content/strings.json` on GitHub (or in an editor).
2. Find the text you want to change. It's grouped by screen
   (`onboard`, `flight`, `feed`, `groups`, `admin`, …).
3. Edit the words **inside the quotes**, to the right of the colon.

   ```json
   "getStarted": "Get Started"      ←  change "Get Started" to anything
   ```

4. Commit your change. The next build automatically shows the new text —
   no developer needed.

## Rules to keep it working

- **Only change the text inside the quotes.** Don't change the words before
  the colon (those are "keys" the app looks up).
- **Keep `{placeholders}` exactly as they are.** Things like `{name}`,
  `{count}`, `{max}` get filled in automatically (e.g. `"Message {name}…"`
  becomes `"Message Maya…"`). You can move them around in the sentence, but
  don't rename or delete them.
- **Keep the quotes and commas.** Every value needs `"quotes"` around it, and
  a comma after it (except the last one in a group).
- Emojis are fine to add or change (e.g. the labels under `intents` and
  `groupCategories` include an emoji).

## Tip

If a build ever fails after an edit, it's almost always a missing comma or a
missing quote. Compare your change to the line above it — they should look the
same except for the words you changed.

## The "What are you looking for?" options (`interestOptions.json`)

On the Interest screen, after a traveler picks **By Flight**, **By Date** or
**By Event**, they see a list of "looking for" chips. Those come from
`interestOptions.json`, and each search mode can have its own list.

Each option looks like:

```json
{ "id": "networking", "label": "Networking", "emoji": "🤝" }
```

- **`label`** and **`emoji`** — what the traveler sees. Change these freely.
- **`id`** — an internal tag used to match people. Two rules:
  1. Keep it lowercase with dashes, no spaces (e.g. `share-taxi`).
  2. **Reuse the same `id` when two options mean the same thing** across modes
     (e.g. `networking` appears under By Flight, By Date and Conference). People
     who pick the same `id` can be matched together. Give a genuinely new option
     a brand-new `id`.

### By Flight / By Date

Add, remove or reorder items in the `options` list:

```json
"flight": {
  "options": [
    { "id": "networking",    "label": "Networking",     "emoji": "🤝" },
    { "id": "lounge-meeting", "label": "Lounge meeting", "emoji": "🛋️" }
  ]
}
```

### By Event

Each event type (Concert, Sport game, …) has its **own** details box and its
**own** options:

```json
{
  "id": "concert",
  "label": "Concert",
  "emoji": "🎵",
  "detailsLabel": "Artist or venue",
  "detailsPlaceholder": "e.g. Coldplay at Wembley",
  "options": [
    { "id": "travel-together", "label": "Travel together",  "emoji": "🧳" },
    { "id": "share-hotel",     "label": "Share hotel room", "emoji": "🏨" }
  ]
}
```

- **`label`** — the button shown in the event-type grid.
- **`detailsLabel`** — the little heading above the text box that appears once
  this type is picked (e.g. *"Artist or venue"*).
- **`detailsPlaceholder`** — the grey example text inside that box.
- **`options`** — the "looking for" chips shown for this event type.

You can add a whole new event type by copying one of the four blocks and
changing its values (give it a unique `id` like `festival`).
