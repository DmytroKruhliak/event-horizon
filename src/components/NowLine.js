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
      <div style={{
        position: 'absolute',
        top: -70,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 21,
      }}>
        <div style={{
          background: '#e05555',
          color: '#fff',
          fontSize: 10,
          fontFamily: 'monospace',
          fontWeight: 700,
          padding: '4px 4px',
          borderRadius: '2px 2px 0 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: '0.9',
          minWidth: 16,
        }}>
          <span>N</span>
          <span>O</span>
          <span>W</span>
        </div>
        <div style={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid #e05555',
        }} />
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
