import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdatePollCommand } from '../impl/update-poll.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(UpdatePollCommand)
export class UpdatePollHandler implements ICommandHandler<UpdatePollCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: UpdatePollCommand) {
    const { pollId, userId, title, description, options, endDate } = command;

    // Find poll
    const poll = await this.prisma.polls.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if user is the creator
    if (poll.created_by !== userId) {
      throw new ForbiddenException('Only the poll creator can update it');
    }

    // Check if poll is still active
    if (poll.status !== 'active') {
      throw new BadRequestException('Cannot update a closed poll');
    }

    // Validate end date if provided
    if (endDate && endDate <= new Date()) {
      throw new BadRequestException('End date must be in the future');
    }

    // Validate options if provided
    if (options && options.length < 2) {
      throw new BadRequestException('Poll must have at least 2 options');
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date(),
    };

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (endDate) updateData.end_date = endDate;

    if (options) {
      // Preserve vote counts from existing options
      const existingOptions = poll.options as any[];
      const newOptions = options.map((option, index) => {
        const existingOption = existingOptions.find((o: any) => o.text === option);
        return {
          id: `option_${index + 1}`,
          text: option,
          votes: existingOption?.votes || 0,
        };
      });
      updateData.options = newOptions;
    }

    // Update poll
    const updatedPoll = await this.prisma.polls.update({
      where: { id: pollId },
      data: updateData,
    });

    // Log audit
    await this.auditLog.log({
      userId,
      action: 'poll.updated',
      resourceType: 'poll',
      resourceId: pollId,
    });

    return updatedPoll;
  }
}
