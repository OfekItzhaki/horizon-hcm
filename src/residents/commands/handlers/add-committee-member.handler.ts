import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, ConflictException, Injectable } from '@nestjs/common';
import { AddCommitteeMemberCommand } from '../impl/add-committee-member.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { CacheService } from '../../../common/services/cache.service';

@Injectable()
@CommandHandler(AddCommitteeMemberCommand)
export class AddCommitteeMemberHandler implements ICommandHandler<AddCommitteeMemberCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly cache: CacheService,
  ) {}

  async execute(command: AddCommitteeMemberCommand): Promise<any> {
    const { buildingId, userId, role, currentUserId } = command;

    // Validate building exists
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
    });

    if (!building) {
      throw new NotFoundException('Building not found');
    }

    // Validate user exists
    const user = await this.prisma.user_profiles.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a committee member
    const existingMember = await this.prisma.building_committee_members.findUnique({
      where: {
        building_id_user_id: {
          building_id: buildingId,
          user_id: userId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a committee member of this building');
    }

    // Create committee membership
    const committeeMember = await this.prisma.building_committee_members.create({
      data: {
        building_id: buildingId,
        user_id: userId,
        role: role,
      },
      include: {
        user_profile: {
          select: {
            id: true,
            full_name: true,
            phone_number: true,
            user_type: true,
          },
        },
      },
    });

    // Invalidate cache keys
    await this.cache.delete(`committee:${userId}:${buildingId}`);
    await this.cache.delete(`building-member:${userId}:${buildingId}`);

    // Log audit entry
    await this.audit_logs.log({
      userId: currentUserId,
      action: 'committee_member.added',
      resourceType: 'BuildingCommitteeMember',
      resourceId: committeeMember.id,
      metadata: {
        buildingId,
        userId,
        role,
      },
    });

    // TODO: Send notification to the new committee member

    return committeeMember;
  }
}
