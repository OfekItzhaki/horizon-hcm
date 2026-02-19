import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { RsvpDto } from './dto/rsvp.dto';
import { AddAgendaItemDto } from './dto/add-agenda-item.dto';
import { CreateVoteDto } from './dto/create-vote.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { CreateMeetingCommand } from './commands/impl/create-meeting.command';
import { UpdateMeetingCommand } from './commands/impl/update-meeting.command';
import { RsvpMeetingCommand } from './commands/impl/rsvp-meeting.command';
import { AddAgendaItemCommand } from './commands/impl/add-agenda-item.command';
import { CreateVoteCommand } from './commands/impl/create-vote.command';
import { CastVoteCommand } from './commands/impl/cast-vote.command';
import { GetMeetingQuery } from './queries/impl/get-meeting.query';
import { ListMeetingsQuery } from './queries/impl/list-meetings.query';
import { GetVoteResultsQuery } from './queries/impl/get-vote-results.query';

@ApiTags('meetings')
@ApiBearerAuth()
@Controller('meetings')
export class MeetingsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create meeting' })
  async createMeeting(@Body() dto: CreateMeetingDto) {
    // TODO: Get organizerId from authenticated user context
    const organizerId = 'current-user-id'; // Placeholder
    return this.commandBus.execute(
      new CreateMeetingCommand(
        dto.buildingId,
        organizerId,
        dto.title,
        dto.description,
        new Date(dto.scheduledAt),
        dto.location,
        dto.attendeeIds,
      ),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update meeting' })
  async updateMeeting(
    @Param('id') id: string,
    @Body() dto: UpdateMeetingDto,
  ) {
    const updates: any = {};
    if (dto.title) updates.title = dto.title;
    if (dto.description) updates.description = dto.description;
    if (dto.scheduledAt) updates.scheduledAt = new Date(dto.scheduledAt);
    if (dto.location) updates.location = dto.location;

    return this.commandBus.execute(new UpdateMeetingCommand(id, updates));
  }

  @Post(':id/rsvp')
  @ApiOperation({ summary: 'RSVP to meeting' })
  async rsvpMeeting(@Param('id') id: string, @Body() dto: RsvpDto) {
    // TODO: Get userId from authenticated user context
    const userId = 'current-user-id'; // Placeholder
    return this.commandBus.execute(new RsvpMeetingCommand(id, userId, dto.status));
  }

  @Post(':id/agenda')
  @ApiOperation({ summary: 'Add agenda item' })
  async addAgendaItem(
    @Param('id') id: string,
    @Body() dto: AddAgendaItemDto,
  ) {
    return this.commandBus.execute(
      new AddAgendaItemCommand(id, dto.title, dto.description, dto.order),
    );
  }

  @Post(':id/votes')
  @ApiOperation({ summary: 'Create vote' })
  async createVote(@Param('id') id: string, @Body() dto: CreateVoteDto) {
    return this.commandBus.execute(
      new CreateVoteCommand(id, dto.question, dto.options),
    );
  }

  @Post('votes/:voteId/cast')
  @ApiOperation({ summary: 'Cast vote' })
  async castVote(@Param('voteId') voteId: string, @Body() dto: CastVoteDto) {
    // TODO: Get userId from authenticated user context
    const userId = 'current-user-id'; // Placeholder
    return this.commandBus.execute(
      new CastVoteCommand(voteId, userId, dto.selectedOption),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get meeting details' })
  async getMeeting(@Param('id') id: string) {
    return this.queryBus.execute(new GetMeetingQuery(id));
  }

  @Get()
  @ApiOperation({ summary: 'List meetings' })
  async listMeetings(
    @Query('buildingId') buildingId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.queryBus.execute(
      new ListMeetingsQuery(
        buildingId,
        status,
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 20,
      ),
    );
  }

  @Get('votes/:voteId/results')
  @ApiOperation({ summary: 'Get vote results' })
  async getVoteResults(@Param('voteId') voteId: string) {
    return this.queryBus.execute(new GetVoteResultsQuery(voteId));
  }
}
