import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChunkedUploadService } from '../../services/chunked-upload.service';
import { StorageService } from '../../services/storage.service';
import { ImageProcessingService } from '../../services/image-processing.service';
import { CompleteChunkedUploadCommand } from '../impl/complete-chunked-upload.command';
import { generateId } from '../../../common/utils/id-generator';

@Injectable()
@CommandHandler(CompleteChunkedUploadCommand)
export class CompleteChunkedUploadHandler implements ICommandHandler<CompleteChunkedUploadCommand> {
  constructor(
    private prisma: PrismaService,
    private chunkedUploadService: ChunkedUploadService,
    private storageService: StorageService,
    private imageProcessingService: ImageProcessingService,
  ) {}

  async execute(command: CompleteChunkedUploadCommand) {
    const { userId, uploadId, isPublic } = command;

    // Get session
    const session = await this.chunkedUploadService.getSession(uploadId);
    if (!session) {
      throw new NotFoundException('Upload session not found');
    }

    // Verify ownership
    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have permission to complete this upload');
    }

    // Check if all chunks are uploaded
    if (!(await this.chunkedUploadService.isComplete(uploadId))) {
      throw new BadRequestException('Not all chunks have been uploaded');
    }

    // Reassemble chunks
    const completeFile = await this.chunkedUploadService.reassembleChunks(uploadId);

    // Upload to cloud storage
    const { storageKey, url } = await this.storageService.upload(
      {
        buffer: completeFile,
        originalname: session.filename,
        mimetype: session.mimeType,
        size: completeFile.length,
      } as Express.Multer.files,
      userId,
      isPublic,
    );

    // Create file record
    const fileRecord = await this.prisma.files.create({
      data: {
        id: generateId(),
        user_id: userId,
        filename: session.filename,
        storage_key: storageKey,
        mime_type: session.mimeType,
        size_bytes: completeFile.length,
        url,
        is_public: isPublic,
        is_scanned: false,
        updated_at: new Date(),
      },
    });

    // Queue image processing if it's an image
    if (this.imageProcessingService.isImage(session.mimeType)) {
      await this.imageProcessingService.queueImageProcessing(fileRecord.id, completeFile, {
        quality: 85,
        generateThumbnails: true,
      });
    }

    // Clean up upload session
    await this.chunkedUploadService.cleanup(uploadId);

    return fileRecord;
  }
}
