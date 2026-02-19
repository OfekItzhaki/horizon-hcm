import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChunkedUploadService } from '../../services/chunked-upload.service';
import { GetUploadProgressQuery } from '../impl/get-upload-progress.query';

@Injectable()
@QueryHandler(GetUploadProgressQuery)
export class GetUploadProgressHandler
  implements IQueryHandler<GetUploadProgressQuery>
{
  constructor(private chunkedUploadService: ChunkedUploadService) {}

  async execute(query: GetUploadProgressQuery) {
    const { uploadId, userId } = query;

    // Get session
    const session = await this.chunkedUploadService.getSession(uploadId);
    if (!session) {
      throw new NotFoundException('Upload session not found');
    }

    // Verify ownership
    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this upload');
    }

    // Get progress
    const progress = await this.chunkedUploadService.getProgress(uploadId);

    return {
      ...progress,
      filename: session.filename,
      totalSize: session.totalSize,
    };
  }
}
