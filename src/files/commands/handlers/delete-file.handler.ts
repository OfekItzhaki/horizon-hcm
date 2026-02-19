import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../services/storage.service';
import { DeleteFileCommand } from '../impl/delete-file.command';

@Injectable()
@CommandHandler(DeleteFileCommand)
export class DeleteFileHandler implements ICommandHandler<DeleteFileCommand> {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async execute(command: DeleteFileCommand) {
    const { fileId, userId } = command;

    // Get file record
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check ownership
    if (file.user_id !== userId) {
      throw new ForbiddenException('You do not have permission to delete this file');
    }

    // Delete from cloud storage
    await this.storageService.delete(file.storage_key);

    // Delete from database
    await this.prisma.file.delete({
      where: { id: fileId },
    });

    return { success: true, message: 'File deleted successfully' };
  }
}
