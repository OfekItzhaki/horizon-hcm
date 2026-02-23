import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@horizon-hcm/shared';

const WS_URL = 'http://localhost:3001';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageQueue: Array<{ event: string; data: any }> = [];

  connect() {
    if (this.socket?.connected) {
      return;
    }

    const token = useAuthStore.getState().accessToken;
    if (!token) {
      console.warn('Cannot connect to WebSocket: No access token');
      return;
    }

    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.flushMessageQueue();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      // Queue message for later
      this.messageQueue.push({ event, data });
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.emit(message.event, message.data);
      }
    }
  }

  joinBuilding(buildingId: string) {
    this.emit('join:building', { buildingId });
  }

  leaveBuilding(buildingId: string) {
    this.emit('leave:building', { buildingId });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
