# Event Horizon

A real-time event dashboard built with plain React (no external UI libraries).
It shows Lineage 2 fortress sieges, read live from a Telegram chat by the Java
backend in `backend/`.

## Getting started

Prerequisites: Java 17+, Maven, Node.js, and `TELEGRAM_API_ID` /
`TELEGRAM_API_HASH` set as environment variables (see [Backend](#backend)).

Once (the first Telegram login needs the console to itself):

```bash
npm install
npm run dev:backend    # log in when prompted, then Ctrl+C
```

Every time after that, one command starts both:

```bash
npm run dev
```

It runs the backend (`mvn spring-boot:run`, :8080) and the dashboard
(:3000, proxying `/api` to the backend) in one terminal, with `[backend]` /
`[frontend]` prefixed logs. Ctrl+C, or either side crashing, stops both, so no
stray Java process keeps the port or the Telegram session locked.

Other ways to run:

| Command | What it does |
|---|---|
| `npm run dev:backend` | Backend only (also for the first login) |
| `npm run dev:frontend` / `npm start` | Dashboard only, against a backend already running |
| `REACT_APP_USE_MOCK=true npm start` | Dashboard with built-in mock data, no backend |

## Backend

`backend/` is a Spring Boot 3 service (Java 17+, Maven) that logs in to Telegram
**as your user account** (MTProto via [TDLight](https://github.com/tdlight-team/tdlight-java),
a wrapper over Telegram's official TDLib), not as a bot. On startup it loads the
last 3 days of the "La2world chat", then listens for new messages from
"Suspicious Merchant" and turns them into fort statuses and timeline events.

### First run (interactive login)

1. Get `api_id` / `api_hash` from https://my.telegram.org/apps.
2. Build and run in a terminal (the login prompts read from the console):

   ```bash
   cd backend
   mvn package
   TELEGRAM_API_ID=... TELEGRAM_API_HASH=... java -jar target/backend-0.1.0-SNAPSHOT.jar
   ```

3. Enter your phone number, the login code Telegram sends you, and your 2FA
   password if you have one.

The session is stored in `backend/tdlib-session/`; later starts log in silently.
That folder is a logged-in credential: it is gitignored, never share it. Instead
of env vars you can put `telegram.api-id` / `telegram.api-hash` in
`backend/src/main/resources/application-local.yml` (also gitignored).

Settings (chat id, sender id, backfill window, game timings) live in
`backend/src/main/resources/application.yml`. Run `mvn test` in `backend/` for
the parser/status/timeline tests; `--telegram.enabled=false` starts the API
without connecting to Telegram.

### API

| Endpoint          | Returns |
|-------------------|---------|
| `GET /api/events` | Timeline events (shape below). |
| `GET /api/forts`  | Every fort with status, time and owner, sorted by status then time: `Siege` (happening now), `Registered` (announced, not started), `Ready`, `Pending` (in cooldown), `Unknown`. |
| `GET /api/stream` | Server-Sent Events; an `event` message per new or changed timeline event. |

Each siege becomes one `siege` event that ends at the capture/defend message;
each capture/defend becomes an 8-hour `cooldown` event until the fort is Ready.

## Project structure

```
backend/                   # Spring Boot Telegram listener + API (see above)
src/
  api.js                   # fetchEvents() / fetchForts() / subscribeToEvents() — the only backend seam
  utils.js                 # Shared constants and pure helper functions
  index.js                 # React entry point
  index.css                # Global reset
  components/
    Dashboard.js           # Top-level component; fetches data, manages clock and view
    FortRow.js             # One row per fort: label, siege markers, cooldown strips
    FortBadge.js           # Fort icon: flag or fortress picture in the fort's colour + 2-letter tag
    EventTooltip.js        # Hover tooltip for siege markers and cooldown strips
    FortInfoTooltip.js     # Hover tooltip on a fort label: territory, owner, status, bonus
    tooltipStyles.js       # Shared tooltip look (grey header/keys, gold bonus)
    NowLine.js             # The golden-ratio vertical NOW marker
    TimeAxis.js            # Tick marks and time labels along the track
    ViewToggle.js          # Hour / Day / Week / Month buttons
```

## Dashboard layout

One row per fort, in the order `GET /api/forts` returns them (by status:
Siege, Registered, Ready, Pending, Unknown; then by time). Each row has:

- **Label** — the fort's badge (a random fortress picture, picked once per page
  load by `fortImage()`) and three lines: name, current status with its time,
  and owner.
  Hovering it shows fort and territory, owner, status (same colour as in the
  label) and the fort's capture bonus in gold (`fortInfo()` in `src/utils.js`,
  from https://la2world.ru/blog/obnovlennye-kreposti/). Siege markers and
  cooldown strips use the same tooltip style (`tooltipStyles.js`) but show only
  fort and territory, time and the original message.
- **Siege marker** — a fortress picture in the fort's coloured ring at the
  siege start time; dimmed once the siege is over, glowing while it is running.
  Until an announced siege starts, an amber pill next to it counts down the
  time left with seconds (`42:05`, `1:02:07`), and the row label shows the
  exact start time, e.g. `Registered 11:36:52 PM`. At zero the fort moves up to Siege.
  The four pictures in `public/fortresses/` are handed out to sieges one by
  one in time order (`siegeImages()` in `src/utils.js`).
- **Cooldown strip** — a thin bar in the fort's colour from a capture/defend
  until the fort is Ready again.

l2wiki has no picture per fort, so the same four pictures are reused; the
in-game flag icon is only a fallback. Every badge is told apart by a per-fort colour and a two-letter
abbreviation (`fortColor()` / `fortAbbr()` in `src/utils.js`).

## Event shape

```js
{
  id:          number,       // Telegram message id
  name:        string,       // fort name
  fort:        string,       // fort name — the row the event is drawn on
  kind:        string,       // "siege" (badge marker) | "cooldown" (strip)
  startTime:   string,       // ISO 8601 timestamp
  duration:    number,       // length in minutes
  priority:    number,       // 1 siege, 2 captured, 3 defended (not used for layout)
  owner:       string,       // capturing/defending clan, if known
  description: string,       // shown in the hover tooltip
  // add any extra fields — they flow through to EventTooltip automatically
}
```

## Time zone

All times on the dashboard (clock, axis, statuses, tooltips) are shown in game
server time, UTC+3, regardless of the viewer's own zone — change
`SERVER_TIME_ZONE` / `SERVER_UTC_OFFSET_MS` in `src/utils.js` if the server
moves. The backend works in real UTC instants and needs no correction.

## Real-time behaviour

Events arrive over `/api/stream` and replace existing ones by `id`; each live
event also refreshes `/api/forts`, which is refetched every minute as well
(Pending turns Ready without a new message). On every (re)connect everything is
refetched. The dashboard re-evaluates positions every second. The NOW line is
fixed at the Golden Ratio position (38.2% from the left edge of the track);
markers animate smoothly leftward with a CSS `transition` as time advances.
