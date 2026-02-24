import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ResourceOwnerGuard } from '../resource-owner.guard';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../services/audit-log.service';

describe('ResourceOwnerGuard', () => {
  let guard: ResourceOwnerGuard;
  let prisma: PrismaService;
  let auditLog: AuditLogService;

  const mockPrisma = {
    building_committee_members: {
      findUnique: jest.fn(),
    },
    apartments: {
      findUnique: jest.fn(),
    },
    payments: {
      findUnique: jest.fn(),
    },
    maintenance_requests: {
      findUnique: jest.fn(),
    },
    announcements: {
      findUnique: jest.fn(),
    },
    documents: {
      findUnique: jest.fn(),
    },
  };

  const mockAuditLog = {
    log: jest.fn(),
  };

  beforeEach(() => {
    prisma = mockPrisma as any;
    auditLog = mockAuditLog as any;
    guard = new ResourceOwnerGuard(prisma, auditLog);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (
    user: any,
    params: any,
    resourceType?: string,
  ): ExecutionContext => {
    const handler = jest.fn();
    if (resourceType) {
      Reflect.defineMetadata('resourceType', resourceType, handler);
    }
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
          url: '/test-endpoint',
        }),
      }),
      getHandler: () => handler,
    } as any;
  };

  describe('canActivate', () => {
    it('should return false when user is not provided', async () => {
      const context = createMockContext(null, { id: 'resource-123' }, 'MaintenanceRequest');

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when resourceId is not provided', async () => {
      const context = createMockContext({ id: 'user-123' }, {}, 'MaintenanceRequest');

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when resourceType is not provided', async () => {
      const context = createMockContext({ id: 'user-123' }, { id: 'resource-123' });

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return true for UserProfile when user modifies their own profile', async () => {
      const userId = 'user-123';
      const context = createMockContext({ id: userId }, { id: userId }, 'UserProfile');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prisma.building_committee_members.findUnique).not.toHaveBeenCalled();
    });

    it('should return true when user is committee member for the building', async () => {
      const user = { id: 'user-123' };
      const resourceId = 'maintenance-123';
      const buildingId = 'building-123';
      const context = createMockContext(user, { id: resourceId }, 'MaintenanceRequest');

      mockPrisma.maintenance_requests.findUnique.mockResolvedValue({
        id: resourceId,
        building_id: buildingId,
      });
      mockPrisma.building_committee_members.findUnique.mockResolvedValue({
        building_id: buildingId,
        user_id: user.id,
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prisma.maintenance_requests.findUnique).toHaveBeenCalledWith({
        where: { id: resourceId },
        select: { building_id: true },
      });
      expect(prisma.building_committee_members.findUnique).toHaveBeenCalledWith({
        where: {
          building_id_user_id: {
            building_id: buildingId,
            user_id: user.id,
          },
        },
      });
    });

    it('should return true when user owns the MaintenanceRequest', async () => {
      const user = { id: 'user-123' };
      const resourceId = 'maintenance-123';
      const context = createMockContext(user, { id: resourceId }, 'MaintenanceRequest');

      mockPrisma.maintenance_requests.findUnique
        .mockResolvedValueOnce({ id: resourceId, building_id: 'building-123' })
        .mockResolvedValueOnce({ id: resourceId, requester_id: user.id });
      mockPrisma.building_committee_members.findUnique.mockResolvedValue(null);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user owns the Announcement', async () => {
      const user = { id: 'user-123' };
      const resourceId = 'announcement-123';
      const context = createMockContext(user, { id: resourceId }, 'Announcement');

      mockPrisma.announcements.findUnique.mockResolvedValue({
        id: resourceId,
        author_id: user.id,
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prisma.announcements.findUnique).toHaveBeenCalledWith({
        where: { id: resourceId },
        select: { author_id: true },
      });
    });

    it('should return true when user owns the Document', async () => {
      const user = { id: 'user-123' };
      const resourceId = 'document-123';
      const context = createMockContext(user, { id: resourceId }, 'Document');

      mockPrisma.documents.findUnique.mockResolvedValue({
        id: resourceId,
        uploaded_by: user.id,
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prisma.documents.findUnique).toHaveBeenCalledWith({
        where: { id: resourceId },
        select: { uploaded_by: true },
      });
    });

    it('should throw ForbiddenException when user does not own the resource', async () => {
      const user = { id: 'user-123' };
      const resourceId = 'maintenance-123';
      const context = createMockContext(user, { id: resourceId }, 'MaintenanceRequest');

      mockPrisma.maintenance_requests.findUnique
        .mockResolvedValueOnce({ id: resourceId, building_id: 'building-123' })
        .mockResolvedValueOnce({ id: resourceId, requester_id: 'other-user' });
      mockPrisma.building_committee_members.findUnique.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Access denied: You do not own this resource',
      );

      expect(auditLog.log).toHaveBeenCalledWith({
        userId: user.id,
        action: 'authorization.failed',
        resourceType: 'MaintenanceRequest',
        resourceId,
        metadata: { reason: 'not_resource_owner', endpoint: '/test-endpoint' },
      });
    });

    it('should extract resourceId from params.resourceId', async () => {
      const user = { id: 'user-123' };
      const resourceId = 'resource-123';
      const context = createMockContext(
        user,
        { resourceId },
        'MaintenanceRequest',
      );

      mockPrisma.maintenance_requests.findUnique
        .mockResolvedValueOnce({ id: resourceId, building_id: 'building-123' })
        .mockResolvedValueOnce({ id: resourceId, requester_id: user.id });
      mockPrisma.building_committee_members.findUnique.mockResolvedValue(null);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should extract resourceId from params.userId', async () => {
      const userId = 'user-123';
      const context = createMockContext({ id: userId }, { userId }, 'UserProfile');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should get buildingId for Apartment resource', async () => {
      const user = { id: 'user-123' };
      const apartmentId = 'apartment-123';
      const buildingId = 'building-123';
      const context = createMockContext(user, { id: apartmentId }, 'Apartment');

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: apartmentId,
        building_id: buildingId,
      });
      mockPrisma.building_committee_members.findUnique.mockResolvedValue({
        building_id: buildingId,
        user_id: user.id,
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prisma.apartments.findUnique).toHaveBeenCalledWith({
        where: { id: apartmentId },
        select: { building_id: true },
      });
    });

    it('should get buildingId for Payment resource', async () => {
      const user = { id: 'user-123' };
      const paymentId = 'payment-123';
      const buildingId = 'building-123';
      const context = createMockContext(user, { id: paymentId }, 'Payment');

      mockPrisma.payments.findUnique.mockResolvedValue({
        id: paymentId,
        apartments: { building_id: buildingId },
      });
      mockPrisma.building_committee_members.findUnique.mockResolvedValue({
        building_id: buildingId,
        user_id: user.id,
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prisma.payments.findUnique).toHaveBeenCalledWith({
        where: { id: paymentId },
        include: { apartments: { select: { building_id: true } } },
      });
    });

    it('should return false for unknown resource type ownership check', async () => {
      const user = { id: 'user-123' };
      const resourceId = 'resource-123';
      const context = createMockContext(user, { id: resourceId }, 'UnknownType');

      try {
        await guard.canActivate(context);
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
      }

      expect(auditLog.log).toHaveBeenCalled();
    });

    it('should log authorization failure with correct metadata', async () => {
      const user = { id: 'user-123' };
      const resourceId = 'maintenance-123';
      const resourceType = 'MaintenanceRequest';
      const context = createMockContext(user, { id: resourceId }, resourceType);

      mockPrisma.maintenance_requests.findUnique
        .mockResolvedValueOnce({ id: resourceId, building_id: 'building-123' })
        .mockResolvedValueOnce({ id: resourceId, requester_id: 'other-user' });
      mockPrisma.building_committee_members.findUnique.mockResolvedValue(null);

      try {
        await guard.canActivate(context);
      } catch (error) {
        // Expected to throw
      }

      expect(auditLog.log).toHaveBeenCalledWith({
        userId: user.id,
        action: 'authorization.failed',
        resourceType,
        resourceId,
        metadata: {
          reason: 'not_resource_owner',
          endpoint: '/test-endpoint',
        },
      });
    });
  });
});
