const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const roomsRouter = require('./routes/rooms');
const socketHandlers = require('./socket');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/rooms', roomsRouter);

// simple health
app.get('/api/health', (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

socketHandlers(io);

const PORT = process.env.REACT_APP_SERVER_URL ;
console.log("Mongo URI:", process.env.MONGO_URI);  // debug

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

const path = require('path');

app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// cleanup old rooms every hour
const Room = require('./models/Room');
setInterval(async () => {
  try {
    const cutoff = new Date(Date.now() - 24*60*60*1000);
    await Room.deleteMany({ lastActivity: { $lt: cutoff } });
  } catch (e) { console.error('cleanup error', e); }
}, 60*60*1000);
