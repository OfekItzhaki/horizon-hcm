import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CommitteeMemberGuard } from '../committee-member.guard';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../services/cache.service';
import { AuditLogService } from '../../services/audit-log.service';

describe('CommitteeMemberGuard', () => {
  let guard: CommitteeMemberGuard;
  let prisma: PrismaService;
  let cache: CacheService;
  let auditLog: AuditLogService;

  const mockPrisma = {
    building_committee_members: {
      findUnique: jest.fn(),
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
    guard = new CommitteeMemberGuard(prisma, cache, auditLog);
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
      expect(prisma.building_committee_members.findUnique).not.toHaveBeenCalled();
    });

    it('should return false when buildingId is not provided', async () => {
      const context = createMockContext({ id: 'user-123' }, {});

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      expect(cache.get).not.toHaveBeenCalled();
      expect(prisma.building_committee_members.findUnique).not.toHaveBeenCalled();
    });

    it('should return true when cache hit shows user is committee member', async () => {
      const user = { id: 'user-123' };
      const buildingId = 'building-123';
      const context = createMockContext(user, { buildingId });

      mockCache.get.mockResolvedValue('true');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(cache.get).toHaveBeenCalledWith(`committee:${user.id}:${buildingId}`);
      expect(prisma.building_committee_members.findUnique).not.toHaveBeenCalled();
    });

    it('should return false when cache hit shows user is not committee member', async () => {
      const user = { id: 'user-123' };
      const buildingId = 'building-123';
      const context = createMockContext(user, { buildingId });

      mockCache.get.mockResolvedValue('false');

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      expect(cache.get).toHaveBeenCalledWith(`committee:${user.id}:${buildingId}`);
      expect(prisma.building_committee_members.findUnique).not.toHaveBeenCalled();
    });

    it('should query database on cache miss and return true for committee member', async () => {
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
      expect(cache.get).toHaveBeenCalledWith(`committee:${user.id}:${buildingId}`);
      expect(prisma.building_committee_members.findUnique).toHaveBeenCalledWith({
        where: {
          building_id_user_id: {
            building_id: buildingId,
            user_id: user.id,
          },
        },
      });
      expect(cache.set).toHaveBeenCalledWith(
        `committee:${user.id}:${buildingId}`,
        'true',
        900, // 15 minutes
      );
    });

    it('should throw ForbiddenException when user is not committee member', async () => {
      const user = { id: 'user-123' };
      const buildingId = 'building-123';
      const context = createMockContext(user, { buildingId });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.building_committee_members.findUnique.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Access denied: Committee member role required',
      );

      expect(cache.set).toHaveBeenCalledWith(
        `committee:${user.id}:${buildingId}`,
        'false',
        900,
      );
      expect(auditLog.log).toHaveBeenCalledWith({
        userId: user.id,
        action: 'authorization.failed',
        resourceType: 'Building',
        resourceId: buildingId,
        metadata: { reason: 'not_committee_member', endpoint: '/test-endpoint' },
      });
    });

    it('should extract buildingId from request body when not in params', async () => {
      const user = { id: 'user-123' };
      const buildingId = 'building-123';
      const context = createMockContext(user, {}, { buildingId });

      mockCache.get.mockResolvedValue('true');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(cache.get).toHaveBeenCalledWith(`committee:${user.id}:${buildingId}`);
    });

    it('should cache result for 15 minutes (900 seconds)', async () => {
      const user = { id: 'user-123' };
      const buildingId = 'building-123';
      const context = createMockContext(user, { buildingId });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.building_committee_members.findUnique.mockResolvedValue({
        building_id: buildingId,
        user_id: user.id,
      });

      await guard.canActivate(context);

      expect(cache.set).toHaveBeenCalledWith(
        `committee:${user.id}:${buildingId}`,
        'true',
        900,
      );
    });

    it('should log authorization failure with correct metadata', async () => {
      const user = { id: 'user-123' };
      const buildingId = 'building-123';
      const context = createMockContext(user, { buildingId });

      mockCache.get.mockResolvedValue(null);
      mockPrisma.building_committee_members.findUnique.mockResolvedValue(null);

      try {
        await guard.canActivate(context);
      } catch (error) {
        // Expected to throw
      }

      expect(auditLog.log).toHaveBeenCalledWith({
        userId: user.id,
        action: 'authorization.failed',
        resourceType: 'Building',
        resourceId: buildingId,
        metadata: {
          reason: 'not_committee_member',
          endpoint: '/test-endpoint',
        },
      });
    });
  });
});
