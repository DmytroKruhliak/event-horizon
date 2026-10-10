# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install     # install dependencies
npm start       # run dev server (Create React App) at http://localhost:3000
npm run build   # production build
```

There is no frontend test suite and no dedicated lint script configured in `package.json` — don't invent `npm test`/`npm run lint` invocations.

Backend (`backend/`, Spring Boot 3, Maven, Java 17+):

```bash
cd backend && mvn test                                               # parser/status/timeline/API tests
java -jar target/backend-0.1.0-SNAPSHOT.jar --telegram.enabled=false   # API only, no Telegram connection
```

The backend logs in to Telegram as a user account via TDLight (TDLib). First login is interactive on the console; the session lives in `backend/tdlib-session/` (gitignored credential — never read, copy or commit it).

## Architecture

This is a Create React App project (`react-scripts`) with **no external UI/state libraries** — plain React function components with hooks, styled via inline `style` objects defined per-component (no CSS modules/styled-components, aside from the global reset in `src/index.css`).

### Data flow

- `src/api.js` — the single backend seam: `fetchEvents()` (`GET /api/events`) and `subscribeToEvents()` (SSE on `/api/stream`). `REACT_APP_USE_MOCK=true` switches back to `MOCK_EVENTS`. Don't add other data-fetching entry points.
- `src/components/Dashboard.js` is the sole stateful/orchestrating component: fetches events on mount and merges live updates by `id` (`upsertEvents()`), refetching on every stream (re)connect, runs a 1-second clock tick, computes the visible time window, filters events to that window, and delegates rendering to the child components below. Child components are presentational and receive everything via props.
- `src/utils.js` holds all shared pure logic (time-window math, formatting, fort colours/abbreviations, status labels) — keep new cross-component logic here rather than duplicating it in components.

### The golden-ratio timeline model

This is the core domain concept and isn't obvious from file names alone:

- `GOLDEN_RATIO` (`src/utils.js`) fixes the "NOW" marker at 38.2% across the visible track (`1 - 0.618`) (`NowLine.js`). It never moves.
- The visible window is `[now - 0.382 × totalMs, now + 0.618 × totalMs]`, where `totalMs` comes from `VIEW_MS` for the active view (`hour`/`day`/`week`/`month`, toggled via `ViewToggle.js`).
- Because the window re-centers on `now` every tick, siege markers and cooldown strips (`FortRow.js`) animate leftward via CSS `transition` as time passes, rather than the NOW line moving.
- `toPct()` maps a timestamp into a `[0, 100]` position within the current window; bars are clamped to `[0, 100]` so partially-visible events don't overflow the track.

### Event shape

```js
{
  id:          number,   // Telegram message id
  name:        string,   // fort name
  fort:        string,   // fort name — which FortRow the event is drawn on
  kind:        string,   // "siege" (badge marker) | "cooldown" (strip until Ready)
  startTime:   string,   // ISO 8601
  duration:    number,   // minutes
  priority:    number,   // 1 siege, 2 captured, 3 defended — not used for layout
  owner:       string,   // capturing/defending clan, may be null
  description: string,   // shown in EventTooltip
}
```

Extra fields flow through untouched to `EventTooltip` since it renders directly off the full `event` object — no allowlist to update when adding fields. Rows are one per fort in `/api/forts` order (status, then time); there is no per-event sorting. Row-label badges get a random picture from `public/fortresses/` per fort, picked once per page load (`fortImage()`; l2wiki has no per-fort pictures, `FORT_FLAG_ICON` is only the fallback); siege markers use the four pictures in `public/fortresses/`, assigned to sieges in rotation by start time (`siegeImages()`, computed over all events so a siege keeps its picture as the window moves). Badges are told apart by `fortColor()` / `fortAbbr()`.

### Other notes

- All displayed times are game server time (UTC+3): format timestamps only via `formatServerTime()` in `src/utils.js`, never bare `toLocale*()` (that would show the viewer's zone). `TimeAxis` aligns ticks to server-time boundaries with `SERVER_UTC_OFFSET_MS`.

- `test_data/filtered.json` is a Telegram chat export (Lineage 2 "La2world chat" siege announcements). The backend tests read it (`backend/src/test/.../TelegramExport.java`); the app itself doesn't.
- Backend flow: `TelegramListener` → `FortFeed.ingest()` → `MessageParser` → `FortStateService` (statuses, port of `l2/scripts/get_fortress_status.py`) + `TimelineService` (dashboard bars) → `EventStream` (SSE). Both services are order-independent because backfill and live messages overlap.
- `skills/project-commit/` is a Claude Code skill (`project-commit`) that commits and pushes all changes to a given branch with a generated message — only invoke it when the user explicitly asks for that workflow.
