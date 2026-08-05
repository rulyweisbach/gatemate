# Editing GateMate's text (for content editors)

All user-facing wording lives in **`strings.json`** in this folder. You can
change any text without touching code.

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
