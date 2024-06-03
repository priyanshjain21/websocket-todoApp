const io = require('socket.io-client');

const socket = io('http://localhost:4000', {
  path: '/socket.io',
});

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err);
});
