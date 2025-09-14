import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import DrawingCanvas from './DrawingCanvas';
import Toolbar from './Toolbar';
import UserCursors from './UserCursors';
import styles from './white.module.css';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (process.env.REACT_APP_SERVER_URL || '') || '';

export default function Whiteboard({ roomId, onLeave, userName }) {
  const socketRef = useRef();
  const [usersCount, setUsersCount] = useState(1);
  const [cursors, setCursors] = useState({});
  const [myColor, setMyColor] = useState('#000');
  const [copied, setCopied] = useState(false); // Tooltip state

  useEffect(() => {
    socketRef.current = io(SOCKET_URL || '/');
    const socket = socketRef.current;

    socket.emit('join-room', { roomId });

    socket.on('joined', ({ color }) => setMyColor(color || '#000'));
    socket.on('user-count', ({ count }) => setUsersCount(count));
    socket.on('cursor-update', ({ socketId, x, y, active, color }) => {
      setCursors(prev => ({ ...prev, [socketId]: { x, y, active, color } }));
    });
    socket.on('cursor-remove', ({ socketId }) => {
      setCursors(prev => { const p = { ...prev }; delete p[socketId]; return p; });
    });
    socket.on('load-canvas', (commands) => {
      window.dispatchEvent(new CustomEvent('wb-load-canvas', { detail: commands }));
    });
    socket.on('clear-canvas', () => window.dispatchEvent(new Event('wb-clear-canvas')));

    return () => {
      socket.emit('leave-room', { roomId });
      socket.disconnect();
    };
  }, [roomId]);

  // ✨ Copy room ID with tooltip
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500); // hide tooltip after 1.5s
      })
      .catch(() => setCopied(false));
  };

  return (
    <div className={styles.whiteboard}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.status}>
          Room: <strong>{roomId}</strong> • Users: {usersCount}
        </div>
        <div style={{ flex: 1 }} />

        <div style={{ position: 'relative' }}>
          <button onClick={copyRoomId}>Copy Room ID</button>
          {copied && <span className={styles.tooltip}>Copied!</span>}
        </div>

        <button onClick={onLeave}>Leave</button>
      </div>

      <Toolbar socketRef={socketRef} roomId={roomId} myColor={myColor} />

      {/* Board area */}
      <div className={styles.canvasArea}>
        <div className={styles.drawingCanvas}>
          <div className={styles.boardText}>Welcome to soham's new project</div>
          <DrawingCanvas socketRef={socketRef} roomId={roomId} myColor={myColor} />
          <UserCursors cursors={cursors} />
        </div>
      </div>
    </div>
  );
}
