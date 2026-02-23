import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { generateId } from '../../common/utils/id-generator';

export interface SyncDelta {
  entityType: string;
  created: any[];
  updated: any[];
  deleted: string[]; // IDs of deleted records
  newSyncTimestamp: Date;
}

export interface SyncOperation {
  entityType: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  clientTimestamp: Date;
}

export interface ConflictResolutionResult {
  resolved: boolean;
  winner: 'client' | 'server';
  reason: string;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('sync-operations') private readonly syncQueue: Queue,
  ) {}

  /**
   * Get delta changes for a specific entity type since last sync
   */
  async getDelta(userId: string, entityType: string, lastSyncTimestamp: Date): Promise<SyncDelta> {
    this.logger.log(
      `Getting delta for user ${userId}, entity ${entityType}, since ${lastSyncTimestamp}`,
    );

    const newSyncTimestamp = new Date();
    let created: any[] = [];
    let updated: any[] = [];
    const deleted: string[] = [];

    // Query based on entity type
    switch (entityType) {
      case 'building':
        const buildings = await this.prisma.buildings.findMany({
          where: {
            updated_at: {
              gt: lastSyncTimestamp,
            },
          },
        });
        // Separate created vs updated based on created_at
        created = buildings.filter((b) => b.created_at > lastSyncTimestamp);
        updated = buildings.filter((b) => b.created_at <= lastSyncTimestamp);
        break;

      case 'apartment':
        const apartments = await this.prisma.apartments.findMany({
          where: {
            updated_at: {
              gt: lastSyncTimestamp,
            },
          },
        });
        created = apartments.filter((a) => a.created_at > lastSyncTimestamp);
        updated = apartments.filter((a) => a.created_at <= lastSyncTimestamp);
        break;

      case 'user_profile':
        const profiles = await this.prisma.user_profiles.findMany({
          where: {
            updated_at: {
              gt: lastSyncTimestamp,
            },
          },
        });
        created = profiles.filter((p) => p.created_at > lastSyncTimestamp);
        updated = profiles.filter((p) => p.created_at <= lastSyncTimestamp);
        break;

      default:
        this.logger.warn(`Unknown entity type: ${entityType}`);
    }

    // Note: Soft deletes would be tracked here if implemented
    // For now, hard deletes are not tracked in delta sync

    return {
      entityType,
      created,
      updated,
      deleted,
      newSyncTimestamp,
    };
  }

  /**
   * Apply sync operations from client
   */
  async applyOperations(
    userId: string,
    operations: SyncOperation[],
  ): Promise<{ success: boolean; errors: string[] }> {
    this.logger.log(`Applying ${operations.length} operations for user ${userId}`);

    const errors: string[] = [];

    for (const operation of operations) {
      try {
        await this.applyOperation(userId, operation);
      } catch (error) {
        this.logger.error(`Failed to apply operation: ${error.message}`, error.stack);
        errors.push(`${operation.entityType} ${operation.operation}: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }

  /**
   * Apply a single sync operation with conflict resolution
   */
  private async applyOperation(userId: string, operation: SyncOperation): Promise<void> {
    const { entityType, operation: op, data } = operation;

    // Check for conflicts before applying
    if (op === 'update' || op === 'delete') {
      const conflict = await this.detectConflict(entityType, data.id, operation.clientTimestamp);

      if (conflict) {
        const resolution = this.resolveConflict(
          operation.clientTimestamp,
          conflict.serverTimestamp,
        );

        if (resolution.winner === 'server') {
          this.logger.warn(
            `Conflict detected for ${entityType} ${data.id}: ${resolution.reason}. Server version wins.`,
          );
          // Log unresolvable conflict for user notification
          await this.logConflict(userId, entityType, data.id, resolution);
          return; // Skip applying client operation
        }

        this.logger.log(
          `Conflict detected for ${entityType} ${data.id}: ${resolution.reason}. Client version wins.`,
        );
      }
    }

    switch (entityType) {
      case 'building':
        if (op === 'create') {
          await this.prisma.buildings.create({ data });
        } else if (op === 'update') {
          await this.prisma.buildings.update({
            where: { id: data.id },
            data,
          });
        } else if (op === 'delete') {
          await this.prisma.buildings.delete({
            where: { id: data.id },
          });
        }
        break;

      case 'apartment':
        if (op === 'create') {
          await this.prisma.apartments.create({ data });
        } else if (op === 'update') {
          await this.prisma.apartments.update({
            where: { id: data.id },
            data,
          });
        } else if (op === 'delete') {
          await this.prisma.apartments.delete({
            where: { id: data.id },
          });
        }
        break;

      case 'user_profile':
        if (op === 'create') {
          await this.prisma.user_profiles.create({ data });
        } else if (op === 'update') {
          await this.prisma.user_profiles.update({
            where: { id: data.id },
            data,
          });
        } else if (op === 'delete') {
          await this.prisma.user_profiles.delete({
            where: { id: data.id },
          });
        }
        break;

      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Detect if there's a conflict between client and server versions
   */
  private async detectConflict(
    entityType: string,
    entityId: string,
    clientTimestamp: Date,
  ): Promise<{ serverTimestamp: Date } | null> {
    let serverRecord: any = null;

    switch (entityType) {
      case 'building':
        serverRecord = await this.prisma.buildings.findUnique({
          where: { id: entityId },
          select: { updated_at: true },
        });
        break;

      case 'apartment':
        serverRecord = await this.prisma.apartments.findUnique({
          where: { id: entityId },
          select: { updated_at: true },
        });
        break;

      case 'user_profile':
        serverRecord = await this.prisma.user_profiles.findUnique({
          where: { id: entityId },
          select: { updated_at: true },
        });
        break;
    }

    if (!serverRecord) {
      return null; // No conflict if record doesn't exist
    }

    // Conflict exists if server was updated after client timestamp
    if (serverRecord.updated_at > clientTimestamp) {
      return { serverTimestamp: serverRecord.updated_at };
    }

    return null;
  }

  /**
   * Resolve conflict using last-write-wins strategy
   */
  private resolveConflict(clientTimestamp: Date, serverTimestamp: Date): ConflictResolutionResult {
    if (serverTimestamp > clientTimestamp) {
      return {
        resolved: true,
        winner: 'server',
        reason: `Server version is newer (${serverTimestamp.toISOString()} > ${clientTimestamp.toISOString()})`,
      };
    }

    return {
      resolved: true,
      winner: 'client',
      reason: `Client version is newer (${clientTimestamp.toISOString()} >= ${serverTimestamp.toISOString()})`,
    };
  }

  /**
   * Log unresolvable conflict for user notification
   */
  private async logConflict(
    userId: string,
    entityType: string,
    entityId: string,
    resolution: ConflictResolutionResult,
  ): Promise<void> {
    this.logger.warn(
      `Conflict logged for user ${userId}: ${entityType} ${entityId} - ${resolution.reason}`,
    );
    // TODO: Store conflict in database for user notification
    // Could create a ConflictLog model to track these
  }

  /**
   * Get or create sync state for user and entity type
   */
  async getSyncState(userId: string, entityType: string) {
    let syncState = await this.prisma.sync_states.findUnique({
      where: {
        user_id_entity_type: {
          user_id: userId,
          entity_type: entityType,
        },
      },
    });

    if (!syncState) {
      syncState = await this.prisma.sync_states.create({
        data: {
          id: generateId(),
          user_id: userId,
          entity_type: entityType,
          last_sync_timestamp: new Date(0), // Epoch start for first sync
          updated_at: new Date(),
        },
      });
    }

    return syncState;
  }

  /**
   * Update sync state after successful sync
   */
  async updateSyncState(userId: string, entityType: string, newTimestamp: Date) {
    return this.prisma.sync_states.update({
      where: {
        user_id_entity_type: {
          user_id: userId,
          entity_type: entityType,
        },
      },
      data: {
        last_sync_timestamp: newTimestamp,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Increment pending operations count
   */
  async incrementPendingOperations(userId: string, entityType: string) {
    return this.prisma.sync_states.update({
      where: {
        user_id_entity_type: {
          user_id: userId,
          entity_type: entityType,
        },
      },
      data: {
        pending_operations: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Decrement pending operations count
   */
  async decrementPendingOperations(userId: string, entityType: string) {
    return this.prisma.sync_states.update({
      where: {
        user_id_entity_type: {
          user_id: userId,
          entity_type: entityType,
        },
      },
      data: {
        pending_operations: {
          decrement: 1,
        },
      },
    });
  }

  /**
   * Queue sync operations for async processing with retry
   */
  async queueSyncOperations(userId: string, operations: SyncOperation[]): Promise<void> {
    this.logger.log(`Queueing ${operations.length} sync operations for user ${userId}`);

    // Increment pending operations count for each entity type
    const entityTypeCounts = new Map<string, number>();
    for (const op of operations) {
      entityTypeCounts.set(op.entityType, (entityTypeCounts.get(op.entityType) || 0) + 1);
    }

    for (const [entityType, count] of entityTypeCounts) {
      const syncState = await this.getSyncState(userId, entityType);
      await this.prisma.sync_states.update({
        where: { id: syncState.id },
        data: {
          pending_operations: {
            increment: count,
          },
        },
      });
    }

    // Queue the operations with retry logic
    await this.syncQueue.add(
      'apply-operations',
      {
        userId,
        operations,
      },
      {
        attempts: 3, // Retry up to 3 times
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 second delay
        },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for debugging
      },
    );
  }
}
