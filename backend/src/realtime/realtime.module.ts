import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeController } from './realtime.controller';
import { PresenceService } from './services/presence.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RealtimeController],
  providers: [RealtimeGateway, PresenceService],
  exports: [PresenceService, RealtimeGateway],
})
export class RealtimeModule {}
