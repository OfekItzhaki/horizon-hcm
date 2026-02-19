import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bullmq';
import { SyncService } from './services/sync.service';
import { SyncController } from './sync.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GetDeltaQueryHandler } from './queries/handlers/get-delta.handler';
import { ApplyOperationsCommandHandler } from './commands/handlers/apply-operations.handler';
import { SyncProcessor } from './processors/sync.processor';

const QueryHandlers = [GetDeltaQueryHandler];
const CommandHandlers = [ApplyOperationsCommandHandler];

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    BullModule.registerQueue({
      name: 'sync-operations',
    }),
  ],
  controllers: [SyncController],
  providers: [SyncService, SyncProcessor, ...QueryHandlers, ...CommandHandlers],
  exports: [SyncService],
})
export class SyncModule {}
