import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetMessagesQuery } from '../impl/get-messages.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetMessagesQuery)
export class GetMessagesHandler implements IQueryHandler<GetMessagesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetMessagesQuery) {
    const { buildingId, userId, page, limit } = query;

    const where: any = {
      building_id: buildingId,
      deleted_at: null,
      OR: [{ sender_id: userId }, { recipient_id: userId }],
    };

    const [messages, total] = await Promise.all([
      this.prisma.messages.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.messages.count({ where }),
    ]);

    // Resolve sender names from user_profiles
    const senderIds = [...new Set(messages.map((m) => m.sender_id))];
    const profiles = await this.prisma.user_profiles.findMany({
      where: { user_id: { in: senderIds } },
      select: { user_id: true, full_name: true },
    });
    const nameMap = new Map(profiles.map((p) => [p.user_id, p.full_name]));

    const enriched = messages.map((m) => ({
      ...m,
      senderName: nameMap.get(m.sender_id) || 'Unknown',
    }));

    return {
      data: enriched,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
