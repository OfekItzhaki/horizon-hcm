import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SyncService, SyncOperation } from '../services/sync.service';

@Processor('sync-operations')
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(private readonly syncService: SyncService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing sync job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'apply-operations':
        return this.handleApplyOperations(job);

      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
        return { success: false, error: 'Unknown job type' };
    }
  }

  private async handleApplyOperations(job: Job) {
    const { userId, operations } = job.data as {
      userId: string;
      operations: SyncOperation[];
    };

    try {
      const result = await this.syncService.applyOperations(
        userId,
        operations,
      );

      if (result.success) {
        this.logger.log(
          `Successfully applied ${operations.length} operations for user ${userId}`,
        );

        // Decrement pending operations count
        for (const op of operations) {
          await this.syncService.decrementPendingOperations(
            userId,
            op.entityType,
          );
        }
      } else {
        this.logger.error(
          `Failed to apply operations for user ${userId}: ${result.errors.join(', ')}`,
        );
        throw new Error(`Failed operations: ${result.errors.join(', ')}`);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Error processing sync operations: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw to trigger retry
    }
  }
}
