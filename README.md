<img src="assets/icon.svg" width="64" height="64" alt="">

# Timeless — clickable prototype

Quick web mock-up of the “Timeless” iPhone app idea: see your friends on a world map with
their local time, get notified when they change time zone, and keep their clocks on the lock screen.

```bash
cd app
npm install
npm run dev        # http://localhost:5179 — also reachable from a phone on the same Wi‑Fi
```

On a desktop it renders inside an iPhone frame with a **demo panel** on the right. On a phone it
runs full-screen; the yellow **Demo** button opens the same controls.

## What's in it

| Sketch | Prototype |
| --- | --- |
| 1. Registration (name, username, DOB, short name ≤5, email, phone, ToS) | `src/screens/Register.tsx` — live lock-screen widget preview of the short name |
| 2. Find friends (sync contacts, search by username, invites) | `src/components/UserSearch.tsx` |
| 3. Main screen: world map, friends, time-zone bands, expandable menu, settings, profile | `src/screens/MainScreen.tsx`, `MapView.tsx`, `Sheet.tsx` |
| Notifications 1–4 (travelling, back home, friend request, you changed zone) | Triggered from the demo panel, shown as iOS banners |
| Lock-screen widgets (1/4 circular, 2/4 rectangular, GMT / city / emoji, colourful names) | `src/screens/LockScreen.tsx`, `Widget.tsx` |

Everything is fake/local: users live in `src/data.ts`, state is kept in `localStorage`.
Times are real (IANA time zones, DST-aware), and the map shows the actual day/night line.
Time-zone bands are simplified 15° strips, like the reference picture.
