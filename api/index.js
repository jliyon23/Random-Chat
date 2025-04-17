// SERVER SIDE - index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store users waiting for a match
const waitingUsers = [];
// Store active connections
const connections = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User starting to search for chat
  socket.on('search', (username) => {
    console.log(`${username} is searching for a chat partner`);

    // Store user info
    const user = { id: socket.id, username };

    // Check if someone is waiting
    if (waitingUsers.length > 0) {
      // Get the first waiting user
      const partner = waitingUsers.shift();

      // Connect the two users
      connections[socket.id] = partner.id;
      connections[partner.id] = socket.id;

      // Inform both users they're connected
      socket.emit('connected', partner.username);
      io.to(partner.id).emit('connected', username);

    } else {
      // No one is waiting, add user to waiting list
      waitingUsers.push(user);
      socket.emit('waiting');
    }
  });

  // Message handling
  socket.on('message', (message) => {
    const partnerId = connections[socket.id];
    if (partnerId) {
      io.to(partnerId).emit('message', message);
    }
  });

  // End chat
  socket.on('end', () => {
    const partnerId = connections[socket.id];
    if (partnerId) {
      // Notify partner that chat has ended
      io.to(partnerId).emit('chat_ended');

      // Clear connections
      delete connections[partnerId];
      delete connections[socket.id];
    }

    // Remove from waiting list if there
    const waitingIndex = waitingUsers.findIndex(user => user.id === socket.id);
    if (waitingIndex !== -1) {
      waitingUsers.splice(waitingIndex, 1);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const partnerId = connections[socket.id];
    if (partnerId) {
      // Notify partner
      io.to(partnerId).emit('chat_ended');
      delete connections[partnerId];
      delete connections[socket.id];
    }

    // Remove from waiting list if there
    const waitingIndex = waitingUsers.findIndex(user => user.id === socket.id);
    if (waitingIndex !== -1) {
      waitingUsers.splice(waitingIndex, 1);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
