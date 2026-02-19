import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { CreateAnnouncementCommand } from './commands/impl/create-announcement.command';
import { MarkAsReadCommand } from './commands/impl/mark-as-read.command';
import { AddCommentCommand } from './commands/impl/add-comment.command';
import { DeleteAnnouncementCommand } from './commands/impl/delete-announcement.command';
import { GetAnnouncementQuery } from './queries/impl/get-announcement.query';
import { ListAnnouncementsQuery } from './queries/impl/list-announcements.query';
import { GetAnnouncementStatsQuery } from './queries/impl/get-announcement-stats.query';

@ApiTags('announcements')
@ApiBearerAuth()
@Controller('announcements')
export class AnnouncementsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create announcement' })
  async createAnnouncement(@Body() dto: CreateAnnouncementDto) {
    // TODO: Get authorId from authenticated user context
    const authorId = 'current-user-id'; // Placeholder
    return this.commandBus.execute(
      new CreateAnnouncementCommand(
        dto.buildingId,
        authorId,
        dto.title,
        dto.content,
        dto.category,
        dto.isUrgent || false,
      ),
    );
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark announcement as read' })
  async markAsRead(@Param('id') id: string) {
    // TODO: Get userId from authenticated user context
    const userId = 'current-user-id'; // Placeholder
    return this.commandBus.execute(new MarkAsReadCommand(id, userId));
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment to announcement' })
  async addComment(@Param('id') id: string, @Body() dto: AddCommentDto) {
    // TODO: Get userId from authenticated user context
    const userId = 'current-user-id'; // Placeholder
    return this.commandBus.execute(new AddCommentCommand(id, userId, dto.comment));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete announcement' })
  async deleteAnnouncement(@Param('id') id: string) {
    // TODO: Get userId from authenticated user context
    const userId = 'current-user-id'; // Placeholder
    return this.commandBus.execute(new DeleteAnnouncementCommand(id, userId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get announcement details' })
  async getAnnouncement(@Param('id') id: string) {
    return this.queryBus.execute(new GetAnnouncementQuery(id));
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get announcement statistics' })
  async getAnnouncementStats(@Param('id') id: string) {
    return this.queryBus.execute(new GetAnnouncementStatsQuery(id));
  }

  @Get()
  @ApiOperation({ summary: 'List announcements' })
  async listAnnouncements(
    @Query('buildingId') buildingId: string,
    @Query('category') category?: string,
    @Query('isUrgent') isUrgent?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.queryBus.execute(
      new ListAnnouncementsQuery(
        buildingId,
        category,
        isUrgent === 'true' ? true : isUrgent === 'false' ? false : undefined,
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 20,
      ),
    );
  }
}
