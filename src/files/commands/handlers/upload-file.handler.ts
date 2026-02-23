import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../services/storage.service';
import { ImageProcessingService } from '../../services/image-processing.service';
import { UploadFileCommand } from '../impl/upload-file.command';

@Injectable()
@CommandHandler(UploadFileCommand)
export class UploadFileHandler implements ICommandHandler<UploadFileCommand> {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private imageProcessingService: ImageProcessingService,
  ) {}

  async execute(command: UploadFileCommand) {
    const { userId, file, isPublic } = command;

    // Validate file type
    if (!this.storageService.validateFileType(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }

    // Validate file size
    if (!this.storageService.validateFileSize(file.size, file.mimetype)) {
      const maxSize = file.mimetype.startsWith('image/') ? '10MB' : '50MB';
      throw new BadRequestException(`File size exceeds maximum of ${maxSize}`);
    }

    // Upload to cloud storage
    const { storageKey, url } = await this.storageService.upload(file, userId, isPublic);

    // Create file record in database
    const fileRecord = await this.prisma.files.create({
      data: {
        user_id: userId,
        filename: file.originalname,
        storage_key: storageKey,
        mime_type: file.mimetype,
        size_bytes: file.size,
        url,
        is_public: isPublic,
        is_scanned: false, // Will be updated by malware scanner
      },
    });

    // Queue image processing if it's an image
    if (this.imageProcessingService.isImage(file.mimetype)) {
      await this.imageProcessingService.queueImageProcessing(fileRecord.id, file.buffer, {
        quality: 85,
        generateThumbnails: true,
      });
    }

    return fileRecord;
  }
}
