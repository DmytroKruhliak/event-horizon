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
 * Returns a human-readable duration label.
 * e.g. 30 → "30m", 90 → "1h 30m", 120 → "2h"
 */
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Returns color tokens for a given priority level.
 *   priority 1 → red   (urgent / top lane)
 *   priority 2 → purple (normal)
 *   priority 3+ → teal  (low / informational)
 */
export function priorityColors(priority) {
  if (priority === 1) {
    return { bar: 'rgba(224,85,85,0.18)', border: 'rgba(224,85,85,0.55)', dot: '#e05555' };
  }
  if (priority === 2) {
    return { bar: 'rgba(180,160,255,0.15)', border: 'rgba(180,160,255,0.45)', dot: '#b4a0ff' };
  }
  return { bar: 'rgba(80,180,160,0.13)', border: 'rgba(80,180,160,0.4)', dot: '#50b4a0' };
}

/**
 * Sorts events by priority (ascending), then alphabetically by name
 * for events that share the same priority.
 */
export function sortEvents(events) {
  return [...events].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Given a timestamp and a visible time window, returns the horizontal
 * position as a percentage [0–100] of the total track width.
 */
export function toPct(timestamp, windowStart, windowEnd) {
  return ((timestamp - windowStart) / (windowEnd - windowStart)) * 100;
}
