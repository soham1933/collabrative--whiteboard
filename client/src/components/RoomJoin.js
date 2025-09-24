import React, { useState } from 'react';
import styles from './RoomJoin.module.css';

export default function RoomJoin({ onJoin }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  const join = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: code ? code.trim() : undefined,
          name: name.trim() || 'Anonymous',
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error: ${res.status} ${text}`);
      }

      const data = await res.json();
      onJoin(data.roomId, name || 'Anonymous');
    } catch (err) {
      console.error('Join failed:', err);
      alert('Could not join room: ' + err.message);
    }
  };

  return (
    <div className={styles['room-join']}>
      <h3>Join a whiteboard</h3>
      <input
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={styles.input}
      />
      <input
        placeholder="Room code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className={styles.input}
      />
      <div className={styles['button-group']}>
        <button onClick={join}>Join / Create</button>
      </div>
    </div>
  );
}
