import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ApartmentsController } from './apartments.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CommonModule } from '../common/common.module';

// Command Handlers
import { CreateApartmentHandler } from './commands/handlers/create-apartment.handler';
import { UpdateApartmentHandler } from './commands/handlers/update-apartment.handler';
import { DeleteApartmentHandler } from './commands/handlers/delete-apartment.handler';
import { AssignOwnerHandler } from './commands/handlers/assign-owner.handler';
import { RemoveOwnerHandler } from './commands/handlers/remove-owner.handler';
import { AssignTenantHandler } from './commands/handlers/assign-tenant.handler';
import { UpdateTenantHandler } from './commands/handlers/update-tenant.handler';

// Query Handlers
import { GetApartmentHandler } from './queries/handlers/get-apartment.handler';
import { ListApartmentsHandler } from './queries/handlers/list-apartments.handler';
import { GetApartmentOwnersHandler } from './queries/handlers/get-apartment-owners.handler';
import { GetApartmentTenantsHandler } from './queries/handlers/get-apartment-tenants.handler';

const CommandHandlers = [
  CreateApartmentHandler,
  UpdateApartmentHandler,
  DeleteApartmentHandler,
  AssignOwnerHandler,
  RemoveOwnerHandler,
  AssignTenantHandler,
  UpdateTenantHandler,
];

const QueryHandlers = [
  GetApartmentHandler,
  ListApartmentsHandler,
  GetApartmentOwnersHandler,
  GetApartmentTenantsHandler,
];

@Module({
  imports: [CqrsModule, CommonModule],
  controllers: [ApartmentsController],
  providers: [PrismaService, ...CommandHandlers, ...QueryHandlers],
})
export class ApartmentsModule {}
