import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { WebSocketStore } from './types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  // State
  connected: false,
  socket: null,

  // Actions
  connect: () => {
    const { socket: existingSocket } = get();

    // Don't create a new connection if already connected
    if (existingSocket?.connected) {
      return;
    }

    // Disconnect existing socket if any
    if (existingSocket) {
      existingSocket.disconnect();
    }

    // Create new socket connection
    const socket: Socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      set({ connected: true });
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      set({ connected: false });
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      set({ connected: false });
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[WebSocket] Reconnected after', attemptNumber, 'attempts');
      set({ connected: true });
    });

    socket.on('reconnect_error', (error) => {
      console.error('[WebSocket] Reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed');
      set({ connected: false });
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
      console.log('[WebSocket] Manually disconnected');
    }
  },

  emit: (event: string, data: any) => {
    const { socket, connected } = get();
    if (socket && connected) {
      socket.emit(event, data);
    } else {
      console.warn('[WebSocket] Cannot emit - not connected');
    }
  },

  on: (event: string, callback: (data: any) => void) => {
    const { socket } = get();
    if (socket) {
      socket.on(event, callback);
    } else {
      console.warn('[WebSocket] Cannot listen - socket not initialized');
    }
  },
}));
