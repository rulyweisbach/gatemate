# GateMate — Trips redesign spec

Status: **approved, not yet built** (2026-08-30). Supersedes the "one search at a
time" model. Old data may be wiped — no migration required.

## Core idea

A **trip** is a first-class object a user owns. All discovery (people + groups)
happens *inside* a trip. Reference flow:

`Welcome → Add Trip → Choose Intent → My Trip (People / Groups) → Chats`

## Bottom navigation (4 tabs)

`Trips · Discover · Chats · Profile`

- **Trips** — My Trips list (active / upcoming / past) + **“+ Add a Trip”** → Trip Hub.
- **Discover** — shortcut straight into the **active trip’s People feed** (if no
  trip exists, prompt to add one).
- **Chats** — all 1:1 and group conversations (today’s Matches, generalized).
- **Profile** — edit profile (unchanged).

The current 5-tab bar (Groups/Interest/Matches/Discover/Profile) is replaced.
The old **Interest** screen (by-flight/date/event mode picker) becomes the
**Add Trip** creation step.

## Screens

| Screen | Route | Notes |
|---|---|---|
| Welcome | `/welcome` | value prop + Google sign-in → “Start your trip” |
| Add Trip | `/trips/new` | mode picker: **By Flight** / **Destination + Date**, optional **Event** (concert/sport/conference/other). Repurposes today’s `FlightScreen`. |
| Choose Intent | (step within Add Trip) | Friendship / Networking / Travel Buddy / Lounge / Local Guide / First Flight Support → “Find my people”. Saved on the trip. |
| My Trips | `/trips` | list grouped active / upcoming / past |
| Trip Hub | `/trips/:id` | header “Paris · Sep 12 · LY325 · Celine Dion”; **People / Groups** tabs + filters (same flight / same date / same event / nearby) |
| People Feed | `/trips/:id` (People tab) | relevant travelers with match-reason chips + “% relevant” |
| Groups Feed | `/trips/:id` (Groups tab) | groups belonging to this trip; join / create |
| Group Chat | `/trips/:id/groups/:gid/chat` | members-only (exists today) |
| Chat (1:1) | `/chat/:userId` | exists today |
| Chats | `/chats` | People + Groups sub-tabs |
| Profile / Edit | `/profile/:id`, `/me` | unchanged |

Copy for all of these already lives in `src/content/strings.json`
(`tripSetup`, `trips`, `tripHub`, `peopleFeed`, `connections`, `intentScreen`,
`intents`).

## Data model

**New `gatemate-trips` table** — PK `tripId`, GSIs for matching:
- `userId` (owner-index — list my trips)
- `flightNumber` (flight-index)
- `flightDate` / travel date (date-index)
- `destination` (destination-index)
- `eventKey` (event-index, e.g. `concert#celine-dion`)

Attributes: `userId, createdAt, status, flightNumber?, flightDate?, destination?,
returnDate?, event? {type,name}, intents[], label`.

`status` derived from dates: **past** if travel/return date < today; **active**
if today falls in the trip window (or soonest upcoming); else **upcoming**.
The **active trip** = soonest non-past trip; drives the Discover shortcut.

**Groups become trip-scoped** — add `tripId` to `gatemate-groups` (+ trip-index GSI).
Create-group requires a `tripId`.

**Matching** — given my trip, find *other users’ trips* that overlap, score them:
same flight (highest) > same event > same date > same destination > nearby.
Return `{ userId, profile, reasons[], relevance }`, sorted by relevance.

## Backend routes (single routing Lambda, plain CloudFormation)

```
POST   /trips                      create a trip (+ intents)
GET    /trips                      list my trips (active/upcoming/past)
GET    /trips/{id}                 one trip
PUT    /trips/{id}                 edit
DELETE /trips/{id}                 remove
GET    /trips/{id}/people          relevant travelers (reasons + relevance%)
GET    /trips/{id}/groups          groups for this trip
POST   /trips/{id}/groups          create group in this trip
```
Existing connections / messages / group-messages routes stay.

## Phasing

- **Phase A — backend.** `gatemate-trips` table + GSIs, CRUD routes, trip-scoped
  groups, `/trips/{id}/people` matching. Wipe old seed/user data; reseed demo
  trips. Stack + deploy.
- **Phase B — frontend trip screens.** Add Trip (+ intent step), My Trips list,
  Trip Hub (People/Groups + filters), People/Groups feeds. Wire to the new API.
- **Phase C — nav + chats + cleanup.** 4-tab bar, Discover→active-trip shortcut,
  Chats screen, remove dead routes/screens from the old flow.

Each phase is deployed and verified before the next.
