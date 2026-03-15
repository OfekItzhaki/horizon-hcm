import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../services/cache.service';
import { AuditLogService } from '../services/audit-log.service';

/**
 * Authorization guard that restricts access to building members only.
 * 
 * Verifies that the authenticated user is a member of the specified building through
 * committee membership, apartment ownership, or active tenancy. Results are cached
 * for 15 minutes to improve performance.
 * 
 * @example
 * ```typescript
 * @UseGuards(BuildingMemberGuard)
 * @Get('buildings/:buildingId/announcements')
 * async getAnnouncements() { ... }
 * ```
 */
@Injectable()
export class BuildingMemberGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Checks if the user is a member of the building (committee, owner, or tenant).
   * 
   * @param context - Execution context containing the HTTP request
   * @returns True if user is a building member, throws ForbiddenException otherwise
   * @throws {ForbiddenException} When user is not a member of the building
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const buildingId = this.extractBuildingId(request);

    if (!user || !buildingId) {
      return false;
    }

    // Admin role bypasses building membership check
    if (user.roles?.includes('admin') || user.role === 'admin') {
      return true;
    }

    // Check cache first
    const cacheKey = `building-member:${user.id}:${buildingId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached !== null) {
      return cached === 'true';
    }

    // Resolve profile ID — apartment_owners/tenants/committee store user_profiles.id
    const profile = await this.prisma.user_profiles.findUnique({
      where: { user_id: user.id },
      select: { id: true },
    });
    const profileId = profile?.id;

    // Check committee membership
    const isCommittee = profileId
      ? await this.prisma.building_committee_members.findUnique({
          where: {
            building_id_user_id: {
              building_id: buildingId,
              user_id: profileId,
            },
          },
        })
      : null;

    if (isCommittee) {
      await this.cache.set(cacheKey, 'true', 900);
      return true;
    }

    // Check apartment ownership
    const isOwner = profileId
      ? await this.prisma.apartment_owners.findFirst({
          where: {
            user_id: profileId,
            apartments: {
              building_id: buildingId,
            },
          },
        })
      : null;

    if (isOwner) {
      await this.cache.set(cacheKey, 'true', 900);
      return true;
    }

    // Check active tenancy
    const isTenant = profileId
      ? await this.prisma.apartment_tenants.findFirst({
          where: {
            user_id: profileId,
            is_active: true,
            apartments: {
              building_id: buildingId,
            },
          },
        })
      : null;

    const isMember = !!isTenant;

    // Cache result for 15 minutes
    await this.cache.set(cacheKey, isMember ? 'true' : 'false', 900);

    if (!isMember) {
      await this.auditLog.log({
        userId: user.id,
        action: 'authorization.failed',
        resourceType: 'Building',
        resourceId: buildingId,
        metadata: { reason: 'not_building_member', endpoint: request.url },
      });

      throw new ForbiddenException('Access denied: You do not belong to this building');
    }

    return true;
  }

  /**
   * Extracts building ID from request params, query, or body.
   */
  private extractBuildingId(request: any): string | null {
    return request.params?.buildingId || request.query?.buildingId || request.body?.buildingId || null;
  }
}
