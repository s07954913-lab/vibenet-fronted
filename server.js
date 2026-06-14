const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',   // ✅ Sab origins allow — development ke liye
    methods: ['GET', 'POST']
  }
});

app.use(express.static('public'));

// ─── Online users track karo ───
const onlineUsers = {};

io.on('connection', (socket) => {
  console.log('✅ New user connected:', socket.id);

  // ✅ FIX 1: join_room — user apni room mein join karo
  socket.on('join_room', (data) => {
    const { roomId, userId, username } = data;

    // Pehli room se niklo (agar pehle kisi room mein tha)
    const prevRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    prevRooms.forEach(r => socket.leave(r));

    // Naye room mein join karo
    socket.join(String(roomId));
    socket.userId   = String(userId);
    socket.username = username;
    socket.roomId   = String(roomId);

    onlineUsers[socket.id] = { userId, username, roomId };

    console.log(`👤 ${username} joined room: ${roomId}`);
  });

  // ✅ FIX 2: send_message — sirf usi room mein bhejo, aur sender_id + text sahi bhejo
  socket.on('send_message', (data) => {
    const { roomId, sender_id, username, text } = data;

    if (!text || !roomId) return; // blank message ignore karo

    console.log(`💬 Message in room ${roomId} from ${username}: ${text}`);

    // ✅ Sirf usi room ke logon ko bhejo (sender ke علاوہ)
    socket.to(String(roomId)).emit('receive_message', {
      sender_id: String(sender_id),
      username:  username,
      text:      text,
      time:      new Date().toLocaleTimeString('en-US', {
        hour:   '2-digit',
        minute: '2-digit'
      })
    });
  });

  // ✅ FIX 3: typing indicators — room mein broadcast karo
  socket.on('typing', (username) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('user_typing', username);
    }
  });

  socket.on('stop_typing', (username) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('stop_typing', username);
    }
  });

  // ✅ Purana join event bhi rakho (backward compatibility)
  socket.on('join', (username) => {
    socket.username = username;
    console.log(`Legacy join: ${username}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    delete onlineUsers[socket.id];
  });
});

server.listen(3000, () => {
  console.log('🚀 Server chal raha hai: http://localhost:3000');
});