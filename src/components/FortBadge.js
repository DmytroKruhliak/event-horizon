import React, { useState } from 'react';
import { FORT_FLAG_ICON, fortAbbr, fortColor } from '../utils';

/**
 * FortBadge
 *
 * The fort's icon: a ring in the fort's own colour with its two-letter
 * abbreviation on a tag below. Inside the ring is a fortress picture, or the
 * in-game fortress flag when no picture is given.
 *
 * Props:
 *   fort   — fort name as sent by the backend
 *   image  — optional picture filling the ring instead of the flag
 *   size   — ring diameter in px (default 30)
 *   dimmed — greyed out, for sieges that are over
 *   active — glowing ring, for a siege happening right now
 */
function FortBadge({ fort, image, size = 30, dimmed = false, active = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const color = fortColor(fort);

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      flexShrink: 0,
      filter: dimmed ? 'grayscale(0.8)' : 'none',
      opacity: dimmed ? 0.5 : 1,
    }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: fortColor(fort, 0.22),
        border: `2px solid ${color}`,
        boxShadow: active ? `0 0 0 3px rgba(224,85,85,0.35), 0 0 12px ${color}` : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}>
        {image && (
          <img
            src={image}
            alt=""
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        {!image && !imageFailed && (
          <img
            src={FORT_FLAG_ICON}
            alt=""
            width={size * 0.62}
            height={size * 0.62}
            style={{ display: 'block' }}
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      {/* Abbreviation tag — always readable, even if the flag image is unavailable */}
      <div style={{
        position: 'absolute',
        left: '50%',
        bottom: -5,
        transform: 'translateX(-50%)',
        background: color,
        color: '#0d0d14',
        fontSize: Math.max(8, Math.round(size * 0.28)),
        fontWeight: 700,
        fontFamily: 'monospace',
        lineHeight: 1,
        padding: '1px 3px',
        borderRadius: 3,
        whiteSpace: 'nowrap',
      }}>
        {fortAbbr(fort)}
      </div>
    </div>
  );
}

export default FortBadge;
