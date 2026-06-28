import { Server } from 'socket.io';

export function initSocket(httpServer, { corsOrigin }) {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin, // now supports array
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    socket.on('auth:join', ({ userId, role }) => {
      if (userId) socket.join(`user:${userId}`);
      if (role) socket.join(`role:${role}`);
    });
  });

  return io;
}

export function emitToRole(io, role, event, payload) {
  io.to(`role:${role}`).emit(event, payload);
}

export function emitToUser(io, userId, event, payload) {
  io.to(`user:${userId}`).emit(event, payload);
}

export function emitToAll(io, event, payload) {
  io.emit(event, payload);
}