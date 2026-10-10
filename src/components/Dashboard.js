import React, { useState, useEffect } from 'react';
import FortRow, { LABEL_WIDTH } from './FortRow';
import NowLine from './NowLine';
import TimeAxis from './TimeAxis';
import ViewToggle from './ViewToggle';
import { fetchEvents, fetchForts, subscribeToEvents } from '../api';
import { FORT_STATUSES, GOLDEN_RATIO, VIEW_MS, formatServerTime, siegeImages, upsertEvents } from '../utils';

/** Fort statuses age without new messages (Pending turns Ready), so refresh periodically too. */
const FORTS_REFRESH_MS = 60000;

/**
 * Dashboard
 *
 * Top-level component. Responsibilities:
 *   - Fetch events and fort statuses from the backend (via api.js) on mount,
 *     then keep them live via the event stream.
 *   - Maintain a real-time clock that ticks every second.
 *   - Compute the visible time window based on the selected view.
 *   - Render one FortRow per fort, in the backend's status order, each with
 *     that fort's events in the visible window.
 *
 * Time window logic:
 *   The NOW line is always at the Golden Ratio position (38.2% from left).
 *   windowStart = now - 0.382 × totalMs
 *   windowEnd   = now + 0.618 × totalMs
 *   As time advances, all markers drift left past the NOW line.
 */
function Dashboard() {
  const [events,  setEvents]  = useState([]);
  const [forts,   setForts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState('day');
  const [now,     setNow]     = useState(Date.now());

  // Every (re)connect refetches everything so nothing missed while
  // disconnected is lost; live updates replace events by id and refresh
  // fort statuses, which each new message can change.
  useEffect(() => {
    const loadForts = () =>
      fetchForts()
        .then(setForts)
        .catch((err) => console.error(err));
    const load = () =>
      Promise.all([
        fetchEvents().then((fetched) => setEvents((prev) => upsertEvents(prev, fetched))),
        loadForts(),
      ])
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));

    load();
    const refresh = setInterval(loadForts, FORTS_REFRESH_MS);
    const unsubscribe = subscribeToEvents(
      (event) => {
        setEvents((prev) => upsertEvents(prev, [event]));
        loadForts();
      },
      load,
    );
    return () => {
      clearInterval(refresh);
      unsubscribe();
    };
  }, []);

  // Real-time clock — ticks every 1 second
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalMs     = VIEW_MS[view];
  const windowStart = now - GOLDEN_RATIO * totalMs;
  const windowEnd   = now + (1 - GOLDEN_RATIO) * totalMs;

  // Pictures go to sieges in time order across all events, so they stay put as the window moves
  const images = siegeImages(events);

  // Only pass on events that overlap the visible window, grouped by fort
  const eventsByFort = new Map();
  events.forEach((e) => {
    const start = new Date(e.startTime).getTime();
    const end   = start + e.duration * 60000;
    if (end < windowStart || start > windowEnd) return;
    if (!eventsByFort.has(e.fort)) eventsByFort.set(e.fort, []);
    eventsByFort.get(e.fort).push(e);
  });

  // Rows come from /api/forts; if that failed, fall back to forts seen in events
  const rows = forts.length > 0
    ? forts
    : [...eventsByFort.keys()].map((fort) => ({ fort, status: 'Unknown', time: null, owner: null }));

  // Game server time (UTC+3), not the browser's zone
  const clockLabel = formatServerTime(now, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Event Horizon</h1>
            <p style={styles.subtitle}>{clockLabel} · server time</p>
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>

        {/* Timeline canvas — the axis and NOW line span the track, right of the fort labels */}
        <div style={styles.canvas}>
          <div style={{ marginLeft: LABEL_WIDTH }}>
            <TimeAxis windowStart={windowStart} windowEnd={windowEnd} view={view} />
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ ...styles.trackOverlay, left: LABEL_WIDTH }}>
              <NowLine />
            </div>

            {loading && (
              <div style={styles.loadingMsg}>Fetching forts...</div>
            )}

            {!loading && rows.length === 0 && (
              <div style={styles.loadingMsg}>No fort data — is the backend running?</div>
            )}

            {rows.map((fort) => (
              <FortRow
                key={fort.fort}
                fort={fort}
                events={eventsByFort.get(fort.fort) || []}
                images={images}
                windowStart={windowStart}
                windowEnd={windowEnd}
                now={now}
              />
            ))}
          </div>
        </div>

        {/* Status legend */}
        <div style={styles.legend}>
          {FORT_STATUSES.map(({ status, label, color }) => (
            <div key={status} style={styles.legendItem}>
              <div style={{ ...styles.legendDot, background: color }} />
              <span style={styles.legendLabel}>{label}</span>
            </div>
          ))}
          <span style={styles.legendLabel}>· flag = siege · strip = cooldown until Ready</span>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0d0d14',
    padding: '28px 24px 32px',
  },
  container: {
    maxWidth: 960,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: 400,
    color: '#e2ddf5',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: 11,
    color: '#4a4060',
    marginTop: 4,
    fontFamily: 'monospace',
    letterSpacing: '0.06em',
  },
  canvas: {
    position: 'relative',
  },
  trackOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  loadingMsg: {
    padding: '32px 0',
    fontSize: 13,
    color: '#3a3050',
    fontFamily: 'monospace',
    letterSpacing: '0.1em',
    textAlign: 'center',
  },
  legend: {
    display: 'flex',
    gap: 20,
    marginTop: 24,
    paddingTop: 16,
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
  },
  legendLabel: {
    fontSize: 11,
    color: '#4a4060',
    fontFamily: 'monospace',
  },
};

export default Dashboard;
