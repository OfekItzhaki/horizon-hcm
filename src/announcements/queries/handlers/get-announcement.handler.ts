import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetAnnouncementQuery } from '../impl/get-announcement.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetAnnouncementQuery)
export class GetAnnouncementHandler implements IQueryHandler<GetAnnouncementQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetAnnouncementQuery) {
    const { announcementId } = query;

    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        building: true,
        read_receipts: true,
        comments: true,
      },
    });

    if (!announcement) {
      throw new Error('Announcement not found');
    }

    return announcement;
  }
}
