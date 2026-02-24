import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { BuildingMemberGuard } from '../building-member.guard';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../services/cache.service';
import { AuditLogService } from '../../services/audit-log.service';

describe('BuildingMemberGuard', () => {
  let guard: BuildingMemberGuard;
  let prisma: PrismaService;
  let cache: CacheService;
  let auditLog: AuditLogService;

  const mockPrisma = {
    building_committee_members: {
      findUnique: jest.fn(),
    },
    apartment_owners: {
      findFirst: jest.fn(),
    },
    apartment_tenants: {
      findFirst: jest.fn(),
    },
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockAuditLog = {
    log: jest.fn(),
  };

  beforeEach(() => {
    prisma = mockPrisma as any;
    cache = mockCache as any;
    auditLog = mockAuditLog as any;
    guard = new BuildingMemberGuard(prisma, cache, auditLog);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (user: any, params: any, body: any = {}): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
          body,
          url: '/test-endpoint',
        }),
      }),
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should return false when user is not provided', async () => {
      const context = createMockContext(null, { buildingId: 'building-123' });

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      expect(cache.get).not.toHaveBeenCalled();
    });

    it('should return false when buildingId is not provided', async () => {
      const context = createMockContext({ id: 'user-123' }, {});

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      expect(cache.get).not.toHaveBeenCalled();
    });

    it('should return true when cache hit shows user is building member', async () => {
      const user = { id: 'user-123' };
      const buildingId = 'building-123';
      const context = createMockContext(user, { buildingId });

      mockCache.get.mockResolvedValue('true');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(cache.get).toHaveBeenCalledWith(`building-member:${user.id}:${buildingId}`);
      expect(prisma.building_committee_members.findUnique).not.toHaveBeenCalled();
    });

    it('should return false when cache hit shows user is not building member', async () => {
      const user = { id: 'user-123' };
      const buildingId = 'building-123';
      const context = createMockContext(user, { buildingId });

      mockCache.get.mockResolvedValue('false');

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      expect(cache.get).toHaveBeenCalledWith(`building-member:${user.id}:${buildingId}`);
    });

    it('should return true for committee member', async () => {
      const user = { id: 'user-123' };
      const buildingId = 'building-123';
      const context = createMockContext(user, { buildingId });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.building_committee_members.findUnique.mockResolvedValue({
        building_id: buildingId,
        user_id: user.id,
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(cache.set).toHaveBeenCalledWith(
        `building-member:${user.id}:${buildingId}`,
        'true',
        900,
      );
    });

    it('should return true for apartment owner', async () => {
      const user = { id: 'user-123' };
      const buildingId = 'building-123';
      const context = createMockContext(user, { buildingId });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.building_committee_members.findUnique.mockResolvedValue(null);
      mockPrisma.apartment_owners.findFirst.mockResolvedValue({
        user_id: user.id,
        apartment_id: 'apartment-123',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prisma.apartment_owners.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: user.id,
          apartments: {
            building_id: buildingId,
          },
        },
      });
      expect(cache.set).toHaveBeenCalledWith(
        `building-member:${user.id}:${buildingId}`,
        'true',
        900,
      );
    });

    it('should return true for active tenant', async () => {
      const user = { id: 'user-123' };
      const buildingId = 'building-123';
      const context = createMockContext(user, { buildingId });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.building_committee_members.findUnique.mockResolvedValue(null);
      mockPrisma.apartment_owners.findFirst.mockResolvedValue(null);
      mockPrisma.apartment_tenants.findFirst.mockResolvedValue({
        user_id: user.id,
        apartment_id: 'apartment-123',
        is_active: true,
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prisma.apartment_tenants.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: user.id,
          is_active: true,
          apartments: {
            building_id: buildingId,
          },
        },
      });
      expect(cache.set).toHaveBeenCalledWith(
        `building-member:${user.id}:${buildingId}`,
        'true',
        900,
      );
    });

    it('should throw ForbiddenException when user is not building member', async () => {
      const user = { id: 'user-123' };
      const buildingId = 'building-123';
      const context = createMockContext(user, { buildingId });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.building_committee_members.findUnique.mockResolvedValue(null);
      mockPrisma.apartment_owners.findFirst.mockResolvedValue(null);
      mockPrisma.apartment_tenants.findFirst.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Access denied: You do not belong to this building',
      );

      expect(cache.set).toHaveBeenCalledWith(
        `building-member:${user.id}:${buildingId}`,
        'false',
        900,
      );
      expect(auditLog.log).toHaveBeenCalledWith({
        userId: user.id,
        action: 'authorization.failed',
        resourceType: 'Building',
        resourceId: buildingId,
        metadata: { reason: 'not_building_member', endpoint: '/test-endpoint' },
      });
    });

    it('should check committee membership first before checking ownership', async () => {
      const user = { id: 'user-123' };
      const buildingId = 'building-123';
      const context = createMockContext(user, { buildingId });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.building_committee_members.findUnique.mockResolvedValue({
        building_id: buildingId,
        user_id: user.id,
      });

      await guard.canActivate(context);

      expect(prisma.building_committee_members.findUnique).toHaveBeenCalled();
      expect(prisma.apartment_owners.findFirst).not.toHaveBeenCalled();
      expect(prisma.apartment_tenants.findFirst).not.toHaveBeenCalled();
    });

    it('should check ownership before checking tenancy', async () => {
      const user = { id: 'user-123' };
      const buildingId = 'building-123';
      const context = createMockContext(user, { buildingId });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.building_committee_members.findUnique.mockResolvedValue(null);
      mockPrisma.apartment_owners.findFirst.mockResolvedValue({
        user_id: user.id,
        apartment_id: 'apartment-123',
      });

      await guard.canActivate(context);

      expect(prisma.building_committee_members.findUnique).toHaveBeenCalled();
      expect(prisma.apartment_owners.findFirst).toHaveBeenCalled();
      expect(prisma.apartment_tenants.findFirst).not.toHaveBeenCalled();
    });

    it('should extract buildingId from request body when not in params', async () => {
      const user = { id: 'user-123' };
      const buildingId = 'building-123';
      const context = createMockContext(user, {}, { buildingId });

      mockCache.get.mockResolvedValue('true');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(cache.get).toHaveBeenCalledWith(`building-member:${user.id}:${buildingId}`);
    });

    it('should only check active tenants', async () => {
      const user = { id: 'user-123' };
      const buildingId = 'building-123';
      const context = createMockContext(user, { buildingId });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.building_committee_members.findUnique.mockResolvedValue(null);
      mockPrisma.apartment_owners.findFirst.mockResolvedValue(null);
      mockPrisma.apartment_tenants.findFirst.mockResolvedValue(null);

      try {
        await guard.canActivate(context);
      } catch (error) {
        // Expected to throw
      }

      expect(prisma.apartment_tenants.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          is_active: true,
        }),
      });
    });
  });
});
