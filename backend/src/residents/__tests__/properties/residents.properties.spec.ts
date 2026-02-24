import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AddCommitteeMemberHandler } from '../../commands/handlers/add-committee-member.handler';
import { RemoveCommitteeMemberHandler } from '../../commands/handlers/remove-committee-member.handler';
import { ListResidentsHandler } from '../../queries/handlers/list-residents.handler';
import { GetResidentProfileHandler } from '../../queries/handlers/get-resident-profile.handler';
import { SearchResidentsHandler } from '../../queries/handlers/search-residents.handler';
import { ExportResidentsHandler } from '../../queries/handlers/export-residents.handler';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { CacheService } from '../../../common/services/cache.service';
import { AddCommitteeMemberCommand } from '../../commands/impl/add-committee-member.command';
import { RemoveCommitteeMemberCommand } from '../../commands/impl/remove-committee-member.command';
import { ListResidentsQuery } from '../../queries/impl/list-residents.query';
import { GetResidentProfileQuery } from '../../queries/impl/get-resident-profile.query';
import { SearchResidentsQuery } from '../../queries/impl/search-residents.query';
import { ExportResidentsQuery } from '../../queries/impl/export-residents.query';

// Arbitraries for generating test data
const uuidArbitrary = () =>
  fc.tuple(
    fc.hexaString({ minLength: 8, maxLength: 8 }),
    fc.hexaString({ minLength: 4, maxLength: 4 }),
    fc.hexaString({ minLength: 4, maxLength: 4 }),
    fc.hexaString({ minLength: 4, maxLength: 4 }),
    fc.hexaString({ minLength: 12, maxLength: 12 }),
  ).map(([a, b, c, d, e]) => `${a}-${b}-${c}-${d}-${e}`);

