import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PollsController],
  providers: [],
  exports: [],
})
export class PollsModule {}
