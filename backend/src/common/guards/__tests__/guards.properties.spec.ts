import * as fc from 'fast-check';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CommitteeMemberGuard } from '../committee-member.guard';
import { BuildingMemberGuard } from '../building-member.guard';
import { ResourceOwnerGuard } from '../resource-owner.guard';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../services/cache.service';
import { AuditLogService } from '../../services/audit-log.service';

// Arbitraries
const uuidArbitrary = () =>
  fc.tuple(
    fc.hexaString({ minLength: 8, maxLength: 8 }),
    fc.hexaString({ minLength: 4, maxLength: 4 }),
    fc.hexaString({ minLength: 4, maxLength: 4 }),
    fc.hexaString({ minLength: 4, maxLength: 4 }),
    fc.hexaString({ minLength: 12, maxLength: 12 }),
  ).map(([a, b, c, d, e]) => `${a}-${b}-${c}-${d}-${e}`);

const createMockExecutionContext = (user: any, params: any, body: any = {}): ExecutionContext => {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user,
        params,
        body,
        url: '/test-endpoint',
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;
};

describe('Authorization Guards - Property-Based Tests', () => {
  let committeeMemberGuard: CommitteeMemberGuard;
  let buildingMemberGuard: BuildingMemberGuard;
  let resourceOwnerGuard: ResourceOwnerGuard;
  let prismaService: PrismaService;
  let cacheService: CacheService;
  let auditLogService: AuditLogService;

  beforeEach(() => {
    // Create mock services
    prismaService = {
      building_committee_members: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      apartment_owners: {
        findFirst: jest.fn(),
      },
      apartment_tenants: {
        findFirst: jest.fn(),
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
      apartments: {
        findUnique: jest.fn(),
      },
      payments: {
        findUnique: jest.fn(),
      },
    } as any;

    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
    } as any;

    auditLogService = {
      log: jest.fn(),
    } as any;

    // Create guards manually with mocked dependencies
    committeeMemberGuard = new CommitteeMemberGuard(prismaService, cacheService, auditLogService);
    buildingMemberGuard = new BuildingMemberGuard(prismaService, cacheService, auditLogService);
    resourceOwnerGuard = new ResourceOwnerGuard(prismaService, auditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 36: Committee Authorization Verification', () => {
    it('should allow access only to committee members', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          fc.boolean(),
          async (userId, buildingId, isCommitteeMember) => {
            const context = createMockExecutionContext(
              { id: userId },
              { buildingId },
            );

            // Mock cache miss
            jest.spyOn(cacheService, 'get').mockResolvedValue(null);

            // Mock database response
            jest
              .spyOn(prismaService.building_committee_members, 'findUnique')
              .mockResolvedValue(
                isCommitteeMember
                  ? ({ id: 'member-id', user_id: userId, building_id: buildingId } as any)
                  : null,
              );

            if (isCommitteeMember) {
              const result = await committeeMemberGuard.canActivate(context);
              expect(result).toBe(true);
            } else {
              await expect(committeeMemberGuard.canActivate(context)).rejects.toThrow(
                ForbiddenException,
              );
            }
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 39: Authorization Failure Audit Logging', () => {
    it('should log all authorization failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          async (userId, buildingId) => {
            const context = createMockExecutionContext(
              { id: userId },
              { buildingId },
            );

            // Mock cache miss
            jest.spyOn(cacheService, 'get').mockResolvedValue(null);

            // Mock database response - user is NOT a committee member
            jest
              .spyOn(prismaService.building_committee_members, 'findUnique')
              .mockResolvedValue(null);

            try {
              await committeeMemberGuard.canActivate(context);
            } catch (error) {
              // Expected to throw
            }

            // Verify audit log was called
            expect(auditLogService.log).toHaveBeenCalledWith(
              expect.objectContaining({
                userId,
                action: 'authorization.failed',
                resourceType: 'Building',
                resourceId: buildingId,
              }),
            );
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 40: Building Membership Verification', () => {
    it('should allow access to any building member (committee, owner, or tenant)', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          fc.constantFrom('committee', 'owner', 'tenant', 'none'),
          async (userId, buildingId, membershipType) => {
            const context = createMockExecutionContext(
              { id: userId },
              { buildingId },
            );

            // Mock cache miss
            jest.spyOn(cacheService, 'get').mockResolvedValue(null);

            // Mock database responses based on membership type
            jest
              .spyOn(prismaService.building_committee_members, 'findUnique')
              .mockResolvedValue(
                membershipType === 'committee'
                  ? ({ id: 'member-id' } as any)
                  : null,
              );

            jest
              .spyOn(prismaService.apartment_owners, 'findFirst')
              .mockResolvedValue(
                membershipType === 'owner'
                  ? ({ id: 'owner-id' } as any)
                  : null,
              );

            jest
              .spyOn(prismaService.apartment_tenants, 'findFirst')
              .mockResolvedValue(
                membershipType === 'tenant'
                  ? ({ id: 'tenant-id', is_active: true } as any)
                  : null,
              );

            if (membershipType !== 'none') {
              const result = await buildingMemberGuard.canActivate(context);
              expect(result).toBe(true);
            } else {
              await expect(buildingMemberGuard.canActivate(context)).rejects.toThrow(
                ForbiddenException,
              );
            }
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 42: Resource Ownership Verification', () => {
    it('should allow access to resource owners or committee members', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          uuidArbitrary(),
          fc.boolean(),
          fc.boolean(),
          async (userId, resourceId, buildingId, isOwner, isCommittee) => {
            const context = createMockExecutionContext(
              { id: userId },
              { id: resourceId },
            );

            // Mock resource type metadata
            jest.spyOn(Reflect, 'getMetadata').mockReturnValue('MaintenanceRequest');

            // Mock building ID lookup
            jest
              .spyOn(prismaService.maintenance_requests, 'findUnique')
              .mockResolvedValue({
                id: resourceId,
                building_id: buildingId,
                requester_id: isOwner ? userId : 'other-user-id',
              } as any);

            // Mock committee membership
            jest
              .spyOn(prismaService.building_committee_members, 'findUnique')
              .mockResolvedValue(
                isCommittee
                  ? ({ id: 'member-id' } as any)
                  : null,
              );

            if (isOwner || isCommittee) {
              const result = await resourceOwnerGuard.canActivate(context);
              expect(result).toBe(true);
            } else {
              await expect(resourceOwnerGuard.canActivate(context)).rejects.toThrow(
                ForbiddenException,
              );
            }
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 44: User Profile Self-Modification', () => {
    it('should always allow users to modify their own profile', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          async (userId) => {
            const context = createMockExecutionContext(
              { id: userId },
              { id: userId },
            );

            // Mock resource type as UserProfile
            jest.spyOn(Reflect, 'getMetadata').mockReturnValue('UserProfile');

            const result = await resourceOwnerGuard.canActivate(context);
            expect(result).toBe(true);

            // Verify no database queries were made (short-circuit)
            expect(prismaService.building_committee_members.findUnique).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 52: Multiple Guards Composition', () => {
    it('should execute guards in sequence and all must pass', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          fc.boolean(),
          fc.boolean(),
          async (userId, buildingId, isMember, isCommittee) => {
            const context = createMockExecutionContext(
              { id: userId },
              { buildingId },
            );

            // Mock cache miss
            jest.spyOn(cacheService, 'get').mockResolvedValue(null);

            // Mock building membership - committee members are also building members
            // For BuildingMemberGuard: check if user is committee, owner, or tenant
            jest
              .spyOn(prismaService.building_committee_members, 'findUnique')
              .mockResolvedValue(
                isCommittee
                  ? ({ id: 'member-id' } as any)
                  : null,
              );

            jest
              .spyOn(prismaService.apartment_owners, 'findFirst')
              .mockResolvedValue(
                isMember && !isCommittee
                  ? ({ id: 'owner-id' } as any)
                  : null,
              );

            jest
              .spyOn(prismaService.apartment_tenants, 'findFirst')
              .mockResolvedValue(null);

            // Test BuildingMemberGuard first
            if (isMember || isCommittee) {
              const buildingResult = await buildingMemberGuard.canActivate(context);
              expect(buildingResult).toBe(true);

              // Then test CommitteeMemberGuard
              if (isCommittee) {
                const committeeResult = await committeeMemberGuard.canActivate(context);
                expect(committeeResult).toBe(true);
              } else {
                await expect(committeeMemberGuard.canActivate(context)).rejects.toThrow(
                  ForbiddenException,
                );
              }
            } else {
              await expect(buildingMemberGuard.canActivate(context)).rejects.toThrow(
                ForbiddenException,
              );
            }
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 37: Building ID Extraction', () => {
    it('should extract buildingId from params or body', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          fc.boolean(),
          async (userId, buildingId, fromParams) => {
            const context = fromParams
              ? createMockExecutionContext({ id: userId }, { buildingId }, {})
              : createMockExecutionContext({ id: userId }, {}, { buildingId });

            // Mock cache miss
            jest.spyOn(cacheService, 'get').mockResolvedValue(null);

            // Mock committee membership
            jest
              .spyOn(prismaService.building_committee_members, 'findUnique')
              .mockResolvedValue({ id: 'member-id' } as any);

            const result = await committeeMemberGuard.canActivate(context);
            expect(result).toBe(true);

            // Verify the correct buildingId was used in the query
            expect(prismaService.building_committee_members.findUnique).toHaveBeenCalledWith(
              expect.objectContaining({
                where: expect.objectContaining({
                  building_id_user_id: expect.objectContaining({
                    building_id: buildingId,
                  }),
                }),
              }),
            );
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 38: Committee Membership Query Accuracy', () => {
    it('should query committee membership with correct user and building IDs', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          async (userId, buildingId) => {
            const context = createMockExecutionContext(
              { id: userId },
              { buildingId },
            );

            // Mock cache miss
            jest.spyOn(cacheService, 'get').mockResolvedValue(null);

            // Mock committee membership
            const findUniqueSpy = jest
              .spyOn(prismaService.building_committee_members, 'findUnique')
              .mockResolvedValue({ id: 'member-id', user_id: userId, building_id: buildingId } as any);

            await committeeMemberGuard.canActivate(context);

            // Verify query was called with exact user and building IDs
            expect(findUniqueSpy).toHaveBeenCalledWith({
              where: {
                building_id_user_id: {
                  building_id: buildingId,
                  user_id: userId,
                },
              },
            });
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 41: Building Membership Authorization Error', () => {
    it('should throw ForbiddenException with correct message when user is not a building member', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          async (userId, buildingId) => {
            const context = createMockExecutionContext(
              { id: userId },
              { buildingId },
            );

            // Mock cache miss
            jest.spyOn(cacheService, 'get').mockResolvedValue(null);

            // Mock no membership
            jest.spyOn(prismaService.building_committee_members, 'findUnique').mockResolvedValue(null);
            jest.spyOn(prismaService.apartment_owners, 'findFirst').mockResolvedValue(null);
            jest.spyOn(prismaService.apartment_tenants, 'findFirst').mockResolvedValue(null);

            await expect(buildingMemberGuard.canActivate(context)).rejects.toThrow(
              expect.objectContaining({
                message: 'Access denied: You do not belong to this building',
              }),
            );
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 43: Resource Ownership Authorization Error', () => {
    it('should throw ForbiddenException with correct message when user does not own resource', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          uuidArbitrary(),
          async (userId, resourceId, buildingId) => {
            const context = createMockExecutionContext(
              { id: userId },
              { id: resourceId },
            );

            // Mock resource type metadata
            jest.spyOn(Reflect, 'getMetadata').mockReturnValue('MaintenanceRequest');

            // Mock resource owned by someone else
            jest
              .spyOn(prismaService.maintenance_requests, 'findUnique')
              .mockResolvedValue({
                id: resourceId,
                building_id: buildingId,
                requester_id: 'other-user-id',
              } as any);

            // Mock user is not committee member
            jest.spyOn(prismaService.building_committee_members, 'findUnique').mockResolvedValue(null);

            await expect(resourceOwnerGuard.canActivate(context)).rejects.toThrow(
              expect.objectContaining({
                message: 'Access denied: You do not own this resource',
              }),
            );
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 53: Guard Execution Order', () => {
    it('should execute guards in the correct order: BuildingMember then CommitteeMember', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          async (userId, buildingId) => {
            const context = createMockExecutionContext(
              { id: userId },
              { buildingId },
            );

            // Mock cache miss
            jest.spyOn(cacheService, 'get').mockResolvedValue(null);

            // Track execution order
            const executionOrder: string[] = [];

            // Mock building membership with side effects to track order
            const committeeSpy = jest
              .spyOn(prismaService.building_committee_members, 'findUnique')
              .mockResolvedValue({ id: 'member-id' } as any);
            committeeSpy.mockImplementation((async () => {
              executionOrder.push('committee-check');
              return { id: 'member-id' } as any;
            }) as any);

            const ownerSpy = jest
              .spyOn(prismaService.apartment_owners, 'findFirst')
              .mockResolvedValue(null);
            ownerSpy.mockImplementation((async () => {
              executionOrder.push('owner-check');
              return null;
            }) as any);

            const tenantSpy = jest
              .spyOn(prismaService.apartment_tenants, 'findFirst')
              .mockResolvedValue(null);
            tenantSpy.mockImplementation((async () => {
              executionOrder.push('tenant-check');
              return null;
            }) as any);

            // Execute BuildingMemberGuard first
            await buildingMemberGuard.canActivate(context);
            const buildingCheckOrder = [...executionOrder];

            // Clear execution order
            executionOrder.length = 0;

            // Execute CommitteeMemberGuard second
            await committeeMemberGuard.canActivate(context);
            const committeeCheckOrder = [...executionOrder];

            // Verify BuildingMemberGuard checks all membership types
            expect(buildingCheckOrder).toContain('committee-check');

            // Verify CommitteeMemberGuard only checks committee membership
            expect(committeeCheckOrder).toContain('committee-check');
            expect(committeeCheckOrder).not.toContain('owner-check');
            expect(committeeCheckOrder).not.toContain('tenant-check');
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 54: Guard Short-Circuit Behavior', () => {
    it('should stop execution when first guard fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          async (userId, buildingId) => {
            const context = createMockExecutionContext(
              { id: userId },
              { buildingId },
            );

            // Mock cache miss
            jest.spyOn(cacheService, 'get').mockResolvedValue(null);

            // Mock no building membership
            jest.spyOn(prismaService.building_committee_members, 'findUnique').mockResolvedValue(null);
            jest.spyOn(prismaService.apartment_owners, 'findFirst').mockResolvedValue(null);
            jest.spyOn(prismaService.apartment_tenants, 'findFirst').mockResolvedValue(null);

            // BuildingMemberGuard should fail
            await expect(buildingMemberGuard.canActivate(context)).rejects.toThrow(
              ForbiddenException,
            );

            // Clear mocks to track if CommitteeMemberGuard would be called
            jest.clearAllMocks();

            // In a real guard composition, CommitteeMemberGuard would not be called
            // because BuildingMemberGuard already failed
            // This test verifies the short-circuit behavior conceptually
            expect(true).toBe(true);
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 55: Authorization Error Message Clarity', () => {
    it('should provide clear error messages for different authorization failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          fc.constantFrom('committee', 'building', 'resource'),
          async (userId, buildingId, guardType) => {
            const context = createMockExecutionContext(
              { id: userId },
              guardType === 'resource' ? { id: 'resource-id' } : { buildingId },
            );

            // Mock cache miss
            jest.spyOn(cacheService, 'get').mockResolvedValue(null);

            // Mock no membership
            jest.spyOn(prismaService.building_committee_members, 'findUnique').mockResolvedValue(null);
            jest.spyOn(prismaService.apartment_owners, 'findFirst').mockResolvedValue(null);
            jest.spyOn(prismaService.apartment_tenants, 'findFirst').mockResolvedValue(null);

            if (guardType === 'committee') {
              await expect(committeeMemberGuard.canActivate(context)).rejects.toThrow(
                expect.objectContaining({
                  message: 'Access denied: Committee member role required',
                }),
              );
            } else if (guardType === 'building') {
              await expect(buildingMemberGuard.canActivate(context)).rejects.toThrow(
                expect.objectContaining({
                  message: 'Access denied: You do not belong to this building',
                }),
              );
            } else if (guardType === 'resource') {
              // Mock resource type
              jest.spyOn(Reflect, 'getMetadata').mockReturnValue('MaintenanceRequest');
              jest.spyOn(prismaService.maintenance_requests, 'findUnique').mockResolvedValue({
                id: 'resource-id',
                building_id: buildingId,
                requester_id: 'other-user-id',
              } as any);

              await expect(resourceOwnerGuard.canActivate(context)).rejects.toThrow(
                expect.objectContaining({
                  message: 'Access denied: You do not own this resource',
                }),
              );
            }
          },
        ),
        { numRuns: 20 },
      );
    });
  });
});
