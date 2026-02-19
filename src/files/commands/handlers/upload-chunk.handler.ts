import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChunkedUploadService } from '../../services/chunked-upload.service';
import { UploadChunkCommand } from '../impl/upload-chunk.command';

@Injectable()
@CommandHandler(UploadChunkCommand)
export class UploadChunkHandler implements ICommandHandler<UploadChunkCommand> {
  constructor(private chunkedUploadService: ChunkedUploadService) {}

  async execute(command: UploadChunkCommand) {
    const { userId, uploadId, chunkIndex, chunkData } = command;

    // Get session
    const session = await this.chunkedUploadService.getSession(uploadId);
    if (!session) {
      throw new NotFoundException('Upload session not found');
    }

    // Verify ownership
    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have permission to upload to this session');
    }

    // Store chunk
    await this.chunkedUploadService.storeChunk(uploadId, chunkIndex, chunkData);

    // Get progress
    const progress = await this.chunkedUploadService.getProgress(uploadId);

    return {
      message: 'Chunk uploaded successfully',
      progress,
    };
  }
}
