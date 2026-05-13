import React, { useState, useEffect } from 'react';
import EventLine from './EventLine';
import NowLine from './NowLine';
import TimeAxis from './TimeAxis';
import ViewToggle from './ViewToggle';
import { fetchEvents } from '../api';
import { GOLDEN_RATIO, VIEW_MS, sortEvents } from '../utils';

/**
 * Dashboard
 *
 * Top-level component. Responsibilities:
 *   - Fetch events from the backend (via api.js) on mount.
 *   - Maintain a real-time clock that ticks every 10 seconds.
 *   - Compute the visible time window based on the selected view.
 *   - Sort events by priority (then name) and render one EventLine per event.
 *
 * Time window logic:
 *   The NOW line is always at the Golden Ratio position (61.8% from left).
 *   windowStart = now - 0.618 × totalMs
 *   windowEnd   = now + 0.382 × totalMs
 *   As time advances, all event bars drift left toward the NOW line.
 */
function Dashboard() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState('day');
  const [now,     setNow]     = useState(Date.now());

  // Fetch events once on mount
  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  // Real-time clock — ticks every 1 second 
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalMs    = VIEW_MS[view];
  const windowStart = now - GOLDEN_RATIO * totalMs;
  const windowEnd   = now + (1 - GOLDEN_RATIO) * totalMs;

  // Only render events that overlap the visible window
  const visibleEvents = events.filter((e) => {
    const start = new Date(e.startTime).getTime();
    const end   = start + e.duration * 60000;
    return end >= windowStart && start <= windowEnd;
  });

  const sortedEvents = sortEvents(visibleEvents);

  const clockLabel = new Date(now).toLocaleString([], {
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
            <p style={styles.subtitle}>{clockLabel}</p>
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>

        {/* Timeline canvas */}
        <div style={styles.canvas}>
          <TimeAxis windowStart={windowStart} windowEnd={windowEnd} view={view} />

          {/* Track — contains the NOW line and all event bars */}
          <div style={{ position: 'relative', paddingLeft: 18 }}>
            <NowLine />

            {loading && (
              <div style={styles.loadingMsg}>Fetching events...</div>
            )}

            {!loading && sortedEvents.length === 0 && (
              <div style={styles.loadingMsg}>No events in this window</div>
            )}

            {sortedEvents.map((event) => (
              <EventLine
                key={event.id}
                event={event}
                windowStart={windowStart}
                windowEnd={windowEnd}
                now={now}
              />
            ))}
          </div>
        </div>

        {/* Priority legend */}
        <div style={styles.legend}>
          {[
            { priority: 1, label: 'High priority',   dot: '#e05555' },
            { priority: 2, label: 'Normal priority',  dot: '#b4a0ff' },
            { priority: 3, label: 'Low priority',     dot: '#50b4a0' },
          ].map(({ priority, label, dot }) => (
            <div key={priority} style={styles.legendItem}>
              <div style={{ ...styles.legendDot, background: dot }} />
              <span style={styles.legendLabel}>{label}</span>
            </div>
          ))}
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
