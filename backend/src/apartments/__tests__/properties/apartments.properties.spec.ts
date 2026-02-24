import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { CreateApartmentHandler } from '../../commands/handlers/create-apartment.handler';
import { AssignOwnerHandler } from '../../commands/handlers/assign-owner.handler';
import { AssignTenantHandler } from '../../commands/handlers/assign-tenant.handler';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { CreateApartmentCommand } from '../../commands/impl/create-apartment.command';
import { AssignOwnerCommand } from '../../commands/impl/assign-owner.command';
import { AssignTenantCommand } from '../../commands/impl/assign-tenant.command';

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

const apartmentNumberArbitrary = () =>
  fc.oneof(
    fc.integer({ min: 1, max: 999 }).map(n => n.toString()),
    fc.tuple(
      fc.integer({ min: 1, max: 50 }),
      fc.integer({ min: 1, max: 20 }),
    ).map(([floor, apt]) => `${floor}${apt}`),
  );

const ownershipShareArbitrary = () =>
  fc.double({ min: 0.01, max: 100, noNaN: true });

describe('Apartments Module - Property-Based Tests', () => {
  let createApartmentHandler: CreateApartmentHandler;
  let assignOwnerHandler: AssignOwnerHandler;
  let assignTenantHandler: AssignTenantHandler;
  let prismaService: PrismaService;
  let auditLogService: AuditLogService;
  let eventBus: EventBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateApartmentHandler,
        AssignOwnerHandler,
        AssignTenantHandler,
        {
          provide: PrismaService,
          useValue: {
            buildings: {
              findUnique: jest.fn(),
            },
            apartments: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            apartment_owners: {
              findMany: jest.fn(),
              create: jest.fn(),
              aggregate: jest.fn(),
              updateMany: jest.fn(),
            },
            apartment_tenants: {
              findFirst: jest.fn(),
              create: jest.fn(),
              updateMany: jest.fn(),
            },
            user_profiles: {
              findUnique: jest.fn(),
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
          provide: EventBus,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    createApartmentHandler = module.get<CreateApartmentHandler>(
      CreateApartmentHandler,
    );
    assignOwnerHandler = module.get<AssignOwnerHandler>(AssignOwnerHandler);
    assignTenantHandler = module.get<AssignTenantHandler>(AssignTenantHandler);
    prismaService = module.get<PrismaService>(PrismaService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
    eventBus = module.get<EventBus>(EventBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Feature: core-hcm-features, Property 1: Apartment Number Uniqueness
  describe('Property 1: Apartment Number Uniqueness', () => {
    it('should reject duplicate apartment numbers within the same building', async () => {
      await fc.assert(
        fc.asyncProperty(
          buildingArbitrary(),
          apartmentNumberArbitrary(),
          fc.double({ min: 50, max: 200 }),
          fc.integer({ min: 1, max: 5 }),
          async (building, apartmentNumber, size, bedrooms) => {
            // Setup: Building exists
            jest
              .spyOn(prismaService.buildings, 'findUnique')
              .mockResolvedValue(building as any);

            // First creation: Apartment does NOT exist
            jest
              .spyOn(prismaService.apartments, 'findUnique')
              .mockResolvedValueOnce(null);

            const createdApartment = {
              id: fc.sample(uuidArbitrary(), 1)[0],
              building_id: building.id,
              apartment_number: apartmentNumber,
              size_sqm: size,
              bedrooms: bedrooms,
              is_vacant: true,
              created_at: new Date(),
              updated_at: new Date(),
            };

            jest
              .spyOn(prismaService.apartments, 'create')
              .mockResolvedValue(createdApartment as any);

            // Execute: First creation should succeed
            const command1 = new CreateApartmentCommand(
              building.id,
              apartmentNumber,
              size,
              bedrooms,
            );
            const result1 = await createApartmentHandler.execute(command1);

            // Verify: First creation succeeded
            expect(result1).toBeDefined();
            expect(result1.apartment_number).toBe(apartmentNumber);
            expect(result1.building_id).toBe(building.id);

            // Second creation: Apartment DOES exist
            jest
              .spyOn(prismaService.apartments, 'findUnique')
              .mockResolvedValueOnce(createdApartment as any);

            // Execute: Second creation should throw ConflictException
            const command2 = new CreateApartmentCommand(
              building.id,
              apartmentNumber,
              size + 10, // Different size
              bedrooms,
            );

            await expect(
              createApartmentHandler.execute(command2),
            ).rejects.toThrow(BadRequestException);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // Feature: core-hcm-features, Property 2: Ownership Share Invariant
  describe('Property 2: Ownership Share Invariant', () => {
    it('should ensure total ownership shares never exceed 100%', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          fc.array(ownershipShareArbitrary(), { minLength: 1, maxLength: 3 }),
          ownershipShareArbitrary(),
          async (apartmentId, userId, existingShares, newShare) => {
            const totalExisting = existingShares.reduce((sum, share) => sum + share, 0);
            
            // Setup: Existing owners
            const existingOwners = existingShares.map((share, idx) => ({
              id: `owner-${idx}`,
              apartment_id: apartmentId,
              user_id: `user-${idx}`,
              ownership_share: {
                toNumber: () => share,
              },
              is_primary: idx === 0,
            }));

            // Setup: Apartment exists
            const apartment = {
              id: apartmentId,
              building_id: fc.sample(uuidArbitrary(), 1)[0],
              apartment_number: '101',
              size_sqm: 100,
              bedrooms: 3,
              is_vacant: false,
              apartment_owners: existingOwners,
            };

            jest
              .spyOn(prismaService.apartments, 'findUnique')
              .mockResolvedValue(apartment as any);

            // Setup: User exists
            jest
              .spyOn(prismaService.user_profiles, 'findUnique')
              .mockResolvedValue({
                id: userId,
                user_id: userId,
                full_name: 'Test User',
              } as any);

            jest
              .spyOn(prismaService.apartment_owners, 'findMany')
              .mockResolvedValue(existingOwners as any);

            jest
              .spyOn(prismaService.apartment_owners, 'aggregate')
              .mockResolvedValue({
                _sum: { ownership_share: totalExisting },
              } as any);

            // Execute: Try to assign new owner
            const command = new AssignOwnerCommand(
              apartmentId,
              userId,
              newShare,
              false,
            );

            if (totalExisting + newShare > 100) {
              // Should reject if total would exceed 100%
              await expect(assignOwnerHandler.execute(command)).rejects.toThrow();
            } else {
              // Should succeed if total is <= 100%
              jest
                .spyOn(prismaService.apartment_owners, 'create')
                .mockResolvedValue({
                  id: 'new-owner',
                  apartment_id: apartmentId,
                  user_id: userId,
                  ownership_share: newShare,
                  is_primary: false,
                } as any);

              jest
                .spyOn(prismaService.apartment_owners, 'updateMany')
                .mockResolvedValue({ count: 0 } as any);

              jest
                .spyOn(prismaService.apartments, 'update')
                .mockResolvedValue({
                  ...apartment,
                  is_vacant: false,
                } as any);

              const result = await assignOwnerHandler.execute(command);
              expect(result).toBeDefined();
              expect(result.ownership_share).toBe(newShare);
              
              // Verify total doesn't exceed 100%
              const newTotal = totalExisting + newShare;
              expect(newTotal).toBeLessThanOrEqual(100);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // Feature: core-hcm-features, Property 3: Vacancy Status Consistency
  describe('Property 3: Vacancy Status Consistency', () => {
    it('should maintain vacancy status consistency with tenant assignments', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
          async (apartmentId, userId, moveInDate) => {
            // Setup: Apartment exists and is vacant
            const apartment = {
              id: apartmentId,
              building_id: fc.sample(uuidArbitrary(), 1)[0],
              apartment_number: '101',
              size_sqm: 100,
              bedrooms: 3,
              is_vacant: true, // Initially vacant
            };

            jest
              .spyOn(prismaService.apartments, 'findUnique')
              .mockResolvedValue(apartment as any);

            // Setup: User exists
            jest
              .spyOn(prismaService.user_profiles, 'findUnique')
              .mockResolvedValue({
                id: userId,
                user_id: userId,
                full_name: 'Test Tenant',
              } as any);

            // Setup: No active tenants
            jest
              .spyOn(prismaService.apartment_tenants, 'findFirst')
              .mockResolvedValue(null);

            // Mock tenant creation
            const createdTenant = {
              id: 'tenant-1',
              apartment_id: apartmentId,
              user_id: userId,
              move_in_date: moveInDate,
              move_out_date: null,
              is_active: true,
            };

            jest
              .spyOn(prismaService.apartment_tenants, 'create')
              .mockResolvedValue(createdTenant as any);

            // Mock apartment update to set is_vacant = false
            const updatedApartment = {
              ...apartment,
              is_vacant: false,
            };

            jest
              .spyOn(prismaService.apartments, 'update')
              .mockResolvedValue(updatedApartment as any);

            // Execute: Assign tenant
            const command = new AssignTenantCommand(
              apartmentId,
              userId,
              moveInDate,
            );

            const result = await assignTenantHandler.execute(command);

            // Verify: Tenant was assigned
            expect(result).toBeDefined();
            expect(result.user_id).toBe(userId);
            expect(result.is_active).toBe(true);

            // Verify: Apartment vacancy status was updated
            expect(prismaService.apartments.update).toHaveBeenCalledWith(
              expect.objectContaining({
                where: { id: apartmentId },
                data: expect.objectContaining({
                  is_vacant: false,
                }),
              }),
            );

            // Property: If apartment has active tenant, it should not be vacant
            if (result.is_active) {
              const updateCall = (prismaService.apartments.update as jest.Mock).mock.calls[0];
              expect(updateCall[0].data.is_vacant).toBe(false);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
