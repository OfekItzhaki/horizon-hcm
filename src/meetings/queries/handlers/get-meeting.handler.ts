import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetMeetingQuery } from '../impl/get-meeting.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetMeetingQuery)
export class GetMeetingHandler implements IQueryHandler<GetMeetingQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetMeetingQuery) {
    const { meetingId } = query;

    const meeting = await this.prisma.meetings.findUnique({
      where: { id: meetingId },
      include: {
        building: true,
        attendees: true,
        agenda_items: {
          orderBy: { order: 'asc' },
        },
        votes: {
          include: {
            vote_records: true,
          },
        },
      },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    return meeting;
  }
}
