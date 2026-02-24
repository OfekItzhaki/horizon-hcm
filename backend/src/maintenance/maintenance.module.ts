import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MaintenanceController } from './maintenance.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CommonModule } from '../common/common.module';

// Command Handlers
import { CreateMaintenanceRequestHandler } from './commands/handlers/create-maintenance-request.handler';
import { UpdateMaintenanceStatusHandler } from './commands/handlers/update-maintenance-status.handler';
import { AssignMaintenanceRequestHandler } from './commands/handlers/assign-maintenance-request.handler';
import { AddMaintenanceCommentHandler } from './commands/handlers/add-maintenance-comment.handler';
import { AddMaintenancePhotoHandler } from './commands/handlers/add-maintenance-photo.handler';

// Query Handlers
import { GetMaintenanceRequestHandler } from './queries/handlers/get-maintenance-request.handler';
import { ListMaintenanceRequestsHandler } from './queries/handlers/list-maintenance-requests.handler';

const CommandHandlers = [
  CreateMaintenanceRequestHandler,
  UpdateMaintenanceStatusHandler,
  AssignMaintenanceRequestHandler,
  AddMaintenanceCommentHandler,
  AddMaintenancePhotoHandler,
];

const QueryHandlers = [
  GetMaintenanceRequestHandler,
  ListMaintenanceRequestsHandler,
];

@Module({
  imports: [CqrsModule, CommonModule],
  controllers: [MaintenanceController],
  providers: [PrismaService, ...CommandHandlers, ...QueryHandlers],
})
export class MaintenanceModule {}
