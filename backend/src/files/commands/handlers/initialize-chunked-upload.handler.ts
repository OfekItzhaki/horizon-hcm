import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ChunkedUploadService } from '../../services/chunked-upload.service';
import { StorageService } from '../../services/storage.service';
import { InitializeChunkedUploadCommand } from '../impl/initialize-chunked-upload.command';

@Injectable()
@CommandHandler(InitializeChunkedUploadCommand)
export class InitializeChunkedUploadHandler
  implements ICommandHandler<InitializeChunkedUploadCommand>
{
  constructor(
    private chunkedUploadService: ChunkedUploadService,
    private storageService: StorageService,
  ) {}

  async execute(command: InitializeChunkedUploadCommand) {
    const { userId, filename, totalChunks, totalSize, mimeType } = command;

    // Validate file type
    if (!this.storageService.validateFileType(mimeType)) {
      throw new BadRequestException(`File type ${mimeType} is not allowed`);
    }

    // Validate file size
    if (!this.storageService.validateFileSize(totalSize, mimeType)) {
      const maxSize = mimeType.startsWith('image/') ? '10MB' : '50MB';
      throw new BadRequestException(`File size exceeds maximum of ${maxSize}`);
    }

    // Initialize upload session
    const uploadId = await this.chunkedUploadService.initializeUpload(
      userId,
      filename,
      totalChunks,
      totalSize,
      mimeType,
    );

    return {
      uploadId,
      message: 'Chunked upload initialized',
    };
  }
}
