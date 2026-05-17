/**
 * Mock event data.
 * Each event matches the shape your backend will return:
 *   startTime  — ISO 8601 string
 *   name       — display name
 *   description — free-text description shown in the tooltip
 *   pictureUrl  — URL for the avatar image on the event bar
 *   duration   — length of the event in minutes
 *   priority   — integer; lower = higher priority (1 = top lane)
 *
 * Add any extra fields here — they will flow through to EventLine
 * and be available in the tooltip via the `event` prop.
 */
const MOCK_EVENTS = [
  {
    id: 10,
    name: 'Осада крепости Крепость Белых Песков начнется через 60 минут!',
    startTime: new Date(1766726080 * 1000).toISOString(),
    duration: 55,
    priority: 2,
    description: 'Event related to: Осада крепости Крепость Белых Песков начнется через 60 минут!',
    pictureUrl: 'https://l2wiki.com/upload/db/019c/7855fec7ff5587ffae6f37236a7dbb22.png',
  },
  {
    id: 11,
    name: 'Осада крепости Заснеженная Крепость начнется через 60 минут!',
    startTime: new Date(1766726254 * 1000).toISOString(),
    duration: 98,
    priority: 1,
    description: 'Event related to: Осада крепости Заснеженная Крепость начнется через 60 минут!',
    pictureUrl: 'https://l2wiki.com/upload/db/019c/f1adbcbbceb5d85d59473c9b03fd1edc.jpg',
  },
  {
    id: 12,
    name: 'Осада Крепость Белых Песков началась!',
    startTime: new Date(1766729680 * 1000).toISOString(),
    duration: 73,
    priority: 3,
    description: 'Event related to: Осада Крепость Белых Песков началась!',
    pictureUrl: 'https://l2wiki.com/upload/db/019c/7855fec7ff5587ffae6f37236a7dbb22.png',
  },
  {
    id: 13,
    name: 'Осада Заснеженная Крепость началась!',
    startTime: new Date(1766729854 * 1000).toISOString(),
    duration: 45,
    priority: 2,
    description: 'Event related to: Осада Заснеженная Крепость началась!',
    pictureUrl: 'https://l2wiki.com/upload/db/019c/f1adbcbbceb5d85d59473c9b03fd1edc.jpg',
  },
  {
    id: 14,
    name: '23М65 отстоял крепость Заснеженная Крепость!',
    startTime: new Date(1766733454 * 1000).toISOString(),
    duration: 112,
    priority: 1,
    description: 'Event related to: 23М65 отстоял крепость Заснеженная Крепость!',
    pictureUrl: 'https://l2wiki.com/upload/db/019c/7855fec7ff5587ffae6f37236a7dbb22.png',
  }
];

/**
 * Fetch events from the backend.
 * Replace the mock delay below with a real fetch() call, e.g.:
 *
 *   const response = await fetch('/api/events');
 *   return response.json();
 */
export async function fetchEvents() {
  await new Promise((resolve) => setTimeout(resolve, 600)); // simulate network
  return MOCK_EVENTS;
}
