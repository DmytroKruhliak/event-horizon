import React from 'react';
import tooltipStyles from './tooltipStyles';
import { fortInfo, statusInfo } from '../utils';

/**
 * FortInfoTooltip
 *
 * Shown when hovering a fort's row label: fort and territory, owner, status
 * (in the same colour as in the row label) and the fort's capture bonus.
 *
 * Props:
 *   fort — { fort, status, time, owner } from GET /api/forts
 */
function FortInfoTooltip({ fort }) {
  const info = fortInfo(fort.fort);
  const status = statusInfo(fort.status);

  return (
    <div style={styles.box}>
      <div style={tooltipStyles.header}>
        {fort.fort}{info && ` | ${info.territory}`}
      </div>
      <div style={tooltipStyles.row}>
        <span style={tooltipStyles.key}>Владелец : </span>{fort.owner || '—'}
      </div>
      <div style={tooltipStyles.row}>
        <span style={tooltipStyles.key}>Статус : </span>
        <span style={{ color: status.color, fontWeight: 600 }}>{status.label}</span>
      </div>
      {info && <div style={tooltipStyles.bonus}>{info.bonus}</div>}
    </div>
  );
}

const styles = {
  box: {
    ...tooltipStyles.box,
    left: 'calc(100% - 6px)',
    top: 2,
    width: 290,
  },
};

export default FortInfoTooltip;
