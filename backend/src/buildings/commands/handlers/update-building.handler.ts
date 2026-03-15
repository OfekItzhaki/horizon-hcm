import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { UpdateBuildingCommand } from '../impl/update-building.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoggerService } from '../../../common/logger/logger.service';

@CommandHandler(UpdateBuildingCommand)
export class UpdateBuildingHandler implements ICommandHandler<UpdateBuildingCommand> {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async execute(command: UpdateBuildingCommand) {
    const existing = await this.prisma.buildings.findUnique({
      where: { id: command.buildingId },
    });

    if (!existing) {
      throw new NotFoundException(`Building ${command.buildingId} not found`);
    }

    const updated = await this.prisma.buildings.update({
      where: { id: command.buildingId },
      data: {
        ...(command.name !== undefined && { name: command.name }),
        ...(command.addressLine !== undefined && { address_line: command.addressLine }),
        ...(command.city !== undefined && { city: command.city }),
        ...(command.postalCode !== undefined && { postal_code: command.postalCode }),
        ...(command.numUnits !== undefined && { num_units: command.numUnits }),
        ...(command.isActive !== undefined && { is_active: command.isActive }),
        updated_at: new Date(),
      },
    });

    this.logger.logWithMetadata('info', 'Building updated', { buildingId: updated.id });
    return updated;
  }
}
