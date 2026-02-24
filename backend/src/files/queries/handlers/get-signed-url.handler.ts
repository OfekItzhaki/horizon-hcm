import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../services/storage.service';
import { GetSignedUrlQuery } from '../impl/get-signed-url.query';

@Injectable()
@QueryHandler(GetSignedUrlQuery)
export class GetSignedUrlHandler implements IQueryHandler<GetSignedUrlQuery> {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async execute(query: GetSignedUrlQuery) {
    const { fileId, userId, expiresIn } = query;

    const file = await this.prisma.files.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check access permission
    if (!file.is_public && file.user_id !== userId) {
      throw new ForbiddenException('You do not have permission to access this file');
    }

    // Generate signed URL
    const signedUrl = await this.storageService.getSignedUrl(file.storage_key, expiresIn);

    return {
      url: signedUrl,
      expiresIn,
      filename: file.filename,
      mimeType: file.mime_type,
    };
  }
}
