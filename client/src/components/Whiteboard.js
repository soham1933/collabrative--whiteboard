import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import DrawingCanvas from './DrawingCanvas';
import Toolbar from './Toolbar';
import UserCursors from './UserCursors';
import styles from './white.module.css';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_SERVER_URL || '';

export default function Whiteboard({ roomId, onLeave, userName }) {
  const socketRef = useRef();
  const canvasRef = useRef();
  const [usersCount, setUsersCount] = useState(1);
  const [cursors, setCursors] = useState({});
  const [myColor, setMyColor] = useState('');
  const [copied, setCopied] = useState(false);
  const strokesRef = useRef([]); // store all strokes for new users

  const getRandomColor = () => {
    const colors = ['#0ff', '#f0f', '#ff0', '#0f0', '#f80', '#08f'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  useEffect(() => {
    socketRef.current = io(SOCKET_URL || '/');
    const socket = socketRef.current;

    const userColor = getRandomColor();
    setMyColor(userColor);

    socket.emit('join-room', { roomId, name: userName || 'Guest', color: userColor });

    // Send existing strokes to new user
    socket.on('request-canvas', () => {
      socket.emit('load-strokes', { roomId, strokes: strokesRef.current });
    });

    socket.on('user-count', ({ count }) => setUsersCount(count));

    socket.on('cursor-update', ({ socketId, x, y, active, color, name }) => {
      setCursors(prev => ({
        ...prev,
        [socketId]: { x, y, active, color, name },
      }));
    });

    socket.on('cursor-remove', ({ socketId }) => {
      setCursors(prev => {
        const copy = { ...prev };
        delete copy[socketId];
        return copy;
      });
    });

    // Load strokes for this client
    socket.on('load-canvas', commands => {
      window.dispatchEvent(new CustomEvent('wb-load-canvas', { detail: commands }));
      // Store strokes locally
      strokesRef.current = commands.filter(cmd => cmd.type === 'stroke');
    });

    socket.on('clear-canvas', () => {
      window.dispatchEvent(new Event('wb-clear-canvas'));
      strokesRef.current = [];
    });

    socket.on('stroke-added', ({ command }) => {
      strokesRef.current.push(command);
    });

    return () => {
      socket.emit('leave-room', { roomId });
      socket.disconnect();
    };
  }, [roomId, userName]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => setCopied(false));
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    socketRef.current?.emit('cursor-update', {
      roomId,
      x,
      y,
      active: true,
      color: myColor,
      name: userName || 'Guest',
    });
  };

  return (
    <div className={styles.whiteboard}>
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

      <div
        className={styles.canvasArea}
        onMouseMove={handleMouseMove}
      >
        <div className={styles.drawingCanvas} ref={canvasRef}>
          <div className={styles.boardText}>Welcome to soham's new project</div>
          <DrawingCanvas
            socketRef={socketRef}
            roomId={roomId}
            myColor={myColor}
            cursors={cursors}
          />
        </div>
      </div>
    </div>
  );
}
