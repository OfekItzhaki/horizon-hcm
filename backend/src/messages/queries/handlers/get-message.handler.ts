import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetMessageQuery } from '../impl/get-message.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetMessageQuery)
export class GetMessageHandler implements IQueryHandler<GetMessageQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetMessageQuery) {
    const { messageId, buildingId } = query;

    const message = await this.prisma.messages.findFirst({
      where: {
        id: messageId,
        building_id: buildingId,
        deleted_at: null,
      },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    return message;
  }
}
