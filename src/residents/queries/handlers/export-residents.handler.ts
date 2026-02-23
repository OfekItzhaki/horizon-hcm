import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ExportResidentsQuery } from '../impl/export-residents.query';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../../files/services/storage.service';

@Injectable()
@QueryHandler(ExportResidentsQuery)
export class ExportResidentsHandler implements IQueryHandler<ExportResidentsQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorage: StorageService,
  ) {}

  async execute(query: ExportResidentsQuery): Promise<any> {
    const { buildingId } = query;

    // Get all residents for the building
    const [committeeMembers, owners, tenants] = await Promise.all([
      this.prisma.building_committee_members.findMany({
        where: { building_id: buildingId },
        include: { user_profiles: true },
      }),
      this.prisma.apartment_owners.findMany({
        where: {
          apartments: {
            building_id: buildingId,
          },
        },
        include: {
          user_profiles: true,
          apartment: {
            select: {
              apartment_number: true,
            },
          },
        },
      }),
      this.prisma.apartment_tenants.findMany({
        where: {
          is_active: true,
          apartment: {
            building_id: buildingId,
          },
        },
        include: {
          user_profiles: true,
          apartment: {
            select: {
              apartment_number: true,
            },
          },
        },
      }),
    ]);

    // Combine and deduplicate residents
    const residentsMap = new Map();

    committeeMembers.forEach((member) => {
      const userId = member.user_profile.id;
      if (!residentsMap.has(userId)) {
        residentsMap.set(userId, {
          full_name: member.user_profile.full_name,
          phone_number: member.user_profile.phone_number || '',
          user_type: member.user_profile.user_type,
          apartments: [],
          committee_role: member.role || '',
        });
      } else {
        residentsMap.get(userId).committee_role = member.role || '';
      }
    });

    owners.forEach((owner) => {
      const userId = owner.user_profile.id;
      if (!residentsMap.has(userId)) {
        residentsMap.set(userId, {
          full_name: owner.user_profile.full_name,
          phone_number: owner.user_profile.phone_number || '',
          user_type: owner.user_profile.user_type,
          apartments: [],
          committee_role: '',
        });
      }
      residentsMap.get(userId).apartments.push(owner.apartments.apartment_number);
    });

    tenants.forEach((tenant) => {
      const userId = tenant.user_profile.id;
      if (!residentsMap.has(userId)) {
        residentsMap.set(userId, {
          full_name: tenant.user_profile.full_name,
          phone_number: tenant.user_profile.phone_number || '',
          user_type: tenant.user_profile.user_type,
          apartments: [],
          committee_role: '',
        });
      }
      residentsMap.get(userId).apartments.push(tenant.apartments.apartment_number);
    });

    // Convert to array and sort
    const residents = Array.from(residentsMap.values()).sort((a, b) =>
      a.full_name.localeCompare(b.full_name),
    );

    // Generate CSV content
    const csvHeaders = [
      'Full Name',
      'Phone Number',
      'User Type',
      'Apartment Numbers',
      'Committee Role',
    ];
    const csvRows = residents.map((r) => [
      this.escapeCsvField(r.full_name),
      this.escapeCsvField(r.phone_number),
      this.escapeCsvField(r.user_type),
      this.escapeCsvField(r.apartments.join(', ')),
      this.escapeCsvField(r.committee_role),
    ]);

    const csvContent = [csvHeaders.join(','), ...csvRows.map((row) => row.join(','))].join('\n');

    // Upload to file storage with 24-hour expiration
    const fileName = `residents-${buildingId}-${Date.now()}.csv`;
    const buffer = Buffer.from(csvContent, 'utf-8');

    // Create a mock Multer file object for the upload method
    const mockFile: Express.Multer.File = {
      buffer,
      originalname: fileName,
      mimetype: 'text/csv',
      size: buffer.length,
      fieldname: 'file',
      encoding: '7bit',
      stream: null,
      destination: '',
      filename: fileName,
      path: '',
    };

    const uploadResult = await this.fileStorage.upload(mockFile, 'system-export', false);

    // Set expiration to 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return {
      downloadUrl: uploadResult.url,
      fileName: fileName,
      expiresAt: expiresAt,
    };
  }

  private escapeCsvField(field: string): string {
    if (!field) return '';
    // Escape double quotes and wrap in quotes if contains comma, quote, or newline
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
