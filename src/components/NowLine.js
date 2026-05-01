import React from 'react';
import { GOLDEN_RATIO } from '../utils';

/**
 * NowLine
 *
 * A vertical red line pinned at the Golden Ratio position (61.8% from left).
 * Visually separates past events (left) from upcoming events (right).
 * The position never moves — the event bars slide toward it over time.
 */
function NowLine() {
  return (
    <div style={{
      position: 'absolute',
      left: `${GOLDEN_RATIO * 100}%`,
      top: 0,
      bottom: 0,
      width: 2,
      background: '#e05555',
      zIndex: 20,
      pointerEvents: 'none',
    }}>
      {/* "NOW" badge above the line */}
      <div style={{
        position: 'absolute',
        top: -22,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#e05555',
        color: '#fff',
        fontSize: 9,
        fontFamily: 'monospace',
        fontWeight: 700,
        padding: '2px 6px',
        borderRadius: 3,
        letterSpacing: '0.1em',
        whiteSpace: 'nowrap',
      }}>
        NOW
      </div>

      {/* Small dot at the top of the line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#e05555',
        marginTop: -3,
      }} />
    </div>
  );
}

export default NowLine;
