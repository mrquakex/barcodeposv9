import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Join admin room for role-based updates
    socket.on('join:admin', (adminId: string) => {
      socket.join(`admin:${adminId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Helper functions to emit events
export const emitDashboardUpdate = (adminId: string, data: any) => {
  if (io) {
    io.to(`admin:${adminId}`).emit('dashboard:update', data);
  }
};

export const emitAlert = (adminId: string, alert: any) => {
  if (io) {
    io.to(`admin:${adminId}`).emit('alert:new', alert);
  }
};

export const emitSystemHealth = (data: any) => {
  if (io) {
    io.emit('system:health', data);
  }
};

