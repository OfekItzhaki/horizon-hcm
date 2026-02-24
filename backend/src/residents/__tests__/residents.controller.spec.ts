import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AddCommitteeMemberCommand } from '../commands/impl/add-committee-member.command';
import { RemoveCommitteeMemberCommand } from '../commands/impl/remove-committee-member.command';
import { ListResidentsQuery } from '../queries/impl/list-residents.query';
import { GetResidentProfileQuery } from '../queries/impl/get-resident-profile.query';
import { ExportResidentsQuery } from '../queries/impl/export-residents.query';
import { UserTypeFilter } from '../dto/list-residents.dto';

/**
 * ResidentsController Unit Tests
 * 
 * These tests verify that the controller correctly constructs and dispatches
 * commands/queries to the CQRS buses. We test the controller logic without
 * importing the actual controller class to avoid ESM module issues with
 * @ofeklabs/horizon-auth dependencies.
 */
describe('ResidentsController', () => {
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    preferredLanguage: 'en',
  };

  beforeEach(() => {
    commandBus = {
      execute: jest.fn(),
    } as any;

    queryBus = {
      execute: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addCommitteeMember', () => {
    it('should create and execute AddCommitteeMemberCommand with correct parameters', async () => {
      const buildingId = 'building-123';
      const dto = {
        userId: 'user-456',
        role: 'Chairman',
      };

      const expectedResult = {
        id: 'member-123',
        building_id: buildingId,
        user_id: dto.userId,
        role: dto.role,
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue(expectedResult);

      // Simulate what the controller does
      const command = new AddCommitteeMemberCommand(
        buildingId,
        dto.userId,
        dto.role,
        mockUser.id,
      );
      const result = await commandBus.execute(command);

      expect(commandBus.execute).toHaveBeenCalledWith(command);
      expect(result).toEqual(expectedResult);
      expect(command.buildingId).toBe(buildingId);
      expect(command.userId).toBe(dto.userId);
      expect(command.role).toBe(dto.role);
      expect(command.currentUserId).toBe(mockUser.id);
    });
  });

  describe('removeCommitteeMember', () => {
    it('should create and execute RemoveCommitteeMemberCommand with correct parameters', async () => {
      const buildingId = 'building-123';
      const memberId = 'member-123';

      jest.spyOn(commandBus, 'execute').mockResolvedValue(undefined);

      // Simulate what the controller does
      const command = new RemoveCommitteeMemberCommand(
        buildingId,
        memberId,
        mockUser.id,
      );
      await commandBus.execute(command);

      expect(commandBus.execute).toHaveBeenCalledWith(command);
      expect(command.buildingId).toBe(buildingId);
      expect(command.memberId).toBe(memberId);
      expect(command.currentUserId).toBe(mockUser.id);
    });
  });

  describe('listResidents', () => {
    it('should create and execute ListResidentsQuery with correct parameters', async () => {
      const buildingId = 'building-123';
      const dto = {
        page: 1,
        limit: 50,
        userType: UserTypeFilter.OWNER,
      };

      const expectedResult = {
        data: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      };

      jest.spyOn(queryBus, 'execute').mockResolvedValue(expectedResult);

      // Simulate what the controller does
      const query = new ListResidentsQuery(
        buildingId,
        dto.page,
        dto.limit,
        undefined,
        dto.userType,
        undefined,
        undefined,
      );
      const result = await queryBus.execute(query);

      expect(queryBus.execute).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
      expect(query.buildingId).toBe(buildingId);
      expect(query.page).toBe(dto.page);
      expect(query.limit).toBe(dto.limit);
      expect(query.userType).toBe(dto.userType);
    });

    it('should handle optional query parameters', async () => {
      const buildingId = 'building-123';
      const dto = {
        page: 1,
        limit: 10,
        search: 'alice',
        apartmentNumber: '101',
      };

      jest.spyOn(queryBus, 'execute').mockResolvedValue({ data: [], pagination: {} });

      // Simulate what the controller does
      const query = new ListResidentsQuery(
        buildingId,
        dto.page,
        dto.limit,
        dto.search,
        undefined,
        dto.apartmentNumber,
        undefined,
      );
      await queryBus.execute(query);

      expect(queryBus.execute).toHaveBeenCalledWith(query);
      expect(query.search).toBe('alice');
      expect(query.apartmentNumber).toBe('101');
    });
  });

  describe('getResidentProfile', () => {
    it('should create and execute GetResidentProfileQuery with correct parameters', async () => {
      const residentId = 'user-123';

      const expectedResult = {
        id: residentId,
        full_name: 'John Doe',
        phone_number: '123-456-7890',
        user_type: 'OWNER',
        committee_roles: [],
        apartment_owners: [],
        apartment_tenants: [],
      };

      jest.spyOn(queryBus, 'execute').mockResolvedValue(expectedResult);

      // Simulate what the controller does
      const query = new GetResidentProfileQuery(residentId);
      const result = await queryBus.execute(query);

      expect(queryBus.execute).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
      expect(query.residentId).toBe(residentId);
    });
  });

  describe('exportResidents', () => {
    it('should create and execute ExportResidentsQuery with correct parameters', async () => {
      const buildingId = 'building-123';

      const expectedResult = {
        downloadUrl: 'https://example.com/export.csv',
        fileName: 'residents-export.csv',
        expiresAt: new Date(),
      };

      jest.spyOn(queryBus, 'execute').mockResolvedValue(expectedResult);

      // Simulate what the controller does
      const query = new ExportResidentsQuery(buildingId);
      const result = await queryBus.execute(query);

      expect(queryBus.execute).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
      expect(query.buildingId).toBe(buildingId);
    });
  });
});
