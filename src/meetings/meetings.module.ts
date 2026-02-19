import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MeetingsController } from './meetings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

// Command handlers
import { CreateMeetingHandler } from './commands/handlers/create-meeting.handler';
import { UpdateMeetingHandler } from './commands/handlers/update-meeting.handler';
import { RsvpMeetingHandler } from './commands/handlers/rsvp-meeting.handler';
import { AddAgendaItemHandler } from './commands/handlers/add-agenda-item.handler';
import { CreateVoteHandler } from './commands/handlers/create-vote.handler';
import { CastVoteHandler } from './commands/handlers/cast-vote.handler';

// Query handlers
import { GetMeetingHandler } from './queries/handlers/get-meeting.handler';
import { ListMeetingsHandler } from './queries/handlers/list-meetings.handler';
import { GetVoteResultsHandler } from './queries/handlers/get-vote-results.handler';

const CommandHandlers = [
  CreateMeetingHandler,
  UpdateMeetingHandler,
  RsvpMeetingHandler,
  AddAgendaItemHandler,
  CreateVoteHandler,
  CastVoteHandler,
];

const QueryHandlers = [
  GetMeetingHandler,
  ListMeetingsHandler,
  GetVoteResultsHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule, CommonModule],
  controllers: [MeetingsController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class MeetingsModule {}
