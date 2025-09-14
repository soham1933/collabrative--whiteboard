import React, { useState, useEffect } from 'react';
import './uc.module.css';

export default function UserCursors({ cursors }) {
  const [trailMap, setTrailMap] = useState({});

  useEffect(() => {
    const newTrailMap = {};
    for (const [id, c] of Object.entries(cursors)) {
      if (c && c.active) {
        const prev = trailMap[id] || [];
        const updated = [...prev, { x: c.x, y: c.y }].slice(-10);
        newTrailMap[id] = updated;
      }
    }
    setTrailMap(newTrailMap);
  }, [cursors]);

  return (
    <>
      {Object.entries(cursors).map(([id, c]) =>
        c && c.active ? (
          <div
            key={id}
            className="user-cursor"
            style={{
              left: `${c.x * 100}%`,
              top: `${c.y * 100}%`,
              zIndex: 1000,
              position: 'absolute',
              pointerEvents: 'none',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Username */}
           {c.name && (
  <div
    className="cursor-name"
    style={{
      background: c.color || '#0ff', // colored rectangle matching cursor
      color: '#000', // text color inside rectangle
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '0.8rem',
      fontWeight: 'bold',
      marginBottom: '4px',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      pointerEvents: 'none',
      textAlign: 'center',
    }}
  >
    {c.name}
  </div>
)}


            {/* Cursor dot */}
            <span
              className="dot"
              style={{
                background: c.color || '#0ff',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                boxShadow: `0 0 8px ${c.color || '#0ff'}, 0 0 16px ${c.color || '#0ff'}`,
                display: 'block',
              }}
            ></span>

            {/* Trail dots */}
            {trailMap[id] &&
              trailMap[id].map((pos, idx) => (
                <span
                  key={idx}
                  className="trail-dot"
                  style={{
                    position: 'absolute',
                    left: `${(pos.x - c.x) * 100}%`,
                    top: `${(pos.y - c.y) * 100}%`,
                    background: c.color || '#0ff',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    opacity: (idx + 1) / trailMap[id].length / 1.5,
                    transform: `scale(${(idx + 1) / trailMap[id].length})`,
                  }}
                ></span>
              ))}
          </div>
        ) : null
      )}
    </>
  );
}
