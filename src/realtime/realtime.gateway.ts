import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { PresenceService } from './services/presence.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private heartbeatInterval: NodeJS.Timeout;

  constructor(
    private readonly presenceService: PresenceService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Initialize gateway with Redis adapter for multi-instance support
   */
  async afterInit(server: Server) {
    try {
      // Set up Redis adapter for multi-instance WebSocket support
      const redisHost = this.configService.get<string>('REDIS_HOST') || 'localhost';
      const redisPort = this.configService.get<number>('REDIS_PORT') || 6379;

      const pubClient = createClient({
        socket: { host: redisHost, port: redisPort },
      });
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      // Use the adapter method correctly
      const redisAdapter = createAdapter(pubClient, subClient);
      server.adapter(redisAdapter);

      this.logger.log('Redis adapter configured for WebSocket gateway');

      // Start heartbeat mechanism (ping every 30 seconds)
      this.startHeartbeat();
    } catch (error) {
      this.logger.warn(`Redis adapter setup skipped: ${error.message}`);
      this.logger.log('Running in single-instance mode (no Redis adapter)');
      // Continue without Redis adapter (single instance mode)
      this.startHeartbeat();
    }
  }

  /**
   * Start heartbeat mechanism to keep connections alive
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.server.emit('heartbeat', { timestamp: new Date() });
    }, 30000); // 30 seconds

    this.logger.log('Heartbeat mechanism started (30s interval)');
  }

  /**
   * Clean up on shutdown
   */
  onModuleDestroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket) {
    try {
      // Extract user ID from handshake (auth token should be validated here)
      const userId = this.extractUserIdFromSocket(client);

      if (!userId) {
        this.logger.warn(`Connection rejected: No user ID found`);
        client.disconnect();
        return;
      }

      this.logger.log(`Client connected: ${client.id}, User: ${userId}`);

      // Track user presence
      await this.presenceService.setUserOnline(userId, client.id);

      // Store user ID on socket for later use
      client.data.userId = userId;

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to realtime server',
        socketId: client.id,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  async handleDisconnect(client: Socket) {
    try {
      const userId = client.data.userId;

      if (userId) {
        this.logger.log(`Client disconnected: ${client.id}, User: ${userId}`);
        await this.presenceService.setUserOffline(userId, client.id);
      }
    } catch (error) {
      this.logger.error(`Disconnection error: ${error.message}`);
    }
  }

  /**
   * Join a room (e.g., building, apartment)
   */
  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    try {
      const { room } = data;
      const userId = client.data.userId;

      if (!room) {
        client.emit('error', { message: 'Room name is required' });
        return;
      }

      await client.join(room);
      this.logger.log(`User ${userId} joined room: ${room}`);

      // Notify room members
      this.server.to(room).emit('user-joined', {
        userId,
        room,
        timestamp: new Date(),
      });

      client.emit('joined-room', { room, success: true });
    } catch (error) {
      this.logger.error(`Join room error: ${error.message}`);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  /**
   * Leave a room
   */
  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    try {
      const { room } = data;
      const userId = client.data.userId;

      if (!room) {
        client.emit('error', { message: 'Room name is required' });
        return;
      }

      await client.leave(room);
      this.logger.log(`User ${userId} left room: ${room}`);

      // Notify room members
      this.server.to(room).emit('user-left', {
        userId,
        room,
        timestamp: new Date(),
      });

      client.emit('left-room', { room, success: true });
    } catch (error) {
      this.logger.error(`Leave room error: ${error.message}`);
      client.emit('error', { message: 'Failed to leave room' });
    }
  }

  /**
   * Send message to a room
   */
  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string; message: string; type?: string },
  ) {
    try {
      const { room, message, type = 'text' } = data;
      const userId = client.data.userId;

      if (!room || !message) {
        client.emit('error', { message: 'Room and message are required' });
        return;
      }

      // Broadcast message to room
      this.server.to(room).emit('message', {
        userId,
        room,
        message,
        type,
        timestamp: new Date(),
      });

      this.logger.log(`Message sent to room ${room} by user ${userId}`);
    } catch (error) {
      this.logger.error(`Send message error: ${error.message}`);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  /**
   * Heartbeat/ping to keep connection alive
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date() });
  }

  /**
   * Broadcast event to a specific room
   */
  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
    this.logger.log(`Broadcasted ${event} to room: ${room}`);
  }

  /**
   * Broadcast to multiple rooms
   */
  broadcastToRooms(rooms: string[], event: string, data: any) {
    rooms.forEach((room) => {
      this.server.to(room).emit(event, data);
    });
    this.logger.log(`Broadcasted ${event} to ${rooms.length} rooms`);
  }

  /**
   * Broadcast to all connected clients
   */
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`Broadcasted ${event} to all clients`);
  }

  /**
   * Send event to a specific user
   */
  async sendToUser(userId: string, event: string, data: any) {
    const socketIds = await this.presenceService.getUserSocketIds(userId);

    socketIds.forEach((socketId) => {
      this.server.to(socketId).emit(event, data);
    });

    this.logger.log(`Sent ${event} to user: ${userId} (${socketIds.length} connections)`);
  }

  /**
   * Send event to multiple users
   */
  async sendToUsers(userIds: string[], event: string, data: any) {
    for (const userId of userIds) {
      await this.sendToUser(userId, event, data);
    }
    this.logger.log(`Sent ${event} to ${userIds.length} users`);
  }

  /**
   * Get all rooms a socket is in
   */
  getSocketRooms(socketId: string): Set<string> {
    const socket = this.server.sockets.sockets.get(socketId);
    return socket ? socket.rooms : new Set();
  }

  /**
   * Get all sockets in a room
   */
  async getRoomSockets(room: string): Promise<string[]> {
    const sockets = await this.server.in(room).fetchSockets();
    return sockets.map((socket) => socket.id);
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      connectedClients: this.server.sockets.sockets.size,
      rooms: Array.from(this.server.sockets.adapter.rooms.keys()).filter(
        (room) => !this.server.sockets.sockets.has(room), // Filter out socket IDs
      ),
    };
  }

  /**
   * Extract user ID from socket handshake
   * In production, this should validate JWT token
   */
  private extractUserIdFromSocket(client: Socket): string | null {
    try {
      // Option 1: From query parameters
      const userId = client.handshake.query.userId as string;
      if (userId) return userId;

      // Option 2: From auth token (JWT)
      const token = client.handshake.auth.token;
      if (token) {
        // TODO: Validate JWT and extract user ID
        // const decoded = this.jwtService.verify(token);
        // return decoded.sub;
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to extract user ID: ${error.message}`);
      return null;
    }
  }
}
