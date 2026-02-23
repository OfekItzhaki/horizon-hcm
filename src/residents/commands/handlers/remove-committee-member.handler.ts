import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, Injectable } from '@nestjs/common';
import { RemoveCommitteeMemberCommand } from '../impl/remove-committee-member.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { CacheService } from '../../../common/services/cache.service';

@Injectable()
@CommandHandler(RemoveCommitteeMemberCommand)
export class RemoveCommitteeMemberHandler implements ICommandHandler<RemoveCommitteeMemberCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly cache: CacheService,
  ) {}

  async execute(command: RemoveCommitteeMemberCommand): Promise<any> {
    const { buildingId, memberId, currentUserId } = command;

    // Find the committee member
    const committeeMember = await this.prisma.building_committee_members.findUnique({
      where: { id: memberId },
      include: {
        user_profile: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });

    if (!committeeMember) {
      throw new NotFoundException('Committee member not found');
    }

    // Verify the member belongs to the specified building
    if (committeeMember.building_id !== buildingId) {
      throw new NotFoundException('Committee member not found in this building');
    }

    const userId = committeeMember.user_id;

    // Delete the committee membership
    await this.prisma.building_committee_members.delete({
      where: { id: memberId },
    });

    // Invalidate cache keys
    await this.cache.delete(`committee:${userId}:${buildingId}`);
    await this.cache.delete(`building-member:${userId}:${buildingId}`);

    // Log audit entry
    await this.audit_logs.log({
      userId: currentUserId,
      action: 'committee_member.removed',
      resourceType: 'BuildingCommitteeMember',
      resourceId: memberId,
      metadata: {
        buildingId,
        userId,
        role: committeeMember.role,
        removedUserName: committeeMember.user_profile.full_name,
      },
    });

    // TODO: Send notification to the removed committee member

    return {
      success: true,
      message: 'Committee member removed successfully',
    };
  }
}
