/**
 * Shared look for every hover tooltip (fort labels and timeline markers):
 * the dashboard's dark box, a plain grey header and field names, light
 * values, and fort stats (capture bonus) in the in-game gold.
 * Each tooltip adds its own positioning on top of `box`.
 */
const tooltipStyles = {
  box: {
    position: 'absolute',
    background: '#1c1a2e',
    border: '1px solid rgba(180,160,255,0.25)',
    borderRadius: 8,
    padding: '9px 12px 10px',
    boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
    zIndex: 60,
    pointerEvents: 'none',
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    color: '#a0a0a0',
    fontSize: 12,
    paddingBottom: 5,
    marginBottom: 5,
    borderBottom: '1px solid rgba(180,160,255,0.12)',
  },
  row: {
    color: '#e2ddf5',
  },
  key: {
    color: '#a0a0a0',
  },
  bonus: {
    color: '#f0c000',
    marginTop: 6,
    paddingTop: 5,
    borderTop: '1px solid rgba(180,160,255,0.12)',
  },
};

export default tooltipStyles;
