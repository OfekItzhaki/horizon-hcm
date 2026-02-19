import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BuildingsController } from './buildings.controller';
import { CreateBuildingHandler } from './commands/handlers/create-building.handler';
import { GetBuildingHandler } from './queries/handlers/get-building.handler';

const CommandHandlers = [CreateBuildingHandler];
const QueryHandlers = [GetBuildingHandler];

@Module({
  imports: [CqrsModule],
  controllers: [BuildingsController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class BuildingsModule {}
