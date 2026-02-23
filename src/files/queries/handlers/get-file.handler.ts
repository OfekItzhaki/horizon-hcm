import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetFileQuery } from '../impl/get-file.query';

@Injectable()
@QueryHandler(GetFileQuery)
export class GetFileHandler implements IQueryHandler<GetFileQuery> {
  constructor(private prisma: PrismaService) {}

  async execute(query: GetFileQuery) {
    const { fileId, userId } = query;

    const file = await this.prisma.files.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check access permission (owner or public file)
    if (!file.is_public && file.user_id !== userId) {
      throw new ForbiddenException('You do not have permission to access this file');
    }

    return file;
  }
}
