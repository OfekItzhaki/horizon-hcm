import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GetDeltaDto } from './dto/get-delta.dto';
import { ApplyOperationsDto } from './dto/apply-operations.dto';
import { GetDeltaQuery } from './queries/impl/get-delta.query';
import { ApplyOperationsCommand } from './commands/impl/apply-operations.command';
import { SyncService } from './services/sync.service';

@ApiTags('Sync')
@Controller('sync')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is integrated
@ApiBearerAuth()
export class SyncController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly syncService: SyncService,
  ) {}

  @Get('delta')
  @ApiOperation({
    summary: 'Get delta changes since last sync',
    description:
      'Returns created, updated, and deleted records for a specific entity type since the last sync timestamp',
  })
  async getDelta(@Query() dto: GetDeltaDto, @Request() req: any) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    const query = new GetDeltaQuery(
      userId,
      dto.entityType,
      new Date(dto.lastSyncTimestamp),
    );

    const delta = await this.queryBus.execute(query);

    // Update sync state after successful delta fetch
    await this.syncService.updateSyncState(
      userId,
      dto.entityType,
      delta.newSyncTimestamp,
    );

    return delta;
  }

  @Post('apply')
  @ApiOperation({
    summary: 'Apply sync operations from client',
    description:
      'Applies a batch of create/update/delete operations from the client to the server',
  })
  async applyOperations(@Body() dto: ApplyOperationsDto, @Request() req: any) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    const operations = dto.operations.map((op) => ({
      ...op,
      clientTimestamp: new Date(op.clientTimestamp),
    }));

    const command = new ApplyOperationsCommand(userId, operations);
    const result = await this.commandBus.execute(command);

    // Decrement pending operations count for each successful operation
    if (result.success) {
      for (const op of operations) {
        await this.syncService.decrementPendingOperations(
          userId,
          op.entityType,
        );
      }
    }

    return result;
  }

  @Post('queue')
  @ApiOperation({
    summary: 'Queue sync operations for async processing',
    description:
      'Queues a batch of operations for async processing with retry logic',
  })
  async queueOperations(@Body() dto: ApplyOperationsDto, @Request() req: any) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    const operations = dto.operations.map((op) => ({
      ...op,
      clientTimestamp: new Date(op.clientTimestamp),
    }));

    await this.syncService.queueSyncOperations(userId, operations);

    return {
      success: true,
      message: `Queued ${operations.length} operations for processing`,
    };
  }

  @Get('state')
  @ApiOperation({
    summary: 'Get sync state for entity type',
    description:
      'Returns the current sync state including last sync timestamp and pending operations count',
  })
  async getSyncState(
    @Query('entityType') entityType: string,
    @Request() req: any,
  ) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    return this.syncService.getSyncState(userId, entityType);
  }
}
