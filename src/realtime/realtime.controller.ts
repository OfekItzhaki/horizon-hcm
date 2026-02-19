import {
  Controller,
  Get,
  Req,
  Res,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PresenceService } from './services/presence.service';

@Controller('realtime')
export class RealtimeController {
  private readonly logger = new Logger(RealtimeController.name);
  private readonly connections = new Map<string, Response>();

  constructor(private readonly presenceService: PresenceService) {}

  /**
   * SSE endpoint for server-to-client updates (fallback for WebSocket)
   */
  @Get('sse')
  async streamEvents(
    @Req() req: Request,
    @Res() res: Response,
    @Query('userId') userId: string,
  ) {
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message
    this.sendEvent(res, 'connected', {
      message: 'Connected to SSE stream',
      userId,
      timestamp: new Date(),
    });

    // Store connection
    const connectionId = `${userId}-${Date.now()}`;
    this.connections.set(connectionId, res);

    this.logger.log(`SSE connection established for user ${userId}`);

    // Set user as online
    await this.presenceService.setUserOnline(userId, connectionId);

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(heartbeatInterval);
        return;
      }
      this.sendEvent(res, 'heartbeat', { timestamp: new Date() });
    }, 30000);

    // Handle client disconnect
    req.on('close', async () => {
      clearInterval(heartbeatInterval);
      this.connections.delete(connectionId);
      await this.presenceService.setUserOffline(userId, connectionId);
      this.logger.log(`SSE connection closed for user ${userId}`);
    });
  }

  /**
   * Get presence information
   */
  @Get('presence')
  async getPresence(@Query('userId') userId: string) {
    if (!userId) {
      return { error: 'userId is required' };
    }

    const presence = await this.presenceService.getUserPresence(userId);
    return presence || { status: 'offline' };
  }

  /**
   * Get online users in a building
   */
  @Get('presence/building')
  async getBuildingPresence(@Query('buildingId') buildingId: string) {
    if (!buildingId) {
      return { error: 'buildingId is required' };
    }

    const onlineUsers = await this.presenceService.getOnlineUsersInBuilding(
      buildingId,
    );
    return { buildingId, onlineUsers, count: onlineUsers.length };
  }

  /**
   * Get presence statistics
   */
  @Get('presence/stats')
  async getPresenceStats() {
    return await this.presenceService.getPresenceStats();
  }

  /**
   * Send event to a specific user via SSE
   */
  sendToUser(userId: string, event: string, data: any) {
    const userConnections = Array.from(this.connections.entries()).filter(
      ([id]) => id.startsWith(userId),
    );

    userConnections.forEach(([_, res]) => {
      this.sendEvent(res, event, data);
    });

    this.logger.log(`Sent ${event} to user ${userId} via SSE`);
  }

  /**
   * Broadcast event to all SSE connections
   */
  broadcast(event: string, data: any) {
    this.connections.forEach((res) => {
      this.sendEvent(res, event, data);
    });

    this.logger.log(`Broadcasted ${event} to ${this.connections.size} SSE connections`);
  }

  /**
   * Helper to send SSE event
   */
  private sendEvent(res: Response, event: string, data: any) {
    if (res.writableEnded) return;

    const payload = JSON.stringify(data);
    res.write(`event: ${event}\n`);
    res.write(`data: ${payload}\n\n`);
  }
}
