import React from 'react';

/**
 * TimeAxis
 *
 * Renders evenly-spaced tick marks and time labels along the bottom
 * of the timeline track. Tick density adapts to the selected view.
 *
 * Props:
 *   windowStart — visible window start (ms)
 *   windowEnd   — visible window end (ms)
 *   view        — 'day' | 'week' | 'month'
 */
function TimeAxis({ windowStart, windowEnd, view }) {
  const STEP_MS = {
    day:   3600000 * 2,   // every 2 hours
    week:  86400000,      // every day
    month: 86400000 * 3,  // every 3 days
  };

  const step = STEP_MS[view];
  const ticks = [];
  let t = Math.ceil(windowStart / step) * step;

  while (t <= windowEnd) {
    const pct = ((t - windowStart) / (windowEnd - windowStart)) * 100;
    const d = new Date(t);
    const label = view === 'day'
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });

    ticks.push({ pct, label, key: t });
    t += step;
  }

  return (
    <div style={{
      position: 'relative',
      height: 28,
      marginBottom: 4,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {ticks.map(({ pct, label, key }) => (
        <div
          key={key}
          style={{
            position: 'absolute',
            bottom: 0,
            left: `${pct}%`,
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