const buildingArbitrary = () =>
  fc.record({
    id: uuidArbitrary(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    address_line: fc.string({ minLength: 1, maxLength: 200 }),
  });

const userArbitrary = () =>
  fc.record({
    id: uuidArbitrary(),
    user_id: uuidArbitrary(),
    full_name: fc.string({ minLength: 1, maxLength: 100 }),
    phone_number: fc.option(fc.string({ minLength: 9, maxLength: 15 })),
    user_type: fc.constantFrom('COMMITTEE', 'OWNER', 'TENANT', 'ADMIN'),
    preferred_language: fc.constantFrom('en', 'he'),
  });

const roleArbitrary = () =>
  fc.oneof(
    fc.constant('Chairman'),
    fc.constant('Treasurer'),
    fc.constant('Secretary'),
    fc.constant('Member'),
    fc.string({ minLength: 1, maxLength: 50 }),
  );

describe('Residents Module - Property-Based Tests', () => {
  let addCommitteeMemberHandler: AddCommitteeMemberHandler;
  let removeCommitteeMemberHandler: RemoveCommitteeMemberHandler;
  let prismaService: PrismaService;
  let auditLogService: AuditLogService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddCommitteeMemberHandler,
        RemoveCommitteeMemberHandler,
        {
          provide: PrismaService,
          useValue: {
            buildings: {
              findUnique: jest.fn(),
            },
            user_profiles: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            building_committee_members: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            apartment_owners: {
              findMany: jest.fn(),
            },
            apartment_tenants: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    addCommitteeMemberHandler = module.get<AddCommitteeMemberHandler>(
      AddCommitteeMemberHandler,
    );
    removeCommitteeMemberHandler = module.get<RemoveCommitteeMemberHandler>(
      RemoveCommitteeMemberHandler,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Feature: remaining-hcm-features, Property 3: Committee Membership Uniqueness
  describe('Property 3: Committee Membership Uniqueness', () => {
    it('should reject duplicate committee membership for the same user and building', async () => {
      await fc.assert(
        fc.asyncProperty(
          buildingArbitrary(),
          userArbitrary(),
          roleArbitrary(),
          uuidArbitrary(),
          async (building, user, role, currentUserId) => {
            // Setup: Building and user exist
            jest
              .spyOn(prismaService.buildings, 'findUnique')
              .mockResolvedValue(building as any);
            jest
              .spyOn(prismaService.user_profiles, 'findUnique')
              .mockResolvedValue(user as any);

            // First addition: User is NOT already a committee member
            jest
              .spyOn(prismaService.building_committee_members, 'findUnique')
              .mockResolvedValueOnce(null);

            const createdMember = {
              id: fc.sample(uuidArbitrary(), 1)[0],
              building_id: building.id,
              user_id: user.id,
              role: role,
              created_at: new Date(),
              user_profile: {
                id: user.id,
                full_name: user.full_name,
                phone_number: user.phone_number,
                user_type: user.user_type,
              },
            };

            jest
              .spyOn(prismaService.building_committee_members, 'create')
              .mockResolvedValue(createdMember as any);

            // Execute: First addition should succeed
            const command1 = new AddCommitteeMemberCommand(
              building.id,
              user.id,
              role,
              currentUserId,
            );
            const result1 = await addCommitteeMemberHandler.execute(command1);

            // Verify: First addition succeeded
            expect(result1).toBeDefined();
            expect(result1.user_id).toBe(user.id);
            expect(result1.building_id).toBe(building.id);

            // Second addition: User IS already a committee member
            jest
              .spyOn(prismaService.building_committee_members, 'findUnique')
              .mockResolvedValueOnce(createdMember as any);

            // Execute: Second addition should throw ConflictException
            const command2 = new AddCommitteeMemberCommand(
              building.id,
              user.id,
              role,
              currentUserId,
            );

            await expect(
              addCommitteeMemberHandler.execute(command2),
            ).rejects.toThrow(ConflictException);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // Feature: remaining-hcm-features, Property 4: Committee Member Removal Audit
  describe('Property 4: Committee Member Removal Audit', () => {
    it('should create audit log entry for every committee member removal', async () => {
      await fc.assert(
        fc.asyncProperty(
          buildingArbitrary(),
          userArbitrary(),
          roleArbitrary(),
          uuidArbitrary(),
          uuidArbitrary(),
          async (building, user, role, memberId, currentUserId) => {
            // Setup: Committee member exists
            const committeeMember = {
              id: memberId,
              building_id: building.id,
              user_id: user.id,
              role: role,
              created_at: new Date(),
              user_profile: {
                id: user.id,
                full_name: user.full_name,
              },
            };

            jest
              .spyOn(prismaService.building_committee_members, 'findUnique')
              .mockResolvedValue(committeeMember as any);
            jest
              .spyOn(prismaService.building_committee_members, 'delete')
              .mockResolvedValue(committeeMember as any);

            const auditLogSpy = jest.spyOn(auditLogService, 'log');

            // Execute: Remove committee member
            const command = new RemoveCommitteeMemberCommand(
              building.id,
              memberId,
              currentUserId,
            );
            await removeCommitteeMemberHandler.execute(command);

            // Verify: Audit log was called with correct parameters
            expect(auditLogSpy).toHaveBeenCalledTimes(1);
            expect(auditLogSpy).toHaveBeenCalledWith(
              expect.objectContaining({
                userId: currentUserId,
                action: 'committee_member.removed',
                resourceType: 'BuildingCommitteeMember',
                resourceId: memberId,
                metadata: expect.objectContaining({
                  buildingId: building.id,
                  userId: user.id,
                  role: role,
                  removedUserName: user.full_name,
                }),
              }),
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // Feature: remaining-hcm-features, Property 1: Resident Search Accuracy
  describe('Property 1: Resident Search Accuracy', () => {
    it('should return only residents matching search criteria (case-insensitive)', async () => {
      await fc.assert(
        fc.asyncProperty(
          buildingArbitrary(),
          fc.array(userArbitrary(), { minLength: 5, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          async (building, users, searchTerm) => {
            // Setup: Create residents with known names
            const searchLower = searchTerm.toLowerCase();
            const matchingUsers = users.filter((u) =>
              u.full_name.toLowerCase().includes(searchLower),
            );

            // Mock Prisma to return matching users
            jest
              .spyOn(prismaService.user_profiles, 'findMany')
              .mockResolvedValue(matchingUsers as any);

            // Execute: Search by name
            const searchQuery = new SearchResidentsQuery(
              building.id,
              searchTerm,
              'name',
            );
            const searchHandler = new SearchResidentsHandler(prismaService);
            const result = await searchHandler.execute(searchQuery);

            // Verify: All returned residents match search criteria
            result.data.forEach((resident: any) => {
              expect(
                resident.full_name.toLowerCase().includes(searchLower),
              ).toBe(true);
            });

            // Verify: Count matches expected
            expect(result.total).toBe(matchingUsers.length);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // Feature: remaining-hcm-features, Property 2: Resident Profile Completeness
  describe('Property 2: Resident Profile Completeness', () => {
    it('should include all roles and apartments in resident profile', async () => {
      await fc.assert(
        fc.asyncProperty(
          userArbitrary(),
          fc.array(buildingArbitrary(), { minLength: 1, maxLength: 3 }),
          fc.array(
            fc.record({
              apartment_number: fc.string({ minLength: 1, maxLength: 10 }),
              ownership_share: fc.option(fc.double({ min: 0, max: 100 })),
            }),
            { minLength: 0, maxLength: 5 },
          ),
          async (user, buildings, apartments) => {
            // Setup: User with committee memberships and apartments
            const userProfile = {
              ...user,
              committee_memberships: buildings.map((b) => ({
                building_id: b.id,
                role: 'Chairman',
                created_at: new Date(),
                building: {
                  id: b.id,
                  name: b.name,
                  address_line: b.address_line,
                },
              })),
              owned_apartments: apartments.map((apt, idx) => ({
                apartment: {
                  id: `apt-${idx}`,
                  apartment_number: apt.apartment_number,
                  building_id: buildings[0]?.id || 'building-1',
                  building: {
                    name: buildings[0]?.name || 'Building 1',
                    address_line: buildings[0]?.address_line || 'Address 1',
                  },
                },
                ownership_share: apt.ownership_share,
                is_primary: idx === 0,
                created_at: new Date(),
              })),
              tenant_apartments: [],
            };

            jest
              .spyOn(prismaService.user_profiles, 'findUnique')
              .mockResolvedValue(userProfile as any);

            // Execute: Get resident profile
            const profileQuery = new GetResidentProfileQuery(user.id);
            const profileHandler = new GetResidentProfileHandler(
              prismaService,
            );
            const result = await profileHandler.execute(profileQuery);

            // Verify: Profile includes all data
            expect(result.id).toBe(user.id);
            expect(result.full_name).toBe(user.full_name);
            expect(result.phone_number).toBe(user.phone_number);
            expect(result.user_type).toBe(user.user_type);

            // Verify: All committee roles included
            expect(result.committee_roles.length).toBe(buildings.length);
            result.committee_roles.forEach((role: any) => {
              expect(role.building_id).toBeDefined();
              expect(role.role).toBeDefined();
            });

            // Verify: All apartments included
            expect(result.owned_apartments.length).toBe(apartments.length);
            result.owned_apartments.forEach((apt: any) => {
              expect(apt.apartment_number).toBeDefined();
              expect(apt.building_id).toBeDefined();
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // Feature: remaining-hcm-features, Property 5: CSV Export Round Trip
  describe('Property 5: CSV Export Round Trip', () => {
    it('should preserve all data fields in CSV export', async () => {
      await fc.assert(
        fc.asyncProperty(
          buildingArbitrary(),
          fc.array(userArbitrary(), { minLength: 1, maxLength: 10 }),
          async (building, users) => {
            // Setup: Residents with known data
            const committeeMembers = users.slice(0, 2).map((u) => ({
              building_id: building.id,
              user_id: u.id,
              role: 'Chairman',
              user_profile: u,
            }));

            jest
              .spyOn(prismaService.building_committee_members, 'findMany')
              .mockResolvedValue(committeeMembers as any);
            jest
              .spyOn(prismaService.apartment_owners, 'findMany')
              .mockResolvedValue([]);
            jest
              .spyOn(prismaService.apartment_tenants, 'findMany')
              .mockResolvedValue([]);

            const mockFileStorage = {
              uploadFile: jest.fn().mockResolvedValue({
                url: 'https://example.com/file.csv',
                key: 'file-key',
              }),
            };

            // Execute: Export residents
            const exportQuery = new ExportResidentsQuery(building.id);
            const exportHandler = new ExportResidentsHandler(
              prismaService,
              mockFileStorage as any,
            );
            const result = await exportHandler.execute(exportQuery);

            // Verify: Export was created
            expect(result.downloadUrl).toBeDefined();
            expect(result.fileName).toContain('.csv');
            expect(result.expiresAt).toBeInstanceOf(Date);

            // Verify: File was uploaded
            expect(mockFileStorage.uploadFile).toHaveBeenCalledTimes(1);
            const uploadCall = mockFileStorage.uploadFile.mock.calls[0][0];
            expect(uploadCall.mimeType).toBe('text/csv');

            // Verify: CSV content includes headers
            const csvContent = uploadCall.buffer.toString('utf-8');
            expect(csvContent).toContain('Full Name');
            expect(csvContent).toContain('Phone Number');
            expect(csvContent).toContain('User Type');
            expect(csvContent).toContain('Committee Role');

            // Verify: CSV includes user data
            users.slice(0, 2).forEach((user) => {
              expect(csvContent).toContain(user.full_name);
            });
          },
        ),
        { numRuns: 50 }, // Fewer runs for file operations
      );
    });
  });

  // Feature: remaining-hcm-features, Property 6: Pagination Limit Enforcement
  describe('Property 6: Pagination Limit Enforcement', () => {
    it('should cap page size at 100 items', async () => {
      await fc.assert(
        fc.asyncProperty(
          buildingArbitrary(),
          fc.integer({ min: 101, max: 1000 }), // Request more than 100
          async (building, requestedLimit) => {
            // Setup: Mock large dataset
            const largeDataset = Array.from({ length: 200 }, (_, i) => ({
              id: `user-${i}`,
              user_id: `user-${i}`,
              full_name: `User ${i}`,
              phone_number: `050-${i}`,
              user_type: 'OWNER',
              preferred_language: 'en',
            }));

            jest
              .spyOn(prismaService.building_committee_members, 'findMany')
              .mockResolvedValue([]);
            jest
              .spyOn(prismaService.apartment_owners, 'findMany')
              .mockResolvedValue(
                largeDataset.map((u) => ({
                  user_profile: u,
                  apartment: { apartment_number: '101' },
                })) as any,
              );
            jest
              .spyOn(prismaService.apartment_tenants, 'findMany')
              .mockResolvedValue([]);

            // Execute: Request with limit > 100
            const listQuery = new ListResidentsQuery(
              building.id,
              1,
              requestedLimit,
            );
            const listHandler = new ListResidentsHandler(prismaService);
            const result = await listHandler.execute(listQuery);

            // Verify: Returned limit is capped at 100
            expect(result.pagination.limit).toBeLessThanOrEqual(100);
            expect(result.data.length).toBeLessThanOrEqual(100);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // Feature: remaining-hcm-features, Property 7: Alphabetical Sorting
  describe('Property 7: Alphabetical Sorting', () => {
    it('should sort residents alphabetically by full name', async () => {
      await fc.assert(
        fc.asyncProperty(
          buildingArbitrary(),
          fc
            .array(userArbitrary(), { minLength: 3, maxLength: 20 })
            .map((users) =>
              users.map((u, i) => ({
                ...u,
                full_name: `User ${String.fromCharCode(65 + (i % 26))}${i}`,
              })),
            ),
          async (building, users) => {
            // Setup: Residents with various names
            jest
              .spyOn(prismaService.building_committee_members, 'findMany')
              .mockResolvedValue([]);
            jest
              .spyOn(prismaService.apartment_owners, 'findMany')
              .mockResolvedValue(
                users.map((u) => ({
                  user_profile: u,
                  apartment: { apartment_number: '101' },
                })) as any,
              );
            jest
              .spyOn(prismaService.apartment_tenants, 'findMany')
              .mockResolvedValue([]);

            // Execute: List residents
            const listQuery = new ListResidentsQuery(building.id, 1, 100);
            const listHandler = new ListResidentsHandler(prismaService);
            const result = await listHandler.execute(listQuery);

            // Verify: Results are sorted alphabetically
            for (let i = 1; i < result.data.length; i++) {
              const prev = result.data[i - 1].full_name;
              const curr = result.data[i].full_name;
              expect(prev.localeCompare(curr)).toBeLessThanOrEqual(0);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});

