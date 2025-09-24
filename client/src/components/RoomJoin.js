import React, { useState } from 'react';
import styles from './RoomJoin.module.css';

export default function RoomJoin({ onJoin }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState(''); // new username state

const join = async () => {
  try {
    const res = await fetch(
      process.env.REACT_APP_SERVER_URL + '/api/rooms/join',
      {
        method: 'POST',
        headers: { 'Content-Type': 'json' },
        body: JSON.stringify({
          roomId: code ? code.trim() : undefined,
          name: name.trim() || 'Anonymous',
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text(); // fallback to text for debugging
      throw new Error(`Server error: ${res.status} ${text}`);
    }

    const data = await res.json(); // parse only if valid JSON
    onJoin(data.roomId, name || 'Anonymous');
  } catch (err) {
    console.error('Join failed:', err);
    alert('Could not join room: ' + err.message);
  }
};

  const createNew = () => join();

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
        <button onClick={createNew}>Create Random</button>
      </div>
    </div>
  );
}
