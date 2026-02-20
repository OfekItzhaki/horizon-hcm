import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

@ApiTags('Residents')
@Controller('residents')
export class ResidentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // Endpoints will be implemented in task 1.11
}
