import { Controller, Post, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SeedService } from './seed.service';

@ApiTags('Seed')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Seed database with sample data',
    description: 'Populates the database with sample users, buildings, apartments, and other test data. Safe to run multiple times (uses upsert).'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Database seeded successfully',
    schema: {
      example: {
        message: 'Database seeded successfully',
        details: {
          users: 4,
          profiles: 4,
          buildings: 1,
          apartments: 2,
          invoices: 1,
          announcements: 1,
          maintenanceRequests: 1,
          meetings: 1,
          polls: 1,
          notificationTemplates: 3,
          credentials: {
            admin: { email: 'admin@horizon.com', password: 'Password123!' },
            committee: { email: 'committee@horizon.com', password: 'Password123!' },
            owner: { email: 'owner@horizon.com', password: 'Password123!' },
            tenant: { email: 'tenant@horizon.com', password: 'Password123!' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async seed() {
    return this.seedService.seedDatabase();
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Remove all seeded data',
    description: 'Deletes ALL data from the database. Use with caution! This will remove all users, buildings, apartments, and related data.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Database unseeded successfully',
    schema: {
      example: {
        message: 'Database unseeded successfully',
        details: {
          deletedUsers: 4,
          deletedProfiles: 4,
          deletedBuildings: 1,
          deletedApartments: 2,
          deletedInvoices: 1,
          deletedAnnouncements: 1,
          deletedMaintenanceRequests: 1,
          deletedMeetings: 1,
          deletedPolls: 1
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async unseed() {
    return this.seedService.unseedDatabase();
  }
}
