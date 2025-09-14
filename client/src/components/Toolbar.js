import React from 'react';
import styles from './tool.module.css';

export default function Toolbar({ socketRef, roomId, myColor }) {
  const clear = () => {
    // Notify server to clear the canvas for all users
    socketRef.current?.emit('clear-canvas', { roomId });
    // Also clear locally
    window.dispatchEvent(new Event('wb-clear-canvas'));
  };

  return (
    <div className={styles.toolbar}>
      <label>
        Stroke: <input id="strokeRange" type="range" min="1" max="12" defaultValue="3" />
      </label>
      <label>
        Color:
        <select id="strokeColor">
          <option value="#000000">Black</option>
          <option value="#e6194b">Red</option>
          <option value="#4363d8">Blue</option>
          <option value="#3cb44b">Green</option>
        </select>
      </label>
      <button onClick={clear}>Clear</button>
    </div>
  );
}
