import { io } from 'socket.io-client';

let socket = null;
let lastAuth = null;
const subscribers = new Map(); // id → { listener, cleanups }
let subId = 0;

function notifySubscribers() {
  subscribers.forEach(({ listener }) => listener(socket));
}

export function connectSocket({ userId, role }) {
  const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
  lastAuth = { userId, role };

  if (!socket) {
    socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      timeout: 10000,
    });

    const joinRooms = () => {
      if (lastAuth?.userId && lastAuth?.role) {
        socket.emit('auth:join', lastAuth);
      }
      // Re-notify so components re-register their event listeners after reconnect
      notifySubscribers();
    };

    socket.on('connect', joinRooms);
    socket.on('reconnect', joinRooms);
    socket.on('connect_error', (err) => console.warn('[socket] connect_error', err?.message));
    socket.on('error', (err) => console.warn('[socket] error', err));
  } else {
    // Already connected — just join rooms
    socket.emit('auth:join', lastAuth);
  }

  notifySubscribers();
  return socket;
}

export function getSocket() {
  return socket;
}

/**
 * Subscribe to socket events.
 * The listener is called immediately (socket may be null if not yet connected),
 * AND again every time the socket connects/reconnects.
 *
 * Returns an unsubscribe function — call it in your useEffect cleanup.
 */
export function subscribeToSocket(listener) {
  const id = ++subId;
  subscribers.set(id, { listener });

  // Call immediately — socket might already be connected
  listener(socket);

  return () => {
    subscribers.delete(id);
  };
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
  socket = null;
  lastAuth = null;
  notifySubscribers();
}
