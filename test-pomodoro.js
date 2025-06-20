// test-pomodoro.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  path: '/api/v0/pomodoro/ws',
  transports: ['websocket'],
  auth: { token: 'Bearer TU_JWT_AQUÍ' },
});

socket.on('connect', () => {
  console.log('Conectado con id', socket.id);
  socket.emit('join', { id: 'EL_ID_DE_TU_POMODORO' });
});

socket.on('status', data => {
  console.log('Status recibido:', data);
});

socket.on('error', err => {
  console.error('Error del gateway:', err);
});

