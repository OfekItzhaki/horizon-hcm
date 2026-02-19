import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../../common/services/cache.service';

export interface UserPresence {
  userId: string;
  status: 'online' | 'offline';
  lastSeen: Date;
  socketIds: string[];
}

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  private readonly PRESENCE_TTL = 60 * 60; // 1 hour
  private readonly HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

  constructor(private readonly cache: CacheService) {}

  /**
   * Set user as online
   */
  async setUserOnline(userId: string, socketId: string): Promise<void> {
    try {
      const key = `presence:${userId}`;
      const presence = await this.getUserPresence(userId);

      const updatedPresence: UserPresence = {
        userId,
        status: 'online',
        lastSeen: new Date(),
        socketIds: presence
          ? [...new Set([...presence.socketIds, socketId])]
          : [socketId],
      };

      await this.cache.set(key, updatedPresence, this.PRESENCE_TTL);
      this.logger.log(`User ${userId} is now online (socket: ${socketId})`);
    } catch (error) {
      this.logger.error(`Failed to set user online: ${error.message}`);
    }
  }

  /**
   * Set user as offline
   */
  async setUserOffline(userId: string, socketId: string): Promise<void> {
    try {
      const key = `presence:${userId}`;
      const presence = await this.getUserPresence(userId);

      if (!presence) return;

      // Remove socket ID from list
      const socketIds = presence.socketIds.filter((id) => id !== socketId);

      if (socketIds.length === 0) {
        // User is completely offline
        const updatedPresence: UserPresence = {
          userId,
          status: 'offline',
          lastSeen: new Date(),
          socketIds: [],
        };

        await this.cache.set(key, updatedPresence, this.PRESENCE_TTL);
        this.logger.log(`User ${userId} is now offline`);
      } else {
        // User still has other active connections
        const updatedPresence: UserPresence = {
          ...presence,
          socketIds,
          lastSeen: new Date(),
        };

        await this.cache.set(key, updatedPresence, this.PRESENCE_TTL);
        this.logger.log(
          `User ${userId} disconnected socket ${socketId}, but still has ${socketIds.length} active connection(s)`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to set user offline: ${error.message}`);
    }
  }

  /**
   * Get user presence
   */
  async getUserPresence(userId: string): Promise<UserPresence | null> {
    try {
      const key = `presence:${userId}`;
      return (await this.cache.get(key)) as UserPresence | null;
    } catch (error) {
      this.logger.error(`Failed to get user presence: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if user is online
   */
  async isUserOnline(userId: string): Promise<boolean> {
    const presence = await this.getUserPresence(userId);
    return presence?.status === 'online' && presence.socketIds.length > 0;
  }

  /**
   * Get all socket IDs for a user
   */
  async getUserSocketIds(userId: string): Promise<string[]> {
    const presence = await this.getUserPresence(userId);
    return presence?.socketIds || [];
  }

  /**
   * Get online users in a building
   */
  async getOnlineUsersInBuilding(buildingId: string): Promise<string[]> {
    try {
      // Get all users in building from cache or database
      const key = `building:${buildingId}:users`;
      const userIds = ((await this.cache.get(key)) as string[]) || [];

      // Check presence for each user
      const onlineUsers: string[] = [];
      for (const userId of userIds) {
        const isOnline = await this.isUserOnline(userId);
        if (isOnline) {
          onlineUsers.push(userId);
        }
      }

      return onlineUsers;
    } catch (error) {
      this.logger.error(
        `Failed to get online users in building: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Update heartbeat for user
   */
  async updateHeartbeat(userId: string): Promise<void> {
    try {
      const presence = await this.getUserPresence(userId);
      if (presence && presence.status === 'online') {
        const updatedPresence: UserPresence = {
          ...presence,
          lastSeen: new Date(),
        };
        await this.cache.set(
          `presence:${userId}`,
          updatedPresence,
          this.PRESENCE_TTL,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to update heartbeat: ${error.message}`);
    }
  }

  /**
   * Get presence statistics
   */
  async getPresenceStats(): Promise<{
    totalOnline: number;
    totalOffline: number;
  }> {
    try {
      // This is a simplified version
      // In production, you'd want to track this more efficiently
      const pattern = 'presence:*';
      const keys = await this.cache.keys(pattern);

      let totalOnline = 0;
      let totalOffline = 0;

      for (const key of keys) {
        const presence = (await this.cache.get(key)) as UserPresence;
        if (presence) {
          if (presence.status === 'online' && presence.socketIds.length > 0) {
            totalOnline++;
          } else {
            totalOffline++;
          }
        }
      }

      return { totalOnline, totalOffline };
    } catch (error) {
      this.logger.error(`Failed to get presence stats: ${error.message}`);
      return { totalOnline: 0, totalOffline: 0 };
    }
  }
}
