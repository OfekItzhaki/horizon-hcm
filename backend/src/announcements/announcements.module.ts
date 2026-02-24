import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AnnouncementsController } from './announcements.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

// Command handlers
import { CreateAnnouncementHandler } from './commands/handlers/create-announcement.handler';
import { MarkAsReadHandler } from './commands/handlers/mark-as-read.handler';
import { AddCommentHandler } from './commands/handlers/add-comment.handler';
import { DeleteAnnouncementHandler } from './commands/handlers/delete-announcement.handler';

// Query handlers
import { GetAnnouncementHandler } from './queries/handlers/get-announcement.handler';
import { ListAnnouncementsHandler } from './queries/handlers/list-announcements.handler';
import { GetAnnouncementStatsHandler } from './queries/handlers/get-announcement-stats.handler';

const CommandHandlers = [
  CreateAnnouncementHandler,
  MarkAsReadHandler,
  AddCommentHandler,
  DeleteAnnouncementHandler,
];

const QueryHandlers = [
  GetAnnouncementHandler,
  ListAnnouncementsHandler,
  GetAnnouncementStatsHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule, CommonModule],
  controllers: [AnnouncementsController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class AnnouncementsModule {}
