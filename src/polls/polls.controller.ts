import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@ofeklabs/horizon-auth';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { VotePollDto } from './dto/vote-poll.dto';
import { CreatePollCommand } from './commands/impl/create-poll.command';
import { UpdatePollCommand } from './commands/impl/update-poll.command';
import { DeletePollCommand } from './commands/impl/delete-poll.command';
import { VotePollCommand } from './commands/impl/vote-poll.command';
import { GetPollsQuery } from './queries/impl/get-polls.query';
import { GetPollQuery } from './queries/impl/get-poll.query';
import { GetPollResultsQuery } from './queries/impl/get-poll-results.query';

@ApiTags('polls')
@Controller('buildings/:buildingId/polls')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PollsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all polls' })
  async getAll(
    @Param('buildingId') buildingId: string,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.queryBus.execute(
      new GetPollsQuery(buildingId, status, Number(page), Number(limit)),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create poll' })
  async create(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Body() data: CreatePollDto,
  ) {
    return this.commandBus.execute(
      new CreatePollCommand(
        buildingId,
        user.id,
        data.title,
        data.description,
        data.options,
        data.allowMultiple,
        data.isAnonymous,
        new Date(data.endDate),
      ),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get poll by ID' })
  async getById(@Param('buildingId') buildingId: string, @Param('id') id: string) {
    return this.queryBus.execute(new GetPollQuery(id, buildingId));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update poll' })
  async update(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Param('id') id: string,
    @Body() data: UpdatePollDto,
  ) {
    return this.commandBus.execute(
      new UpdatePollCommand(
        id,
        user.id,
        data.title,
        data.description,
        data.options,
        data.endDate ? new Date(data.endDate) : undefined,
      ),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete poll' })
  async delete(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Param('id') id: string,
  ) {
    return this.commandBus.execute(new DeletePollCommand(id, user.id));
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'Vote on poll' })
  async vote(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Param('id') id: string,
    @Body() data: VotePollDto,
  ) {
    return this.commandBus.execute(new VotePollCommand(id, user.id, data.optionIds));
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'Get poll results' })
  async getResults(@Param('buildingId') buildingId: string, @Param('id') id: string) {
    return this.queryBus.execute(new GetPollResultsQuery(id, buildingId));
  }
}
