const Room = require('../models/Room');

module.exports = (io) => {
  const roomsUsers = {};

  io.on('connection', (socket) => {
    console.log('client connected', socket.id);

    socket.on('join-room', async ({ roomId }) => {
      try {
        socket.join(roomId);
        const palette = ['#e6194b','#3cb44b','#4363d8','#f58231','#42d4f4'];
        const color = palette[Math.floor(Math.random()*palette.length)];
        if (!roomsUsers[roomId]) roomsUsers[roomId] = {};
        roomsUsers[roomId][socket.id] = { color };

        const usersCount = Object.keys(roomsUsers[roomId]).length;
        io.to(roomId).emit('user-count', { count: usersCount });

        const room = await Room.findOne({ roomId });
        if (room && room.drawingData && room.drawingData.length) {
          socket.emit('load-canvas', room.drawingData);
        }

        socket.emit('joined', { socketId: socket.id, color });
      } catch (e) { console.error('join-room error', e); }
    });

    socket.on('cursor-move', ({ roomId, x, y, active }) => {
      socket.to(roomId).emit('cursor-update', { socketId: socket.id, x, y, active, color: roomsUsers[roomId] && roomsUsers[roomId][socket.id].color });
    });

    socket.on('draw-start', ({ roomId, stroke }) => {
      socket.to(roomId).emit('draw-start', { socketId: socket.id, stroke });
    });

    socket.on('draw-move', ({ roomId, points }) => {
      socket.to(roomId).emit('draw-move', { socketId: socket.id, points });
    });

    socket.on('draw-end', async ({ roomId, command }) => {
      socket.to(roomId).emit('draw-end', { socketId: socket.id, command });
      try {
        await Room.updateOne({ roomId }, { $push: { drawingData: command }, $set: { lastActivity: new Date() } }, { upsert: true });
      } catch (err) { console.error('persist error', err); }
    });

    socket.on('clear-canvas', async ({ roomId }) => {
      socket.to(roomId).emit('clear-canvas');
      try {
        await Room.updateOne({ roomId }, { $push: { drawingData: { type: 'clear', data: {}, timestamp: new Date() } }, $set: { lastActivity: new Date() } }, { upsert: true });
      } catch (err) { console.error(err); }
    });

    socket.on('leave-room', ({ roomId }) => {
      socket.leave(roomId);
      if (roomsUsers[roomId]) delete roomsUsers[roomId][socket.id];
      const usersCount = roomsUsers[roomId] ? Object.keys(roomsUsers[roomId]).length : 0;
      io.to(roomId).emit('user-count', { count: usersCount });
    });

    socket.on('disconnect', () => {
      for (const roomId of Object.keys(roomsUsers)) {
        if (roomsUsers[roomId][socket.id]) {
          delete roomsUsers[roomId][socket.id];
          const usersCount = Object.keys(roomsUsers[roomId]).length;
          io.to(roomId).emit('user-count', { count: usersCount });
          io.to(roomId).emit('cursor-remove', { socketId: socket.id });
        }
      }
      console.log('client disconnected', socket.id);
    });
  });
};
