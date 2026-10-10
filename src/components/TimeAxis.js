import React from 'react';
import { SERVER_UTC_OFFSET_MS, formatServerTime } from '../utils';

/**
 * TimeAxis
 *
 * Renders evenly-spaced tick marks and time labels along the bottom
 * of the timeline track. Tick density adapts to the selected view.
 * Ticks fall on round game-server times (e.g. server midnight) and are
 * labelled in server time.
 *
 * Props:
 *   windowStart — visible window start (ms)
 *   windowEnd   — visible window end (ms)
 *   view        — 'hour' | 'day' | 'week' | 'month'
 */
function TimeAxis({ windowStart, windowEnd, view }) {
  const STEP_MS = {
    hour:  60000 * 10,    // every 10 minutes
    day:   3600000 * 3,   // every 3 hours
    week:  86400000,      // every day
    month: 86400000 * 3,  // every 3 days
  };

  const step = STEP_MS[view];
  const ticks = [];
  // Align to the step in server time: shift into server time, round, shift back
  let t = Math.ceil((windowStart + SERVER_UTC_OFFSET_MS) / step) * step - SERVER_UTC_OFFSET_MS;

  while (t <= windowEnd) {
    const positionPercentage = ((t - windowStart) / (windowEnd - windowStart)) * 100;
    const label = view === 'hour' || view === 'day'
      ? formatServerTime(t, { hour: '2-digit', minute: '2-digit' })
      : formatServerTime(t, { month: 'short', day: 'numeric' });

    ticks.push({ positionPercentage, label, key: t });
    t += step;
  }

  return (
    <div style={{
      position: 'relative',
      height: 28,
      marginBottom: 4,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {ticks.map(({ positionPercentage, label, key }) => (
        <div
          key={key}
          style={{
            position: 'absolute',
            bottom: 0,
            left: `${positionPercentage}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div style={{ width: 1, height: 6, background: 'rgba(255,255,255,0.15)', margin: '0 auto' }} />
          <div style={{ fontSize: 10, color: '#3a3050', fontFamily: 'monospace', whiteSpace: 'nowrap', textAlign: 'center', marginTop: 3 }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default TimeAxis;
