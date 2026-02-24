import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { ExportFinancialReportHandler } from '../../queries/handlers/export-financial-report.handler';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueryBus } from '@nestjs/cqrs';
import { StorageService } from '../../../files/services/storage.service';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { FormattingService } from '../../../common/services/formatting.service';
import { ExportFinancialReportQuery } from '../../queries/impl/export-financial-report.query';
import { ReportType, ExportFormat } from '../../dto/export-report.dto';

// Arbitraries
const uuidArbitrary = () =>
  fc.tuple(
    fc.hexaString({ minLength: 8, maxLength: 8 }),
    fc.hexaString({ minLength: 4, maxLength: 4 }),
    fc.hexaString({ minLength: 4, maxLength: 4 }),
    fc.hexaString({ minLength: 4, maxLength: 4 }),
    fc.hexaString({ minLength: 12, maxLength: 12 }),
  ).map(([a, b, c, d, e]) => `${a}-${b}-${c}-${d}-${e}`);

const reportTypeArbitrary = () =>
  fc.constantFrom(
    ReportType.BALANCE,
    ReportType.TRANSACTIONS,
    ReportType.INCOME,
    ReportType.EXPENSES,
    ReportType.BUDGET,
    ReportType.PAYMENT_STATUS,
    ReportType.YEAR_OVER_YEAR,
  );

const exportFormatArbitrary = () => fc.constantFrom(ExportFormat.CSV, ExportFormat.PDF);

const localeArbitrary = () => fc.constantFrom('en-US', 'he-IL', 'fr-FR');

