import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AddMaintenancePhotoCommand } from '../impl/add-maintenance-photo.command';
import { generateId } from '../../../common/utils/id-generator';

@CommandHandler(AddMaintenancePhotoCommand)
export class AddMaintenancePhotoHandler implements ICommandHandler<AddMaintenancePhotoCommand> {
  constructor(private prisma: PrismaService) {}

  async execute(command: AddMaintenancePhotoCommand) {
    const { requestId, fileId } = command;

    // Check if request exists
    const request = await this.prisma.maintenance_requests.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Maintenance request not found');
    }

    // Check if file exists
    const file = await this.prisma.files.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Add photo
    const photo = await this.prisma.maintenance_photos.create({
      data: {
        id: generateId(),
        maintenance_request_id: requestId,
        file_id: fileId,
      },
    });

    return photo;
  }
}
