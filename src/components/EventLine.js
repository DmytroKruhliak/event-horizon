import React, { useState } from 'react';
import EventTooltip from './EventTooltip';
import { priorityColors, formatTimeUntil, formatDuration, toPct } from '../utils';

/**
 * EventLine
 *
 * A horizontal bar that represents one event on the timeline.
 * Bar width  = event duration mapped to the visible time window.
 * Bar colour = driven by priority (1=red, 2=purple, 3+=teal).
 * Past events are greyed out automatically.
 *
 * The component is intentionally extensible:
 *   - All fields from the event JSON are forwarded to EventTooltip.
 *   - Priority determines vertical sort order (handled by the parent).
 *   - Add new visual treatments by branching on event fields here.
 *
 * Props:
 *   event       — full event JSON object
 *   windowStart — visible window start timestamp (ms)
 *   windowEnd   — visible window end timestamp (ms)
 *   now         — current timestamp (ms), passed in so the component
 *                 re-renders correctly when the parent clock ticks
 */
function EventLine({ event, windowStart, windowEnd, now }) {
  const [hovered, setHovered] = useState(false);

  const startMs  = new Date(event.startTime).getTime();
  const endMs    = startMs + event.duration * 60000;
  const isPast   = endMs < now;
  const colors   = priorityColors(event.priority);

  // Clamp to visible window so partially-visible bars don't overflow
  const leftPct  = Math.max(0,   toPct(startMs, windowStart, windowEnd));
  const rightPct = Math.min(100, toPct(endMs,   windowStart, windowEnd));
  const widthPct = rightPct - leftPct;

  // Only show text labels when the bar is wide enough to hold them
  const trackWidth    = 900; // approximate px width — good enough for the threshold
  const barWidthPx    = (widthPct / 100) * trackWidth;
  const showLabels    = barWidthPx > 80;

  const barStyle = {
    position: 'absolute',
    left: `${leftPct}%`,
    width: `${widthPct}%`,
    top: 6,
    height: 42,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'left 0.8s cubic-bezier(0.4,0,0.2,1), width 0.8s cubic-bezier(0.4,0,0.2,1)',
    background: isPast ? 'rgba(40,36,60,0.6)'      : colors.bar,
    border:     isPast ? '1px solid rgba(80,70,110,0.3)' : `1px solid ${colors.border}`,
    opacity:    isPast ? 0.55 : 1,
  };

  const avatarStyle = {
    width: 30,
    height: 30,
    borderRadius: '50%',
    marginLeft: 6,
    flexShrink: 0,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.15)',
    filter: isPast ? 'grayscale(0.7)' : 'none',
  };

  return (
    <div style={{ position: 'relative', height: 54, marginBottom: 3 }}>
      {/* Priority dot in the left gutter */}
      <div style={{
        position: 'absolute',
        left: -14,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: isPast ? '#2a2540' : colors.dot,
      }} />

      <div
        style={barStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Avatar */}
        <div style={avatarStyle}>
          <img
            src={event.pictureUrl}
            alt={event.name}
            width={30}
            height={30}
            style={{ display: 'block' }}
          />
        </div>

        {/* Text labels — hidden when bar is too narrow */}
        {showLabels && (
          <div style={{ marginLeft: 8, overflow: 'hidden', minWidth: 0, flex: 1, paddingRight: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: isPast ? '#5a5070' : '#e2ddf5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {event.name}
            </div>
            <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(220,210,255,0.55)', marginTop: 1, whiteSpace: 'nowrap' }}>
              {formatTimeUntil(event.startTime, now)} · {formatDuration(event.duration)}
            </div>
          </div>
        )}

        {/* Tooltip — shown on hover */}
        {hovered && <EventTooltip event={event} />}
      </div>
    </div>
  );
}

export default EventLine;
