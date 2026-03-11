import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

const app = express();
app.use(cors());
app.use(express.json());

// Connect to the MongoDB from your docker-compose
const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:secretpassword@localhost:27017/nomsydb?authSource=admin';

mongoose.connect(MONGO_URI)
  .then(() => console.log('🚀 Connected to Nomsy DB'))
  .catch(err => console.error('DB Connection Error:', err));

const server = app.listen(3001, () => {
  console.log('📡 API running on http://localhost:3001');
});

// Setup Socket.io for the "Real-time" Trello magic
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  socket.on('card-move', (data) => {
    // Broadcast to everyone else so they see the card move instantly
    socket.broadcast.emit('card-moved', data);
  });
});
