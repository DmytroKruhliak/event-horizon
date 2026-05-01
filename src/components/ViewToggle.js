import React from 'react';

/**
 * ViewToggle
 *
 * Three buttons for switching the observable time window:
 *   day   — 24 hours centred on the golden-ratio now line
 *   week  — 7 days
 *   month — 30 days
 *
 * Props:
 *   view      — currently active view string
 *   onChange  — callback(newView: string)
 */
function ViewToggle({ view, onChange }) {
  const views = ['hour','day', 'week', 'month'];

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {views.map((v) => {
        const active = v === view;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            style={{
              padding: '5px 16px',
              fontSize: 11,
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              border: '1px solid',
              borderColor: active ? 'rgba(180,160,255,0.7)' : 'rgba(255,255,255,0.1)',
              background: active ? 'rgba(180,160,255,0.1)' : 'transparent',
              color: active ? '#c8b8f0' : '#4a4060',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

export default ViewToggle;
