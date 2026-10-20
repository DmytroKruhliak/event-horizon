import React, { useState } from 'react';
import FortBadge from './FortBadge';
import EventTooltip from './EventTooltip';
import FortInfoTooltip from './FortInfoTooltip';
import { formatCountdown, formatStatusTime, fortColor, fortImage, statusInfo, toPct } from '../utils';

export const ROW_HEIGHT = 52;
export const LABEL_WIDTH = 240;

/**
 * FortRow
 *
 * One timeline row per fort:
 *   - label   — fort badge (random fortress picture) and three lines: name, current
 *               status with its time, and owner (from /api/forts);
 *               hovering it shows the fort's territory and capture bonus
 *   - track   — each siege as a fortress-picture badge at its start time (with a
 *               live countdown while it hasn't started yet), and each
 *               capture/defend cooldown as a thin strip in the fort's colour
 *               running until the fort is Ready again
 *
 * Props:
 *   fort        — { fort, status, time, owner } from GET /api/forts
 *   events      — this fort's events (kind "siege" | "cooldown")
 *   images      — Map of siege event id → fortress picture (see siegeImages())
 *   windowStart — visible window start timestamp (ms)
 *   windowEnd   — visible window end timestamp (ms)
 *   now         — current timestamp (ms)
 */
function FortRow({ fort, events, images, windowStart, windowEnd, now }) {
  const sieges    = events.filter((e) => e.kind === 'siege');
  const cooldowns = events.filter((e) => e.kind === 'cooldown');

  return (
    <div style={{
      display: 'flex',
      height: ROW_HEIGHT,
      borderBottom: '1px solid rgba(255,255,255,0.03)',
    }}>
      <FortLabel fort={fort} now={now} />

      <div style={{ position: 'relative', flex: 1 }}>
        {cooldowns.map((e) => (
          <CooldownStrip key={e.id} event={e} windowStart={windowStart} windowEnd={windowEnd} now={now} />
        ))}
        {sieges.map((e) => (
          <SiegeMarker key={e.id} event={e} image={images.get(e.id)} windowStart={windowStart} windowEnd={windowEnd} now={now} />
        ))}
      </div>
    </div>
  );
}

function FortLabel({ fort, now }) {
  const [hovered, setHovered] = useState(false);
  const info = statusInfo(fort.status);
  // A registered siege shows its exact start time, to the second (the
  // countdown is on its timeline marker)
  const time = fort.time ? formatStatusTime(fort.time, now, fort.status === 'Registered') : null;

  return (
    <div
      style={{
        position: 'relative',
        width: LABEL_WIDTH,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        paddingRight: 10,
        boxSizing: 'border-box',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && <FortInfoTooltip fort={fort} />}
      <FortBadge fort={fort.fort} image={fortImage(fort.fort)} size={30} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={styles.fortName} title={fort.fort}>{fort.fort}</div>
        <div style={styles.statusLine}>
          <span style={{ color: info.color, fontWeight: 600 }}>{info.label}</span>
          {time && <span> {time}</span>}
        </div>
        {fort.owner && <div style={styles.ownerLine} title={fort.owner}>{fort.owner}</div>}
      </div>
    </div>
  );
}

function SiegeMarker({ event, image, windowStart, windowEnd, now }) {
  const [hovered, setHovered] = useState(false);
  const startMs = new Date(event.startTime).getTime();
  const endMs   = startMs + event.duration * 60000;
  const leftPct = toPct(startMs, windowStart, windowEnd);
  if (leftPct < 0 || leftPct > 100) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${leftPct}%`,
        top: '50%',
        transform: 'translate(-50%, -55%)',
        zIndex: hovered ? 30 : 2,
        cursor: 'pointer',
        transition: 'left 0.8s cubic-bezier(0.4,0,0.2,1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <FortBadge
        fort={event.fort}
        image={image}
        size={34}
        dimmed={endMs < now}
        active={startMs <= now && now <= endMs}
      />
      {startMs > now && <Countdown ms={startMs - now} />}
      {hovered && <EventTooltip event={event} />}
    </div>
  );
}

/** Time left until an announced siege starts, in a pill to the right of its badge. */
function Countdown({ ms }) {
  return (
    <div style={styles.countdown} title="Time left until the siege starts">
      {formatCountdown(ms)}
    </div>
  );
}

function CooldownStrip({ event, windowStart, windowEnd, now }) {
  const [hovered, setHovered] = useState(false);
  const startMs  = new Date(event.startTime).getTime();
  const endMs    = startMs + event.duration * 60000;
  const leftPct  = Math.max(0,   toPct(startMs, windowStart, windowEnd));
  const rightPct = Math.min(100, toPct(endMs,   windowStart, windowEnd));
  if (rightPct <= leftPct) return null;
  const isPast = endMs < now;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${leftPct}%`,
        width: `${rightPct - leftPct}%`,
        top: '50%',
        height: 6,
        transform: 'translateY(-50%)',
        borderRadius: 3,
        background: isPast ? 'rgba(80,70,110,0.25)' : fortColor(event.fort, 0.35),
        borderRight: isPast ? 'none' : `2px solid ${fortColor(event.fort)}`,
        zIndex: hovered ? 30 : 1,
        cursor: 'pointer',
        transition: 'left 0.8s cubic-bezier(0.4,0,0.2,1), width 0.8s cubic-bezier(0.4,0,0.2,1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && <EventTooltip event={event} />}
    </div>
  );
}

const styles = {
  fortName: {
    fontSize: 11,
    fontWeight: 600,
    color: '#e2ddf5',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  statusLine: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#8a7faa',
    marginTop: 2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  ownerLine: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#b8aed6',
    marginTop: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  countdown: {
    position: 'absolute',
    left: 'calc(100% + 5px)',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(224,169,85,0.16)',
    border: '1px solid rgba(224,169,85,0.6)',
    color: '#e0a955',
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'monospace',
    lineHeight: 1,
    padding: '3px 5px',
    borderRadius: 4,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  },
};

export default FortRow;
