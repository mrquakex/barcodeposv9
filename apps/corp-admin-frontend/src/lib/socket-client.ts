import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (adminId?: string) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(import.meta.env.VITE_WS_URL || window.location.origin, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
    if (adminId) {
      socket.emit('join:admin', adminId);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    socket = initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Event listeners
export const onDashboardUpdate = (callback: (data: any) => void) => {
  const sock = getSocket();
  sock.on('dashboard:update', callback);
  return () => sock.off('dashboard:update', callback);
};

export const onAlert = (callback: (alert: any) => void) => {
  const sock = getSocket();
  sock.on('alert:new', callback);
  return () => sock.off('alert:new', callback);
};

export const onSystemHealth = (callback: (data: any) => void) => {
  const sock = getSocket();
  sock.on('system:health', callback);
  return () => sock.off('system:health', callback);
};