describe('Export Financial Report - Property-Based Tests', () => {
  let handler: ExportFinancialReportHandler;
  let prismaService: PrismaService;
  let queryBus: QueryBus;
  let storageService: StorageService;
  let auditLogService: AuditLogService;
  let formattingService: FormattingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportFinancialReportHandler,
        {
          provide: PrismaService,
          useValue: {
            buildings: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            upload: jest.fn(),
            getSignedUrl: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: FormattingService,
          useValue: {
            formatCurrency: jest.fn((amount) => `₪${amount.toFixed(2)}`),
            formatDate: jest.fn((date) => date.toISOString().split('T')[0]),
            formatDateTime: jest.fn((date) => date.toISOString()),
          },
        },
      ],
    }).compile();

    handler = module.get<ExportFinancialReportHandler>(ExportFinancialReportHandler);
    prismaService = module.get<PrismaService>(PrismaService);
    queryBus = module.get<QueryBus>(QueryBus);
    storageService = module.get<StorageService>(StorageService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
    formattingService = module.get<FormattingService>(FormattingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 27: Export Metadata Completeness', () => {
    it('should include all required metadata in exports', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          reportTypeArbitrary(),
          exportFormatArbitrary(),
          localeArbitrary(),
          async (buildingId, userId, reportType, format, locale) => {
            // Mock building
            jest.spyOn(prismaService.buildings, 'findUnique').mockResolvedValue({
              id: buildingId,
              name: 'Test Building',
            } as any);

            // Mock report data based on report type
            let mockReportData;
            if (reportType === ReportType.YEAR_OVER_YEAR) {
              mockReportData = {
                currentYear: { income: 1000, expenses: 500 },
                previousYear: { income: 800, expenses: 400 },
                change: { income: 200, expenses: 100 },
                changePercentage: { income: 25, expenses: 25 },
              };
            } else if (reportType === ReportType.BUDGET) {
              mockReportData = {
                income: { budgeted: 1000, actual: 1100, variance: 100, variancePercentage: 10 },
                expenses: { budgeted: 500, actual: 450, variance: -50, variancePercentage: -10 },
              };
            } else {
              mockReportData = { data: 'test' };
            }

            jest.spyOn(queryBus, 'execute').mockResolvedValue(mockReportData);

            // Mock storage
            jest.spyOn(storageService, 'upload').mockResolvedValue({
              storageKey: 'test-key',
            });

            jest.spyOn(storageService, 'getSignedUrl').mockResolvedValue('https://test-url.com');

            const query = new ExportFinancialReportQuery(
              buildingId,
              reportType,
              format,
              userId,
              locale,
            );

            await handler.execute(query);

            // Verify audit log was called with complete metadata
            expect(auditLogService.log).toHaveBeenCalledWith(
              expect.objectContaining({
                userId,
                action: 'EXPORT_FINANCIAL_REPORT',
                resourceType: 'Report',
                resourceId: buildingId,
                metadata: expect.objectContaining({
                  reportType,
                  format,
                }),
              }),
            );
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 30: Export Audit Logging', () => {
    it('should log all export operations in audit log', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          reportTypeArbitrary(),
          exportFormatArbitrary(),
          async (buildingId, userId, reportType, format) => {
            // Clear mocks before each test
            jest.clearAllMocks();

            // Mock building
            jest.spyOn(prismaService.buildings, 'findUnique').mockResolvedValue({
              id: buildingId,
              name: 'Test Building',
            } as any);

            // Mock report data based on report type
            let mockReportData;
            if (reportType === ReportType.YEAR_OVER_YEAR) {
              mockReportData = {
                currentYear: { income: 1000, expenses: 500 },
                previousYear: { income: 800, expenses: 400 },
                change: { income: 200, expenses: 100 },
                changePercentage: { income: 25, expenses: 25 },
              };
            } else if (reportType === ReportType.BUDGET) {
              mockReportData = {
                income: { budgeted: 1000, actual: 1100, variance: 100, variancePercentage: 10 },
                expenses: { budgeted: 500, actual: 450, variance: -50, variancePercentage: -10 },
              };
            } else {
              mockReportData = { data: 'test' };
            }

            jest.spyOn(queryBus, 'execute').mockResolvedValue(mockReportData);

            // Mock storage
            jest.spyOn(storageService, 'upload').mockResolvedValue({
              storageKey: 'test-key',
            });

            jest.spyOn(storageService, 'getSignedUrl').mockResolvedValue('https://test-url.com');

            const query = new ExportFinancialReportQuery(
              buildingId,
              reportType,
              format,
              userId,
              'en-US',
            );

            await handler.execute(query);

            // Verify audit log was called exactly once
            expect(auditLogService.log).toHaveBeenCalledTimes(1);

            // Verify audit log contains correct action
            expect(auditLogService.log).toHaveBeenCalledWith(
              expect.objectContaining({
                action: 'EXPORT_FINANCIAL_REPORT',
                userId,
                resourceId: buildingId,
              }),
            );
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 29: Export URL Expiration', () => {
    it('should generate signed URLs with 24-hour expiration', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          reportTypeArbitrary(),
          exportFormatArbitrary(),
          async (buildingId, userId, reportType, format) => {
            // Mock building
            jest.spyOn(prismaService.buildings, 'findUnique').mockResolvedValue({
              id: buildingId,
              name: 'Test Building',
            } as any);

            // Mock report data based on report type
            let mockReportData;
            if (reportType === ReportType.YEAR_OVER_YEAR) {
              mockReportData = {
                currentYear: { income: 1000, expenses: 500 },
                previousYear: { income: 800, expenses: 400 },
                change: { income: 200, expenses: 100 },
                changePercentage: { income: 25, expenses: 25 },
              };
            } else if (reportType === ReportType.BUDGET) {
              mockReportData = {
                income: { budgeted: 1000, actual: 1100, variance: 100, variancePercentage: 10 },
                expenses: { budgeted: 500, actual: 450, variance: -50, variancePercentage: -10 },
              };
            } else {
              mockReportData = { data: 'test' };
            }

            jest.spyOn(queryBus, 'execute').mockResolvedValue(mockReportData);

            // Mock storage
            const uploadSpy = jest.spyOn(storageService, 'upload').mockResolvedValue({
              storageKey: 'test-key',
            });

            const getSignedUrlSpy = jest
              .spyOn(storageService, 'getSignedUrl')
              .mockResolvedValue('https://test-url.com');

            const query = new ExportFinancialReportQuery(
              buildingId,
              reportType,
              format,
              userId,
              'en-US',
            );

            await handler.execute(query);

            // Verify getSignedUrl was called with 24-hour expiration (86400 seconds)
            expect(getSignedUrlSpy).toHaveBeenCalledWith(expect.any(String), 86400);
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 25: CSV Export Format Validity', () => {
    it('should generate valid CSV format with proper escaping', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          reportTypeArbitrary(),
          async (buildingId, userId, reportType) => {
            // Mock building with special characters to test escaping
            jest.spyOn(prismaService.buildings, 'findUnique').mockResolvedValue({
              id: buildingId,
              name: 'Test "Building" with, commas',
            } as any);

            // Mock report data
            let mockReportData;
            if (reportType === ReportType.BALANCE) {
              mockReportData = {
                totalIncome: 1000,
                totalExpenses: 500,
                balance: 500,
              };
            } else if (reportType === ReportType.TRANSACTIONS) {
              mockReportData = {
                transactions: [
                  {
                    date: new Date('2024-01-01'),
                    apartmentNumber: '101',
                    type: 'Monthly Fee',
                    amount: 100,
                    status: 'paid',
                  },
                ],
              };
            } else if (reportType === ReportType.INCOME) {
              mockReportData = {
                categories: [{ type: 'Monthly Fee', count: 10, total: 1000 }],
                totalCount: 10,
                grandTotal: 1000,
              };
            } else if (reportType === ReportType.EXPENSES) {
              mockReportData = {
                categories: [{ category: 'Maintenance', count: 5, total: 500 }],
                totalCount: 5,
                grandTotal: 500,
              };
            } else if (reportType === ReportType.BUDGET) {
              mockReportData = {
                income: { budgeted: 1000, actual: 1100, variance: 100, variancePercentage: 10, status: 'favorable' },
                expenses: { budgeted: 500, actual: 450, variance: -50, variancePercentage: -10, status: 'favorable' },
              };
            } else if (reportType === ReportType.PAYMENT_STATUS) {
              mockReportData = {
                statuses: [{ status: 'paid', count: 10, total: 1000 }],
                collectionRate: 85.5,
              };
            } else if (reportType === ReportType.YEAR_OVER_YEAR) {
              mockReportData = {
                currentYear: { income: 1000, expenses: 500 },
                previousYear: { income: 800, expenses: 400 },
                change: { income: 200, expenses: 100 },
                changePercentage: { income: 25, expenses: 25 },
                monthlyBreakdown: [],
              };
            }

            jest.spyOn(queryBus, 'execute').mockResolvedValue(mockReportData);

            // Mock storage to capture the uploaded buffer
            let uploadedBuffer: Buffer;
            jest.spyOn(storageService, 'upload').mockImplementation((file: any) => {
              uploadedBuffer = file.buffer;
              return Promise.resolve({ storageKey: 'test-key' });
            });

            jest.spyOn(storageService, 'getSignedUrl').mockResolvedValue('https://test-url.com');

            const query = new ExportFinancialReportQuery(
              buildingId,
              reportType,
              ExportFormat.CSV,
              userId,
              'en-US',
            );

            await handler.execute(query);

            // Verify CSV was generated
            expect(uploadedBuffer!).toBeDefined();
            const csvContent = uploadedBuffer!.toString('utf-8');

            // Verify CSV contains report type header
            expect(csvContent).toContain(reportType.toUpperCase());

            // Verify CSV contains building name (with proper escaping)
            expect(csvContent).toContain('Building');

            // Verify CSV has proper structure (contains newlines)
            expect(csvContent.split('\n').length).toBeGreaterThan(3);

            // Verify quotes are properly escaped (doubled)
            if (csvContent.includes('"Building"')) {
              expect(csvContent).toContain('""Building""');
            }
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 26: PDF Export Validity', () => {
    it('should generate valid PDF format', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          reportTypeArbitrary(),
          async (buildingId, userId, reportType) => {
            // Mock building
            jest.spyOn(prismaService.buildings, 'findUnique').mockResolvedValue({
              id: buildingId,
              name: 'Test Building',
            } as any);

            // Mock report data
            let mockReportData;
            if (reportType === ReportType.YEAR_OVER_YEAR) {
              mockReportData = {
                currentYear: { income: 1000, expenses: 500 },
                previousYear: { income: 800, expenses: 400 },
                change: { income: 200, expenses: 100 },
                changePercentage: { income: 25, expenses: 25 },
              };
            } else if (reportType === ReportType.BUDGET) {
              mockReportData = {
                income: { budgeted: 1000, actual: 1100, variance: 100, variancePercentage: 10 },
                expenses: { budgeted: 500, actual: 450, variance: -50, variancePercentage: -10 },
              };
            } else {
              mockReportData = { data: 'test' };
            }

            jest.spyOn(queryBus, 'execute').mockResolvedValue(mockReportData);

            // Mock storage to capture the uploaded buffer
            let uploadedBuffer: Buffer;
            let uploadedMimetype: string;
            jest.spyOn(storageService, 'upload').mockImplementation((file: any) => {
              uploadedBuffer = file.buffer;
              uploadedMimetype = file.mimetype;
              return Promise.resolve({ storageKey: 'test-key' });
            });

            jest.spyOn(storageService, 'getSignedUrl').mockResolvedValue('https://test-url.com');

            const query = new ExportFinancialReportQuery(
              buildingId,
              reportType,
              ExportFormat.PDF,
              userId,
              'en-US',
            );

            await handler.execute(query);

            // Verify PDF was generated
            expect(uploadedBuffer!).toBeDefined();
            expect(uploadedMimetype!).toBe('application/pdf');

            const pdfContent = uploadedBuffer!.toString('utf-8');

            // Verify PDF contains report type header
            expect(pdfContent).toContain(reportType.toUpperCase());

            // Verify PDF contains building name
            expect(pdfContent).toContain('Test Building');

            // Verify PDF has content
            expect(pdfContent.length).toBeGreaterThan(100);
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Property 28: Locale-Based Date Formatting', () => {
    it('should format dates according to user locale', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          reportTypeArbitrary(),
          localeArbitrary(),
          async (buildingId, userId, reportType, locale) => {
            // Clear all mocks before each property test run
            jest.clearAllMocks();

            // Mock building
            jest.spyOn(prismaService.buildings, 'findUnique').mockResolvedValue({
              id: buildingId,
              name: 'Test Building',
            } as any);

            // Mock report data
            let mockReportData;
            if (reportType === ReportType.YEAR_OVER_YEAR) {
              mockReportData = {
                currentYear: { income: 1000, expenses: 500 },
                previousYear: { income: 800, expenses: 400 },
                change: { income: 200, expenses: 100 },
                changePercentage: { income: 25, expenses: 25 },
              };
            } else if (reportType === ReportType.BUDGET) {
              mockReportData = {
                income: { budgeted: 1000, actual: 1100, variance: 100, variancePercentage: 10 },
                expenses: { budgeted: 500, actual: 450, variance: -50, variancePercentage: -10 },
              };
            } else {
              mockReportData = { data: 'test' };
            }

            jest.spyOn(queryBus, 'execute').mockResolvedValue(mockReportData);

            // Mock storage
            jest.spyOn(storageService, 'upload').mockResolvedValue({
              storageKey: 'test-key',
            });

            jest.spyOn(storageService, 'getSignedUrl').mockResolvedValue('https://test-url.com');

            // Spy on formatting service with fresh mocks
            const formatDateSpy = jest.spyOn(formattingService, 'formatDate').mockImplementation((date, loc) => {
              return date.toISOString().split('T')[0];
            });
            const formatDateTimeSpy = jest.spyOn(formattingService, 'formatDateTime').mockImplementation((date, loc) => {
              return date.toISOString();
            });

            const query = new ExportFinancialReportQuery(
              buildingId,
              reportType,
              ExportFormat.CSV,
              userId,
              locale,
              '2024-01-01',
              '2024-12-31',
            );

            await handler.execute(query);

            // Verify formatting service was called with the correct locale
            if (formatDateSpy.mock.calls.length > 0) {
              formatDateSpy.mock.calls.forEach((call) => {
                expect(call[1]).toBe(locale);
              });
            }

            if (formatDateTimeSpy.mock.calls.length > 0) {
              formatDateTimeSpy.mock.calls.forEach((call) => {
                expect(call[1]).toBe(locale);
              });
            }
          },
        ),
        { numRuns: 20 },
      );
    });
  });
});
