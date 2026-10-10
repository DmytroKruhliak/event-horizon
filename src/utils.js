/** Golden ratio constant — the NOW line sits at this fraction of the total width. */
export const GOLDEN_RATIO = 1.0 - 0.618;

/** Total milliseconds for each view mode. */
export const VIEW_MS = {
  hour: 3600000,
  day:   86400000,
  week:  7  * 86400000,
  month: 30 * 86400000,
};

/**
 * Returns a human-readable label for how far an event is from now.
 * e.g. "in 2h 15m", "30m ago", "in 3d"
 */
export function formatTimeUntil(startTime, now = Date.now()) {
  const diff = new Date(startTime).getTime() - now;
  const abs  = Math.abs(diff);
  const h    = Math.floor(abs / 3600000);
  const m    = Math.floor((abs % 3600000) / 60000);

  if (h > 48) {
    const d = Math.floor(h / 24);
    return diff > 0 ? `in ${d}d` : `${d}d ago`;
  }
  if (h > 0) return diff > 0 ? `in ${h}h ${m}m` : `${h}h ${m}m ago`;
  return diff > 0 ? `in ${m}m` : `${m}m ago`;
}

/**
 * Game server time zone: UTC+3. All times on the dashboard are shown in it,
 * whatever the browser's own zone is. ("Etc/GMT-3" is UTC+3 — the IANA
 * Etc/ zones have inverted signs.) Fixed offset, so it stays right when the
 * viewer's clock switches to/from summer time.
 */
export const SERVER_TIME_ZONE = 'Etc/GMT-3';
export const SERVER_UTC_OFFSET_MS = 3 * 3600000;

/** Formats a timestamp (ms, ISO string or Date) in game server time. */
export function formatServerTime(time, options) {
  return new Date(time).toLocaleString([], { ...options, timeZone: SERVER_TIME_ZONE });
}

const serverDay = (time) => formatServerTime(time, { year: 'numeric', month: 'numeric', day: 'numeric' });

/**
 * Server time of day for a status time, prefixed with a short day when it
 * isn't today (server calendar).
 * e.g. "09:15 PM", "tmrw 04:53 AM", "yday 09:15 PM", "Oct 5 09:15 PM"
 */
export function formatStatusTime(time, now = Date.now()) {
  const clock = formatServerTime(time, { hour: '2-digit', minute: '2-digit' });
  const day = serverDay(time);
  if (day === serverDay(now))            return clock;
  if (day === serverDay(now + 86400000)) return `tmrw ${clock}`;
  if (day === serverDay(now - 86400000)) return `yday ${clock}`;
  return `${formatServerTime(time, { month: 'short', day: 'numeric' })} ${clock}`;
}

/**
 * Returns a human-readable duration label.
 * e.g. 30 → "30m", 90 → "1h 30m", 120 → "2h"
 */
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** In-game fortress battle flag, shared by every fort's badge. */
export const FORT_FLAG_ICON = 'https://l2wiki.com/upload/images/icon/weapon_fort_flag_i00.png';

/** Fortress pictures (public/fortresses/), handed out to sieges in turn. */
const FORTRESS_IMAGES = [
  '/fortresses/fortress-1.png',
  '/fortresses/fortress-2.png',
  '/fortresses/fortress-3.webp',
  '/fortresses/fortress-4.png',
];

/**
 * Assigns the fortress pictures to siege events one by one in time order
 * (1st siege → picture 1, …, 5th → picture 1 again). Computed over all
 * events, not just the visible ones, so a siege keeps its picture while the
 * window scrolls. Returns a Map of event id → image URL.
 */
export function siegeImages(events) {
  const sieges = events
    .filter((e) => e.kind === 'siege')
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime) || a.id - b.id);
  return new Map(sieges.map((e, i) => [e.id, FORTRESS_IMAGES[i % FORTRESS_IMAGES.length]]));
}

const fortImageCache = new Map();

/**
 * A random fortress picture for a fort's row label, picked on first use and
 * then kept for the rest of the page's life so it doesn't change on re-render.
 */
export function fortImage(fort) {
  if (!fortImageCache.has(fort)) {
    fortImageCache.set(fort, FORTRESS_IMAGES[Math.floor(Math.random() * FORTRESS_IMAGES.length)]);
  }
  return fortImageCache.get(fort);
}

/**
 * Two-letter badge label per fort, keyed by the exact name used in the
 * Telegram messages. Order fixes each fort's colour (see fortColor()).
 */
const FORT_ABBR = {
  'Крепость Черепахи':       'ЧЕ',
  'Крепость Флорана':        'ФЛ',
  'Драконья Крепость':       'ДР',
  'Крепость Монахов':        'МО',
  'Крепость Пограничья':     'ПГ',
  'Крепость Антараса':       'АН',
  'Южная Крепость':          'ЮЖ',
  'Крепость Болота':         'БО',
  'Крепость Танор':          'ТА',
  'Западная Крепость':       'ЗП',
  'Крепость Гигантов':       'ГИ',
  'Крепость Охотников':      'ОХ',
  'Крепость Улья':           'УЛ',
  'Заснеженная Крепость':    'ЗС',
  'Крепость Аару':           'АА',
  'Крепость Слоновой Кости': 'СК',
  'Крепость Туманных Гор':   'ТГ',
  'Крепость Нарсилл':        'НА',
  'Укрепленный Лагерь':      'УК',
  'Крепость Демона':         'ДЕ',
  'Крепость Белых Песков':   'БП',
};
const FORT_ORDER = Object.keys(FORT_ABBR);

/** Badge label for a fort; unknown names fall back to their first two letters. */
export function fortAbbr(fort) {
  return FORT_ABBR[fort] || fort.replace(/^Крепость\s+/, '').slice(0, 2).toUpperCase();
}

/**
 * A distinct colour per fort. Hues step by a multiple of the golden angle
 * so neighbouring forts in the list never get similar colours.
 */
export function fortColor(fort, alpha = 1) {
  const index = FORT_ORDER.indexOf(fort);
  const hue = index >= 0 ? (index * 137.508) % 360 : 0;
  const lightness = index >= 0 ? 62 : 45;
  return `hsla(${hue.toFixed(0)}, 65%, ${lightness}%, ${alpha})`;
}

/**
 * Status values as returned by GET /api/forts, in display order, with the
 * short label and colour the dashboard uses for each.
 */
export const FORT_STATUSES = [
  { status: 'Registered/In Progress', label: 'Siege',   color: '#e05555' },
  { status: 'Pending',                label: 'Pending', color: '#e0a955' },
  { status: 'Ready',                  label: 'Ready',   color: '#50b4a0' },
  { status: 'Unknown',                label: 'Unknown', color: '#5a5070' },
];

export function statusInfo(status) {
  return FORT_STATUSES.find((s) => s.status === status) || FORT_STATUSES[FORT_STATUSES.length - 1];
}

/**
 * Given a timestamp and a visible time window, returns the horizontal
 * position as a percentage [0–100] of the total track width.
 */
export function toPct(timestamp, windowStart, windowEnd) {
  return ((timestamp - windowStart) / (windowEnd - windowStart)) * 100;
}

/**
 * Returns `existing` with every event from `incoming` inserted, replacing
 * any event that has the same `id`.
 */
export function upsertEvents(existing, incoming) {
  const byId = new Map(existing.map((e) => [e.id, e]));
  incoming.forEach((e) => byId.set(e.id, e));
  return [...byId.values()];
}
