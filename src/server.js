require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const createApp = require('./app');

const PORT = process.env.PORT || 5000;

const server = http.createServer();

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket'],
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`Socket disconnected: ${socket.id}`));
});

const app = createApp(io);
server.on('request', app);

server.listen(PORT, () => {
  console.log(`Smart Road Monitoring API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
