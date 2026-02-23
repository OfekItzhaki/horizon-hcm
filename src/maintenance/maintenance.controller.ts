import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '@ofeklabs/horizon-auth';
import { BuildingMemberGuard } from '../common/guards/building-member.guard';
import { ResourceOwnerGuard } from '../common/guards/resource-owner.guard';
import { ResourceType } from '../common/decorators/resource-type.decorator';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignRequestDto } from './dto/assign-request.dto';
import { AddMaintenanceCommentDto } from './dto/add-comment.dto';
import { CreateMaintenanceRequestCommand } from './commands/impl/create-maintenance-request.command';
import { UpdateMaintenanceStatusCommand } from './commands/impl/update-maintenance-status.command';
import { AssignMaintenanceRequestCommand } from './commands/impl/assign-maintenance-request.command';
import { AddMaintenanceCommentCommand } from './commands/impl/add-maintenance-comment.command';
import { AddMaintenancePhotoCommand } from './commands/impl/add-maintenance-photo.command';
import { GetMaintenanceRequestQuery } from './queries/impl/get-maintenance-request.query';
import { ListMaintenanceRequestsQuery } from './queries/impl/list-maintenance-requests.query';

@ApiTags('maintenance')
@ApiBearerAuth()
@Controller('maintenance')
export class MaintenanceController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @UseGuards(BuildingMemberGuard)
  @ApiOperation({ summary: 'Create maintenance request' })
  async createRequest(@CurrentUser() user: any, @Body() dto: CreateMaintenanceRequestDto) {
    return this.commandBus.execute(
      new CreateMaintenanceRequestCommand(
        dto.buildingId,
        dto.apartmentId,
        user.id,
        dto.title,
        dto.description,
        dto.category,
        dto.priority,
      ),
    );
  }

  @Patch(':id/status')
  @UseGuards(ResourceOwnerGuard)
  @ResourceType('MaintenanceRequest')
  @ApiOperation({ summary: 'Update maintenance request status' })
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.commandBus.execute(new UpdateMaintenanceStatusCommand(id, dto.status));
  }

  @Patch(':id/assign')
  @UseGuards(ResourceOwnerGuard)
  @ResourceType('MaintenanceRequest')
  @ApiOperation({ summary: 'Assign maintenance request to service provider' })
  async assignRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AssignRequestDto,
  ) {
    return this.commandBus.execute(new AssignMaintenanceRequestCommand(id, dto.assignedTo));
  }

  @Post(':id/comments')
  @UseGuards(BuildingMemberGuard)
  @ApiOperation({ summary: 'Add comment to maintenance request' })
  async addComment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AddMaintenanceCommentDto,
  ) {
    return this.commandBus.execute(new AddMaintenanceCommentCommand(id, user.id, dto.comment));
  }

  @Post(':id/photos')
  @UseGuards(BuildingMemberGuard)
  @ApiOperation({ summary: 'Add photo to maintenance request' })
  async addPhoto(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { fileId: string },
  ) {
    return this.commandBus.execute(new AddMaintenancePhotoCommand(id, body.fileId));
  }

  @Get(':id')
  @UseGuards(BuildingMemberGuard)
  @ApiOperation({ summary: 'Get maintenance request details' })
  async getRequest(@CurrentUser() user: any, @Param('id') id: string) {
    return this.queryBus.execute(new GetMaintenanceRequestQuery(id));
  }

  @Get()
  @UseGuards(BuildingMemberGuard)
  @ApiOperation({ summary: 'List maintenance requests' })
  async listRequests(
    @CurrentUser() user: any,
    @Query('buildingId') buildingId?: string,
    @Query('apartmentId') apartmentId?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.queryBus.execute(
      new ListMaintenanceRequestsQuery(
        buildingId,
        apartmentId,
        status,
        category,
        priority,
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 20,
      ),
    );
  }
}
