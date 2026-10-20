import React from 'react';
import tooltipStyles from './tooltipStyles';
import { formatDuration, formatServerTime, fortInfo } from '../utils';

/**
 * EventTooltip
 *
 * Rendered inside FortRow's siege markers and cooldown strips on hover, in
 * the same style as FortInfoTooltip: fort and territory, time, and the
 * original message. (The fort's bonus lives only in the row-label tooltip.)
 * Receives the full event JSON object, so any future fields added to the
 * event shape will automatically be accessible here for display.
 *
 * Props:
 *   event — full event object (startTime, name, description, duration,
 *            kind, owner, plus any future fields)
 */
function EventTooltip({ event }) {
  const info = fortInfo(event.fort);
  const startDate = formatServerTime(event.startTime, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div style={styles.box}>
      <div style={tooltipStyles.header}>
        {event.name}{info && ` | ${info.territory}`}
      </div>
      <div style={tooltipStyles.row}>
        <span style={tooltipStyles.key}>Time: </span>{startDate} · {formatDuration(event.duration)}
      </div>
      <div style={tooltipStyles.row}>
        <span style={tooltipStyles.key}>Message: </span>{event.description}
      </div>

      {/* Future fields: add extra rows here as the event shape grows */}
    </div>
  );
}

const styles = {
  box: {
    ...tooltipStyles.box,
    bottom: 'calc(100% + 8px)',
    left: 0,
    width: 260,
  },
};

export default EventTooltip;
