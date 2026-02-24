import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '@ofeklabs/horizon-auth';
import { BuildingMemberGuard } from '../common/guards/building-member.guard';
import { CommitteeMemberGuard } from '../common/guards/committee-member.guard';
import { ResourceOwnerGuard } from '../common/guards/resource-owner.guard';
import { ResourceType } from '../common/decorators/resource-type.decorator';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { AddAnnouncementCommentDto } from './dto/add-comment.dto';
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
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @ApiOperation({ summary: 'Create announcement' })
  async createAnnouncement(@CurrentUser() user: any, @Body() dto: CreateAnnouncementDto) {
    return this.commandBus.execute(
      new CreateAnnouncementCommand(
        dto.buildingId,
        user.id,
        dto.title,
        dto.content,
        dto.category,
        dto.isUrgent || false,
      ),
    );
  }

  @Post(':id/read')
  @UseGuards(BuildingMemberGuard)
  @ApiOperation({ summary: 'Mark announcement as read' })
  async markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.commandBus.execute(new MarkAsReadCommand(id, user.id));
  }

  @Post(':id/comments')
  @UseGuards(BuildingMemberGuard)
  @ApiOperation({ summary: 'Add comment to announcement' })
  async addComment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AddAnnouncementCommentDto,
  ) {
    return this.commandBus.execute(new AddCommentCommand(id, user.id, dto.comment));
  }

  @Delete(':id')
  @UseGuards(ResourceOwnerGuard)
  @ResourceType('Announcement')
  @ApiOperation({ summary: 'Delete announcement' })
  async deleteAnnouncement(@CurrentUser() user: any, @Param('id') id: string) {
    return this.commandBus.execute(new DeleteAnnouncementCommand(id, user.id));
  }

  @Get(':id')
  @UseGuards(BuildingMemberGuard)
  @ApiOperation({ summary: 'Get announcement details' })
  async getAnnouncement(@CurrentUser() user: any, @Param('id') id: string) {
    return this.queryBus.execute(new GetAnnouncementQuery(id));
  }

  @Get(':id/stats')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @ApiOperation({ summary: 'Get announcement statistics' })
  async getAnnouncementStats(@CurrentUser() user: any, @Param('id') id: string) {
    return this.queryBus.execute(new GetAnnouncementStatsQuery(id));
  }

  @Get()
  @UseGuards(BuildingMemberGuard)
  @ApiOperation({ summary: 'List announcements' })
  async listAnnouncements(
    @CurrentUser() user: any,
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
