import React from 'react';
import { formatDuration } from '../utils';

/**
 * EventTooltip
 *
 * Rendered inside EventLine on hover. Receives the full event JSON object,
 * so any future fields added to the event shape will automatically be
 * accessible here for display.
 *
 * Props:
 *   event — full event object (startTime, name, description, pictureUrl,
 *            duration, priority, plus any future fields)
 */
function EventTooltip({ event }) {
  const startDate = new Date(event.startTime).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div style={styles.tooltip}>
      <div style={styles.name}>{event.name}</div>
      <div style={styles.description}>{event.description}</div>
      <div style={styles.meta}>
        {startDate} · {formatDuration(event.duration)} · P{event.priority}
      </div>

      {/* Future fields: add extra rows here as the event shape grows */}
    </div>
  );
}

const styles = {
  tooltip: {
    position: 'absolute',
    bottom: 'calc(100% + 8px)',
    left: 0,
    background: '#1c1a2e',
    border: '1px solid rgba(180,160,255,0.25)',
    borderRadius: 8,
    padding: '10px 13px',
    width: 220,
    zIndex: 50,
    pointerEvents: 'none',
  },
  name: {
    fontSize: 12,
    fontWeight: 600,
    color: '#e2ddf5',
    marginBottom: 4,
  },
  description: {
    fontSize: 11,
    color: '#8a7faa',
    lineHeight: 1.5,
  },
  meta: {
    fontSize: 10,
    color: '#5a5070',
    fontFamily: 'monospace',
    marginTop: 6,
  },
};

export default EventTooltip;
