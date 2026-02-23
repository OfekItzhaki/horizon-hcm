import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { generateId } from '../../../common/utils/id-generator';
import { CreateBuildingCommand } from '../impl/create-building.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoggerService } from '../../../common/logger/logger.service';

@CommandHandler(CreateBuildingCommand)
export class CreateBuildingHandler implements ICommandHandler<CreateBuildingCommand> {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async execute(command: CreateBuildingCommand) {
    this.logger.log('Creating building', 'CreateBuildingHandler');

    const building = await this.prisma.buildings.create({
      data: {
        id: generateId(),
        name: command.name,
        address_line: command.addressLine,
        city: command.city,
        postal_code: command.postalCode,
        num_units: command.numUnits,
        current_balance: 0,
        is_active: true,
      },
    });

    this.logger.logWithMetadata('info', 'Building created successfully', {
      buildingId: building.id,
      name: building.name,
    });

    return building;
  }
}
