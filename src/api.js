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
    id: 1,
    name: 'Shanty Siege',
    startTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    duration: 90,
    priority: 1,
    description: 'Review of the new microservices architecture proposal.',
    pictureUrl: 'https://l2wiki.com/upload/db/019c/7855fec7ff5587ffae6f37236a7dbb22.png',
  },
  {
    id: 2,
    name: 'Lunch & Learn',
    startTime: new Date(Date.now() - 5 * 3600000).toISOString(),
    duration: 60,
    priority: 2,
    description: 'Informal knowledge sharing on observability tools.',
    pictureUrl: 'https://l2wiki.com/upload/db/019c/7855fec7ff5587ffae6f37236a7dbb22.png',
  },
  {
    id: 3,
    name: 'Team Standup',
    startTime: new Date(Date.now() + 0.2 * 3600000).toISOString(),
    duration: 60,
    priority: 1,
    description: 'Daily sync with the engineering team. Review blockers and plan the day.',
    pictureUrl: 'https://l2wiki.com/upload/db/019c/f1adbcbbceb5d85d59473c9b03fd1edc.jpg',
  },
  {
    id: 4,
    name: 'Product Review',
    startTime: new Date(Date.now() + 3.5 * 3600000).toISOString(),
    duration: 60,
    priority: 2,
    description: 'Quarterly product review with stakeholders. Demo new features.',
    pictureUrl: 'https://l2wiki.com/upload/db/019c/f1adbcbbceb5d85d59473c9b03fd1edc.jpg',
  },
  {
    id: 5,
    name: 'Client Call',
    startTime: new Date(Date.now() + 6 * 3600000).toISOString(),
    duration: 45,
    priority: 1,
    description: 'Onboarding call with Acme Corp. Discuss integration requirements.',
    pictureUrl: 'https://l2wiki.com/upload/db/019c/f1adbcbbceb5d85d59473c9b03fd1edc.jpg',
  },
  {
    id: 6,
    name: 'All Hands',
    startTime: new Date(Date.now() + 4 * 3600000).toISOString(),
    duration: 90,
    priority: 1,
    description: 'Company-wide all hands meeting.',
    pictureUrl: 'https://l2wiki.com/upload/db/019c/7855fec7ff5587ffae6f37236a7dbb22.png',
  },
  {
    id: 7,
    name: 'Design Sprint',
    startTime: new Date(Date.now() + 26 * 3600000).toISOString(),
    duration: 480,
    priority: 3,
    description: 'Two-day design sprint kick-off for the new dashboard redesign.',
    pictureUrl: 'https://l2wiki.com/upload/db/019c/7855fec7ff5587ffae6f37236a7dbb22.png',
  },
  {
    id: 8,
    name: 'Board Meeting',
    startTime: new Date(Date.now() + 72 * 3600000).toISOString(),
    duration: 120,
    priority: 1,
    description: 'Quarterly board meeting. Present OKRs and financials.',
    pictureUrl: 'https://l2wiki.com/upload/db/019c/7855fec7ff5587ffae6f37236a7dbb22.png',
  },
  {
    id: 9,
    name: 'Retrospective',
    startTime: new Date(Date.now() + 120 * 3600000).toISOString(),
    duration: 60,
    priority: 2,
    description: 'Sprint retrospective. What went well, what to improve.',
    pictureUrl: 'https://l2wiki.com/upload/db/019c/7855fec7ff5587ffae6f37236a7dbb22.png',
  },
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
