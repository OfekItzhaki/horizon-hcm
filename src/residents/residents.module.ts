import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ResidentsController } from './residents.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

// Command Handlers
import { AddCommitteeMemberHandler } from './commands/handlers/add-committee-member.handler';
import { RemoveCommitteeMemberHandler } from './commands/handlers/remove-committee-member.handler';

// Query Handlers
import { ListResidentsHandler } from './queries/handlers/list-residents.handler';
import { GetResidentProfileHandler } from './queries/handlers/get-resident-profile.handler';
import { SearchResidentsHandler } from './queries/handlers/search-residents.handler';
import { ExportResidentsHandler } from './queries/handlers/export-residents.handler';

const CommandHandlers = [
  AddCommitteeMemberHandler,
  RemoveCommitteeMemberHandler,
];

const QueryHandlers = [
  ListResidentsHandler,
  GetResidentProfileHandler,
  SearchResidentsHandler,
  ExportResidentsHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule, CommonModule],
  controllers: [ResidentsController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class ResidentsModule {}
