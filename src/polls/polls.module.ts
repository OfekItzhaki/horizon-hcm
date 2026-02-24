import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PollsController } from './polls.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';

// Command handlers
import { CreatePollHandler } from './commands/handlers/create-poll.handler';
import { UpdatePollHandler } from './commands/handlers/update-poll.handler';
import { DeletePollHandler } from './commands/handlers/delete-poll.handler';
import { VotePollHandler } from './commands/handlers/vote-poll.handler';

// Query handlers
import { GetPollHandler } from './queries/handlers/get-poll.handler';
import { GetPollsHandler } from './queries/handlers/get-polls.handler';
import { GetPollResultsHandler } from './queries/handlers/get-poll-results.handler';

const CommandHandlers = [CreatePollHandler, UpdatePollHandler, DeletePollHandler, VotePollHandler];

const QueryHandlers = [GetPollHandler, GetPollsHandler, GetPollResultsHandler];

@Module({
  imports: [CqrsModule, PrismaModule, CommonModule, NotificationsModule],
  controllers: [PollsController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [],
})
export class PollsModule {}
