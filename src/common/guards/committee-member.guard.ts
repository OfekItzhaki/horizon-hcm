import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../services/cache.service';
import { AuditLogService } from '../services/audit-log.service';

@Injectable()
export class CommitteeMemberGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly auditLog: AuditLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by authentication middleware
    const buildingId = this.extractBuildingId(request);

    if (!user || !buildingId) {
      return false;
    }

    // Check cache first
    const cacheKey = `committee:${user.id}:${buildingId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached !== null) {
      return cached === 'true';
    }

    // Query database
    const membership = await this.prisma.building_committee_members.findUnique({
      where: {
        building_id_user_id: {
          building_id: buildingId,
          user_id: user.id,
        },
      },
    });

    const isCommitteeMember = !!membership;

    // Cache result for 15 minutes
    await this.cache.set(cacheKey, isCommitteeMember ? 'true' : 'false', 900);

    if (!isCommitteeMember) {
      // Log authorization failure
      await this.audit_logs.log({
        userId: user.id,
        action: 'authorization.failed',
        resourceType: 'Building',
        resourceId: buildingId,
        metadata: { reason: 'not_committee_member', endpoint: request.url },
      });

      throw new ForbiddenException('Access denied: Committee member role required');
    }

    return true;
  }

  private extractBuildingId(request: any): string | null {
    // Try params first, then body
    return request.params?.buildingId || request.body?.buildingId || null;
  }
}
