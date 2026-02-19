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
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignRequestDto } from './dto/assign-request.dto';
import { AddCommentDto } from './dto/add-comment.dto';
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
  @ApiOperation({ summary: 'Create maintenance request' })
  async createRequest(@Body() dto: CreateMaintenanceRequestDto) {
    // TODO: Get requesterId from authenticated user context
    const requesterId = 'current-user-id'; // Placeholder
    return this.commandBus.execute(
      new CreateMaintenanceRequestCommand(
        dto.buildingId,
        dto.apartmentId,
        requesterId,
        dto.title,
        dto.description,
        dto.category,
        dto.priority,
      ),
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update maintenance request status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.commandBus.execute(
      new UpdateMaintenanceStatusCommand(id, dto.status),
    );
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign maintenance request to service provider' })
  async assignRequest(
    @Param('id') id: string,
    @Body() dto: AssignRequestDto,
  ) {
    return this.commandBus.execute(
      new AssignMaintenanceRequestCommand(id, dto.assignedTo),
    );
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment to maintenance request' })
  async addComment(
    @Param('id') id: string,
    @Body() dto: AddCommentDto,
  ) {
    // TODO: Get userId from authenticated user context
    const userId = 'current-user-id'; // Placeholder
    return this.commandBus.execute(
      new AddMaintenanceCommentCommand(id, userId, dto.comment),
    );
  }

  @Post(':id/photos')
  @ApiOperation({ summary: 'Add photo to maintenance request' })
  async addPhoto(
    @Param('id') id: string,
    @Body() body: { fileId: string },
  ) {
    return this.commandBus.execute(
      new AddMaintenancePhotoCommand(id, body.fileId),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get maintenance request details' })
  async getRequest(@Param('id') id: string) {
    return this.queryBus.execute(new GetMaintenanceRequestQuery(id));
  }

  @Get()
  @ApiOperation({ summary: 'List maintenance requests' })
  async listRequests(
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
