import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { generateId } from '../../../common/utils/id-generator';
import { CreatePollCommand } from '../impl/create-poll.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { NotificationService } from '../../../notifications/services/notification.service';

@CommandHandler(CreatePollCommand)
export class CreatePollHandler implements ICommandHandler<CreatePollCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(command: CreatePollCommand) {
    const {
      buildingId,
      createdBy,
      title,
      description,
      options,
      allowMultiple,
      isAnonymous,
      endDate,
    } = command;

    // Validate building exists
    const building = await this.prisma.buildings.findUnique({
      where: { id: buildingId },
    });

    if (!building) {
      throw new NotFoundException('Building not found');
    }

    // Validate end date is in the future
    if (endDate <= new Date()) {
      throw new BadRequestException('End date must be in the future');
    }

    // Validate options
    if (options.length < 2) {
      throw new BadRequestException('Poll must have at least 2 options');
    }

    // Create poll with options as JSON array with IDs
    const pollOptions = options.map((option, index) => ({
      id: `option_${index + 1}`,
      text: option,
      votes: 0,
    }));

    const poll = await this.prisma.polls.create({
      data: {
        id: generateId(),
        building_id: buildingId,
        created_by: createdBy,
        title,
        description,
        options: pollOptions,
        allow_multiple: allowMultiple,
        is_anonymous: isAnonymous,
        end_date: endDate,
        updated_at: new Date(),
      },
    });

    // Log audit
    await this.auditLog.log({
      userId: createdBy,
      action: 'poll.created',
      resourceType: 'poll',
      resourceId: poll.id,
    });

    // Send push notifications to all building residents
    try {
      // Get all residents in the building
      const residents = await this.prisma.user_profiles.findMany({
        where: {
          apartment_owners: {
            some: {
              apartments: {
                building_id: buildingId,
              },
            },
          },
        },
        select: { id: true },
      });

      // Send notification to each resident
      for (const resident of residents) {
        if (resident.id !== createdBy) {
          // Don't notify the creator
          await this.notificationService.sendTemplatedNotification({
            userId: resident.id,
            templateName: 'new_poll',
            variables: {
              pollTitle: title,
              endDate: endDate.toLocaleDateString(),
            },
          });
        }
      }
    } catch (error) {
      // Log error but don't fail the poll creation
      console.error('Failed to send poll notifications:', error);
    }

    return poll;
  }
}
