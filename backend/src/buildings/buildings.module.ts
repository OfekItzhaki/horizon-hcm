import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BuildingsController } from './buildings.controller';
import { CreateBuildingHandler } from './commands/handlers/create-building.handler';
import { UpdateBuildingHandler } from './commands/handlers/update-building.handler';
import { DeleteBuildingHandler } from './commands/handlers/delete-building.handler';
import { GetBuildingHandler } from './queries/handlers/get-building.handler';
import { ListBuildingsHandler } from './queries/handlers/list-buildings.handler';

const CommandHandlers = [CreateBuildingHandler, UpdateBuildingHandler, DeleteBuildingHandler];
const QueryHandlers = [GetBuildingHandler, ListBuildingsHandler];

@Module({
  imports: [CqrsModule],
  controllers: [BuildingsController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class BuildingsModule {}
