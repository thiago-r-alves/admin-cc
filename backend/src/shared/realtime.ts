import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;
const driverSockets: Record<string, Set<string>> = {};

export const attachRealtime = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket: Socket) => {
    socket.on('register_driver', (userId: string) => {
      if (!driverSockets[userId]) driverSockets[userId] = new Set();
      driverSockets[userId].add(socket.id);
    });

    socket.on('disconnect', () => {
      Object.values(driverSockets).forEach((set) => set.delete(socket.id));
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.IO ainda não foi inicializado.');
  }
  return io;
};

export const emitOrdersUpdated = () => {
  if (io) {
    io.emit('orders_updated');
  }
};

export const emitOrderCompleted = (payload: Record<string, unknown>) => {
  if (io) {
    io.emit('order_completed', payload);
  }
};

export const notifyDriver = (driverId: string) => {
  if (!io) return;

  const sockets = driverSockets[driverId];
  if (sockets) {
    sockets.forEach((socketId) => {
      io?.to(socketId).emit('orders_updated');
    });
  }
};

export const notifyDrivers = () => {
  emitOrdersUpdated();
};
