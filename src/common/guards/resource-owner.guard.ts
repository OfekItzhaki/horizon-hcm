import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../services/audit-log.service';

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = this.extractResourceId(request);
    const resourceType = this.extractResourceType(context);

    if (!user || !resourceId || !resourceType) {
      return false;
    }

    // Special case: Users can always modify their own profile
    if (resourceType === 'UserProfile' && resourceId === user.id) {
      return true;
    }

    // Check if user is committee member for the building (if applicable)
    const buildingId = await this.getBuildingIdForResource(resourceType, resourceId);
    if (buildingId) {
      const isCommittee = await this.prisma.buildingCommitteeMember.findUnique({
        where: {
          building_id_user_id: {
            building_id: buildingId,
            user_id: user.id,
          },
        },
      });

      if (isCommittee) {
        return true; // Committee members can modify any resource in their building
      }
    }

    // Check resource ownership
    const isOwner = await this.checkResourceOwnership(resourceType, resourceId, user.id);

    if (!isOwner) {
      await this.auditLog.log({
        userId: user.id,
        action: 'authorization.failed',
        resourceType,
        resourceId,
        metadata: { reason: 'not_resource_owner', endpoint: request.url },
      });

      throw new ForbiddenException('Access denied: You do not own this resource');
    }

    return true;
  }

  private extractResourceId(request: any): string | null {
    // Try various common parameter names
    return request.params?.id || request.params?.resourceId || request.params?.userId || null;
  }

  private extractResourceType(context: ExecutionContext): string | null {
    // Extract from controller metadata
    const handler = context.getHandler();
    const resourceType = Reflect.getMetadata('resourceType', handler);
    return resourceType || null;
  }

  private async getBuildingIdForResource(
    resourceType: string,
    resourceId: string,
  ): Promise<string | null> {
    // Map resource types to their building associations
    switch (resourceType) {
      case 'Apartment':
        const apartment = await this.prisma.apartment.findUnique({
          where: { id: resourceId },
          select: { building_id: true },
        });
        return apartment?.building_id || null;

      case 'Payment':
        const payment = await this.prisma.payment.findUnique({
          where: { id: resourceId },
          include: { apartment: { select: { building_id: true } } },
        });
        return payment?.apartment?.building_id || null;

      case 'MaintenanceRequest':
        const maintenance = await this.prisma.maintenanceRequest.findUnique({
          where: { id: resourceId },
          select: { building_id: true },
        });
        return maintenance?.building_id || null;

      default:
        return null;
    }
  }

  private async checkResourceOwnership(
    resourceType: string,
    resourceId: string,
    userId: string,
  ): Promise<boolean> {
    // Check ownership based on resource type
    switch (resourceType) {
      case 'MaintenanceRequest':
        const maintenance = await this.prisma.maintenanceRequest.findUnique({
          where: { id: resourceId },
          select: { requester_id: true },
        });
        return maintenance?.requester_id === userId;

      case 'Announcement':
        const announcement = await this.prisma.announcement.findUnique({
          where: { id: resourceId },
          select: { author_id: true },
        });
        return announcement?.author_id === userId;

      case 'Document':
        const document = await this.prisma.document.findUnique({
          where: { id: resourceId },
          select: { uploaded_by: true },
        });
        return document?.uploaded_by === userId;

      default:
        return false;
    }
  }
}
