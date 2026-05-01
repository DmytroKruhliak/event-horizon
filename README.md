# Event Horizon

A real-time event dashboard built with plain React (no external UI libraries).

## Getting started

```bash
npm install
npm start
```

The app opens at http://localhost:3000.

## Project structure

```
src/
  api.js                   # fetchEvents() — swap mock data for a real backend call here
  utils.js                 # Shared constants and pure helper functions
  index.js                 # React entry point
  index.css                # Global reset
  components/
    Dashboard.js           # Top-level component; fetches data, manages clock and view
    EventLine.js           # Horizontal bar for a single event (extensible)
    EventTooltip.js        # Hover tooltip rendered inside EventLine
    NowLine.js             # The golden-ratio vertical NOW marker
    TimeAxis.js            # Tick marks and time labels along the track
    ViewToggle.js          # Day / Week / Month buttons
```

## Event shape

```js
{
  id:          number,       // unique identifier
  name:        string,       // display name shown on the bar
  startTime:   string,       // ISO 8601 timestamp
  duration:    number,       // length in minutes — controls bar width
  priority:    number,       // 1 = high (red), 2 = normal (purple), 3+ = low (teal)
  description: string,       // shown in the hover tooltip
  pictureUrl:  string,       // avatar image URL
  // add any extra fields — they flow through to EventTooltip automatically
}
```

## Connecting to a real backend

Open `src/api.js` and replace the mock `setTimeout` with a real `fetch`:

```js
export async function fetchEvents() {
  const response = await fetch('/api/events');
  return response.json();
}
```

## Sorting rules

Events are sorted by `priority` (ascending), then alphabetically by `name`
for events that share the same priority. See `sortEvents()` in `src/utils.js`.

## Real-time behaviour

The dashboard re-evaluates positions every 10 seconds. The NOW line is fixed
at the Golden Ratio position (61.8% from the left edge). Event bars animate
smoothly leftward with a CSS `transition` as time advances.
