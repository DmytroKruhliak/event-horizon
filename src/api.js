/**
 * Set REACT_APP_USE_MOCK=true to run the dashboard without the backend.
 */
const USE_MOCK = process.env.REACT_APP_USE_MOCK === 'true';

const HOUR = 3600000;
const at = (offsetHours) => new Date(Date.now() + offsetHours * HOUR).toISOString();

/**
 * Mock data, used only when USE_MOCK is set. Same shapes the backend returns
 * (see README "Event shape"): a siege per fort plus the 8h cooldown that
 * follows a capture/defend.
 */
const MOCK_EVENTS = [
  {
    id: 10, kind: 'siege', fort: 'Крепость Белых Песков', name: 'Крепость Белых Песков',
    startTime: at(-1), duration: 6, priority: 1, owner: 'Hinata',
    description: 'Осада Крепость Белых Песков началась!',
  },
  {
    id: 11, kind: 'cooldown', fort: 'Крепость Белых Песков', name: 'Крепость Белых Песков',
    startTime: at(-0.9), duration: 480, priority: 2, owner: 'Hinata',
    description: 'Cooldown: captured by Hinata — ready 8h after the siege',
  },
  {
    id: 12, kind: 'siege', fort: 'Заснеженная Крепость', name: 'Заснеженная Крепость',
    startTime: at(-10), duration: 4, priority: 1, owner: '23М65',
    description: 'Осада Заснеженная Крепость началась!',
  },
  {
    id: 13, kind: 'cooldown', fort: 'Заснеженная Крепость', name: 'Заснеженная Крепость',
    startTime: at(-9.9), duration: 480, priority: 3, owner: '23М65',
    description: 'Cooldown: defended by 23М65 — ready 8h after the siege',
  },
  {
    id: 14, kind: 'siege', fort: 'Крепость Аару', name: 'Крепость Аару',
    startTime: at(0.6), duration: 60, priority: 1, owner: null,
    description: 'Осада крепости Крепость Аару начнется через 60 минут!',
  },
];

const MOCK_FORTS = [
  { fort: 'Крепость Аару',         status: 'Registered/In Progress', time: at(0.6),  owner: 'marazma' },
  { fort: 'Крепость Белых Песков', status: 'Pending',                time: at(7.1),  owner: 'Hinata' },
  { fort: 'Заснеженная Крепость',  status: 'Ready',                  time: at(-1.9), owner: '23М65' },
];

async function getJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`GET ${path} failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch all current timeline events from the backend (backend/, Spring Boot
 * on :8080; the CRA dev server proxies /api there — see "proxy" in package.json).
 */
export async function fetchEvents() {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600)); // simulate network
    return MOCK_EVENTS;
  }
  return getJson('/api/events');
}

/**
 * Fetch every fort with its current status, status time and owner,
 * already sorted by status for display.
 */
export async function fetchForts() {
  if (USE_MOCK) return MOCK_FORTS;
  return getJson('/api/forts');
}

/**
 * Subscribe to live event updates (Server-Sent Events). `onEvent` receives
 * each new or changed event; an event with a known `id` replaces the old one.
 * `onOpen` runs on every (re)connect — the browser reconnects automatically,
 * and anything sent while disconnected is missed, so refetch there.
 * Returns an unsubscribe function.
 */
export function subscribeToEvents(onEvent, onOpen) {
  if (USE_MOCK) return () => {};
  const source = new EventSource('/api/stream');
  source.addEventListener('event', (e) => onEvent(JSON.parse(e.data)));
  if (onOpen) source.addEventListener('open', onOpen);
  return () => source.close();
}
