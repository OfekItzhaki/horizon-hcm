import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetAnnouncementStatsQuery } from '../impl/get-announcement-stats.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetAnnouncementStatsQuery)
export class GetAnnouncementStatsHandler implements IQueryHandler<GetAnnouncementStatsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetAnnouncementStatsQuery) {
    const { announcementId } = query;

    const announcement = await this.prisma.announcements.findUnique({
      where: { id: announcementId },
      include: { announcement_reads: true },
    });

    if (!announcement) {
      throw new Error('Announcement not found');
    }

    // TODO: Get total residents count for the building to calculate percentage
    const totalResidents = 100; // Placeholder
    const readCount = announcement.announcement_reads.length;
    const readPercentage = (readCount / totalResidents) * 100;

    return {
      announcementId: announcement.id,
      readCount,
      totalResidents,
      readPercentage: Math.round(readPercentage * 100) / 100,
    };
  }
}
