const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { nanoid } = require('nanoid');

router.post('/join', async (req, res) => {
  const { roomId, name } = req.body;
  try {
    if (roomId) {
      let room = await Room.findOne({ roomId });
      if (!room) {
        room = new Room({ roomId });
        await room.save();
      }
      return res.json({ roomId: room.roomId, name: name || 'Anonymous' });
    }
    const newId = nanoid(6);
    const room = new Room({ roomId: newId });
    await room.save();
    return res.json({ roomId: room.roomId, name: name || 'Anonymous' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
console.log("Joining room:", roomId, "for user:", name);


module.exports = router;
