const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const roomsRouter = require('./rooms');
const socketHandlers = require('.'); // <-- updated socket handler

const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/rooms', roomsRouter);

// Simple health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Initialize socket handlers
socketHandlers(io);

const PORT = process.env.PORT || 8000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("✅ Connected to MongoDB Atlas");
  server.listen(PORT, () => console.log(`Server running on ${PORT}`));
})
.catch(err => {
  console.error("❌ Mongo connect error", err);
  server.listen(PORT, () => console.log(`Server running without DB on ${PORT}`));
});

// Serve React frontend
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Cleanup old rooms every hour
const Room = require('./Room');
setInterval(async () => {
  try {
    const cutoff = new Date(Date.now() - 24*60*60*1000);
    await Room.deleteMany({ lastActivity: { $lt: cutoff } });
  } catch (e) {
    console.error('Cleanup error', e);
  }
}, 60*60*1000);
