// // socket/index.js
// module.exports = function socketHandlers(io) {
//   const rooms = {}; // roomId -> { users: { socketId: { name, color } } }

//   function randomColor() {
//     const colors = ['#0ff', '#f0f', '#ff0', '#f00', '#0f0', '#00f'];
//     return colors[Math.floor(Math.random() * colors.length)];
//   }

//   io.on('connection', (socket) => {
//     console.log('New connection:', socket.id);

//     // ✅ Join room
//     socket.on('join-room', ({ roomId, name }) => {
//       socket.join(roomId);

//       if (!rooms[roomId]) rooms[roomId] = { users: {} };
//       rooms[roomId].users[socket.id] = { name, color: randomColor() };

//       const color = rooms[roomId].users[socket.id].color;
//       socket.emit('joined', { color });

//       io.to(roomId).emit('user-count', {
//         count: Object.keys(rooms[roomId].users).length,
//       });
//     });

//     // ✅ Cursor updates
//     socket.on('cursor-update', ({ roomId, x, y, active }) => {
//       const user = rooms[roomId]?.users[socket.id];
//       if (!user) return;

//       io.to(roomId).emit('cursor-update', {
//         socketId: socket.id,
//         x,
//         y,
//         active,
//         color: user.color,
//         name: user.name,
//       });
//     });

//     // ✅ Drawing sync
//     socket.on('draw-start', ({ roomId, stroke }) => {
//       socket.to(roomId).emit('draw-start', { stroke });
//     });

//     socket.on('draw-end', ({ roomId, command }) => {
//       socket.to(roomId).emit('draw-end', { command });
//     });

//     // ✅ Clear canvas (only once!)
//     socket.on('clear-canvas', ({ roomId }) => {
//       io.to(roomId).emit('clear-canvas');
//     });

//     // ✅ Leave room
//     socket.on('leave-room', ({ roomId }) => {
//       socket.leave(roomId);
//       if (rooms[roomId]) {
//         delete rooms[roomId].users[socket.id];

//         io.to(roomId).emit('user-count', {
//           count: Object.keys(rooms[roomId].users).length,
//         });
//         io.to(roomId).emit('cursor-remove', { socketId: socket.id });

//         // Clean up empty room
//         if (Object.keys(rooms[roomId].users).length === 0) {
//           delete rooms[roomId];
//         }
//       }
//     });

//     // ✅ Disconnect cleanup
//     socket.on('disconnect', () => {
//       for (const roomId in rooms) {
//         if (rooms[roomId].users[socket.id]) {
//           delete rooms[roomId].users[socket.id];

//           io.to(roomId).emit('user-count', {
//             count: Object.keys(rooms[roomId].users).length,
//           });
//           io.to(roomId).emit('cursor-remove', { socketId: socket.id });

//           if (Object.keys(rooms[roomId].users).length === 0) {
//             delete rooms[roomId];
//           }
//         }
//       }
//     });
//   });
// };


module.exports = function socketHandlers(io) {
  const rooms = {}; // roomId -> { users: {}, strokes: [] }

  function randomColor() {
    const colors = ['#0ff', '#f0f', '#ff0', '#f00', '#0f0', '#00f'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    socket.on('join-room', ({ roomId, name, color }) => {
      socket.join(roomId);

      if (!rooms[roomId]) rooms[roomId] = { users: {}, strokes: [] };
      rooms[roomId].users[socket.id] = { name, color: color || randomColor() };

      // Send color and existing strokes to client
      socket.emit('joined', { color: rooms[roomId].users[socket.id].color, strokes: rooms[roomId].strokes });

      io.to(roomId).emit('user-count', { count: Object.keys(rooms[roomId].users).length });
    });

    socket.on('cursor-update', ({ roomId, x, y, active }) => {
      const user = rooms[roomId]?.users[socket.id];
      if (!user) return;
      io.to(roomId).emit('cursor-update', {
        socketId: socket.id, x, y, active, color: user.color, name: user.name,
      });
    });

    socket.on('draw-start', ({ roomId, stroke }) => socket.to(roomId).emit('draw-start', { stroke }));
    socket.on('draw-move', ({ roomId, points, color, width }) => socket.to(roomId).emit('draw-move', { points, color, width }));

    socket.on('draw-end', ({ roomId, command }) => {
      if (!rooms[roomId].strokes) rooms[roomId].strokes = [];
      rooms[roomId].strokes.push(command);
      socket.to(roomId).emit('draw-end', { command });
    });

    socket.on('clear-canvas', ({ roomId }) => {
      if (rooms[roomId]) rooms[roomId].strokes = [];
      io.to(roomId).emit('clear-canvas');
    });

    socket.on('leave-room', ({ roomId }) => {
      socket.leave(roomId);
      if (rooms[roomId]) {
        delete rooms[roomId].users[socket.id];
        io.to(roomId).emit('user-count', { count: Object.keys(rooms[roomId].users).length });
        io.to(roomId).emit('cursor-remove', { socketId: socket.id });
      }
    });

    socket.on('disconnect', () => {
      for (const roomId in rooms) {
        if (rooms[roomId].users[socket.id]) {
          delete rooms[roomId].users[socket.id];
          io.to(roomId).emit('user-count', { count: Object.keys(rooms[roomId].users).length });
          io.to(roomId).emit('cursor-remove', { socketId: socket.id });
        }
      }
    });
  });
};
