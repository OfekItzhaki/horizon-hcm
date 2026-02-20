import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { CacheService } from '../services/cache.service';
import { AuditLogService } from '../services/audit-log.service';

@Injectable()
export class BuildingMemberGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly auditLog: AuditLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const buildingId = this.extractBuildingId(request);

    if (!user || !buildingId) {
      return false;
    }

    // Check cache first
    const cacheKey = `building-member:${user.id}:${buildingId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached !== null) {
      return cached === 'true';
    }

    // Check committee membership
    const isCommittee = await this.prisma.buildingCommitteeMember.findUnique({
      where: {
        building_id_user_id: {
          building_id: buildingId,
          user_id: user.id,
        },
      },
    });

    if (isCommittee) {
      await this.cache.set(cacheKey, 'true', 900);
      return true;
    }

    // Check apartment ownership
    const isOwner = await this.prisma.apartmentOwner.findFirst({
      where: {
        user_id: user.id,
        apartment: {
          building_id: buildingId,
        },
      },
    });

    if (isOwner) {
      await this.cache.set(cacheKey, 'true', 900);
      return true;
    }

    // Check active tenancy
    const isTenant = await this.prisma.apartmentTenant.findFirst({
      where: {
        user_id: user.id,
        is_active: true,
        apartment: {
          building_id: buildingId,
        },
      },
    });

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

      throw new ForbiddenException(
        'Access denied: You do not belong to this building',
      );
    }

    return true;
  }

  private extractBuildingId(request: any): string | null {
    return request.params?.buildingId || request.body?.buildingId || null;
  }
}
