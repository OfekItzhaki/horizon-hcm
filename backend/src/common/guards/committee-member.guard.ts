import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../services/cache.service';
import { AuditLogService } from '../services/audit-log.service';

/**
 * Authorization guard that restricts access to committee members only.
 *
 * Verifies that the authenticated user is a committee member of the specified building.
 * Results are cached for 15 minutes to improve performance.
 *
 * @example
 * ```typescript
 * @UseGuards(CommitteeMemberGuard)
 * @Post('buildings/:buildingId/announcements')
 * async createAnnouncement() { ... }
 * ```
 */
@Injectable()
export class CommitteeMemberGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Checks if the user is a committee member of the building.
   *
   * @param context - Execution context containing the HTTP request
   * @returns True if user is a committee member, throws ForbiddenException otherwise
   * @throws {ForbiddenException} When user is not a committee member
   */
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
      await this.auditLog.log({
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

  /**
   * Extracts building ID from request params or body.
   */
  private extractBuildingId(request: any): string | null {
    // Try params first, then body
    return request.params?.buildingId || request.body?.buildingId || null;
  }
}

