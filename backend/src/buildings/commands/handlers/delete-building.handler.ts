import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DeleteBuildingCommand } from '../impl/delete-building.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoggerService } from '../../../common/logger/logger.service';

@CommandHandler(DeleteBuildingCommand)
export class DeleteBuildingHandler implements ICommandHandler<DeleteBuildingCommand> {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async execute(command: DeleteBuildingCommand) {
    const existing = await this.prisma.buildings.findUnique({
      where: { id: command.buildingId },
    });

    if (!existing) {
      throw new NotFoundException(`Building ${command.buildingId} not found`);
    }

    await this.prisma.buildings.delete({ where: { id: command.buildingId } });

    this.logger.logWithMetadata('info', 'Building deleted', { buildingId: command.buildingId });
    return { success: true };
  }
}
