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
            style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}
          >
            {c.name && <div className="cursor-name">{c.name}</div>}
            <span
              className="dot"
              style={{
                background: c.color,
                boxShadow: `0 0 12px ${c.color}, 0 0 24px ${c.color}`,
              }}
            ></span>

            {trailMap[id] &&
              trailMap[id].map((pos, idx) => (
                <span
                  key={idx}
                  className="trail-dot"
                  style={{
                    left: `${(pos.x - c.x) * 100}%`,
                    top: `${(pos.y - c.y) * 100}%`,
                    background: c.color,
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
