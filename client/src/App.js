import React, { useState } from 'react';
import RoomJoin from './components/RoomJoin';
import Whiteboard from './components/Whiteboard';
 // include global styles

export default function App() {
  const [roomId, setRoomId] = useState(null);
  const [userName, setUserName] = useState(''); // store username

  const handleJoin = (joinedRoomId, name) => {
    setRoomId(joinedRoomId);
    setUserName(name);
  };

  const handleLeave = () => {
    setRoomId(null);
    setUserName('');
  };

  return (
    <div className="app">
      {/* 🌌 Animated star background */}
      <div className="space-background">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              top: `${Math.random() * window.innerHeight}px`,
              left: `${Math.random() * window.innerWidth}px`,
              animationDuration: `${50 + Math.random() * 50}s`,
            }}
          />
        ))}
      </div>

      {/* Join room or Whiteboard */}
      {!roomId ? (
        <RoomJoin onJoin={handleJoin} />
      ) : (
        <Whiteboard roomId={roomId} onLeave={handleLeave} userName={userName} />
      )}
    </div>
  );
}
