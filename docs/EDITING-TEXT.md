# ✍️ How to change text in GateMate

This guide is for the content editor. You can change any wording in the app
right from the GitHub website — no software to install, no coding. Every change
you make is **reviewed and approved** before it goes live, so you can't break
anything.

All the app's text lives in one file:
**`src/content/strings.json`**

---

## One-time setup

Ask Ruly to invite you to the repository as a collaborator. You'll get an email
invitation from GitHub — accept it. That's it.

---

## Making a text change (step by step)

1. **Open the file**
   Go to
   [`src/content/strings.json`](https://github.com/rulyweisbach/gatemate/blob/main/src/content/strings.json).

2. **Click the pencil ✏️ icon** (top-right of the file) to edit.

3. **Find and change the text.**
   The file is organized by screen (`onboard`, `flight`, `groups`, …).
   Change only the words **inside the quotes**, after the colon:

   ```json
   "getStarted": "Get Started"
   ```
   →
   ```json
   "getStarted": "Let's go!"
   ```

   ⚠️ **Keep these unchanged:**
   - the words *before* the colon (e.g. `getStarted`)
   - anything in curly braces like `{name}`, `{count}` — these get filled in
     automatically (e.g. `"Message {name}…"` shows as "Message Maya…")
   - the quotes `"` and the commas `,`

4. **Save as a proposal.**
   Scroll down to **"Commit changes…"**. Choose
   **"Create a new branch for this commit and start a pull request"**, then
   click **Propose changes**.

5. **Open the pull request.**
   Give it a short title like *"Update onboarding button text"* and click
   **Create pull request**.

6. **Wait for the check ✅.**
   GitHub automatically checks that your change is valid (about a minute).
   - **Green check** = your change is good.
   - **Red X** = something's off (usually a missing comma or quote). Click
     **Details** to see, or just fix the line to match the ones around it.

7. **Ruly reviews and approves.** Once approved and merged, the app rebuilds and
   your new text is **live in about a minute**. 🎉

---

## Tips

- **Preview your JSON** is valid by making sure each line looks like its
  neighbors — `"key": "value",` with a comma at the end (except the last one in
  a group).
- **Emojis are welcome** — you can add or change them (e.g. the labels under
  `intents` and `groupCategories`).
- **Made a mistake?** Nothing goes live without approval, so don't worry. You
  can always edit the pull request again before it's merged.

---

## Where things are (quick map)

| Screen in the app | Section in `strings.json` |
|---|---|
| Welcome / login | `onboard` |
| Flight / date / event search | `flight` |
| "What are you looking for?" | `intentScreen` |
| People feed | `feed` |
| A person's profile | `profile` |
| Direct chat | `chat` |
| Groups list + create | `groups`, `createGroup` |
| Group chat / members | `groupChat`, `members` |
| Edit my profile | `editProfile` |
| Admin panel | `admin` |
| Interest labels | `intents` |
| Group category labels | `groupCategories` |
