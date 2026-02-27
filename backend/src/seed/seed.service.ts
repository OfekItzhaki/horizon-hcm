import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seedDatabase(): Promise<{ message: string; details: any }> {
    this.logger.log('Starting database seeding...');

    try {
      // Create users
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      const adminUser = await this.prisma.user.upsert({
        where: { email: 'admin@horizon.com' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'admin@horizon.com',
          password_hash: hashedPassword,
          role: 'admin',
          is_verified: true,
        },
      });

      const committeeUser = await this.prisma.user.upsert({
        where: { email: 'committee@horizon.com' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000002',
          email: 'committee@horizon.com',
          password_hash: hashedPassword,
          role: 'committee_member',
          is_verified: true,
        },
      });

      const ownerUser = await this.prisma.user.upsert({
        where: { email: 'owner@horizon.com' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000003',
          email: 'owner@horizon.com',
          password_hash: hashedPassword,
          role: 'owner',
          is_verified: true,
        },
      });

      const tenantUser = await this.prisma.user.upsert({
        where: { email: 'tenant@horizon.com' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000004',
          email: 'tenant@horizon.com',
          password_hash: hashedPassword,
          role: 'tenant',
          is_verified: true,
        },
      });

      // Create user profiles
      const adminProfile = await this.prisma.user_profiles.upsert({
        where: { user_id: adminUser.id },
        update: {},
        create: {
          user_id: adminUser.id,
          first_name: 'Admin',
          last_name: 'User',
          phone: '+1234567890',
          language: 'en',
          theme: 'light',
        },
      });

      const committeeProfile = await this.prisma.user_profiles.upsert({
        where: { user_id: committeeUser.id },
        update: {},
        create: {
          user_id: committeeUser.id,
          first_name: 'Committee',
          last_name: 'Member',
          phone: '+1234567891',
          language: 'en',
          theme: 'light',
        },
      });

      const ownerProfile = await this.prisma.user_profiles.upsert({
        where: { user_id: ownerUser.id },
        update: {},
        create: {
          user_id: ownerUser.id,
          first_name: 'John',
          last_name: 'Owner',
          phone: '+1234567892',
          language: 'en',
          theme: 'light',
        },
      });

      const tenantProfile = await this.prisma.user_profiles.upsert({
        where: { user_id: tenantUser.id },
        update: {},
        create: {
          user_id: tenantUser.id,
          first_name: 'Jane',
          last_name: 'Tenant',
          phone: '+1234567893',
          language: 'en',
          theme: 'light',
        },
      });

      // Create building
      const building = await this.prisma.buildings.upsert({
        where: { id: '00000000-0000-0000-0000-000000000010' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000010',
          name: 'Sunrise Towers',
          address: '123 Main Street',
          city: 'Tel Aviv',
          postal_code: '12345',
          country: 'Israel',
          total_apartments: 20,
        },
      });

      // Create apartments
      const apartment1 = await this.prisma.apartments.upsert({
        where: { id: '00000000-0000-0000-0000-000000000020' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000020',
          building_id: building.id,
          apartment_number: '101',
          floor: 1,
          size_sqm: 85.5,
          bedrooms: 3,
          bathrooms: 2,
        },
      });

      const apartment2 = await this.prisma.apartments.upsert({
        where: { id: '00000000-0000-0000-0000-000000000021' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000021',
          building_id: building.id,
          apartment_number: '102',
          floor: 1,
          size_sqm: 95.0,
          bedrooms: 4,
          bathrooms: 2,
        },
      });

      // Create apartment owners
      await this.prisma.apartment_owners.upsert({
        where: { id: '00000000-0000-0000-0000-000000000030' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000030',
          apartment_id: apartment1.id,
          user_profile_id: ownerProfile.id,
          ownership_percentage: 100,
          is_primary: true,
        },
      });

      // Create apartment tenant
      await this.prisma.apartment_tenants.upsert({
        where: { id: '00000000-0000-0000-0000-000000000040' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000040',
          apartment_id: apartment2.id,
          user_profile_id: tenantProfile.id,
          lease_start: new Date('2024-01-01'),
          lease_end: new Date('2025-12-31'),
          monthly_rent: 5000,
        },
      });

      // Create committee member
      await this.prisma.building_committee_members.upsert({
        where: { id: '00000000-0000-0000-0000-000000000050' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000050',
          building_id: building.id,
          user_profile_id: committeeProfile.id,
          position: 'chairman',
          term_start: new Date('2024-01-01'),
          term_end: new Date('2025-12-31'),
        },
      });

      // Create invoices
      await this.prisma.invoices.upsert({
        where: { id: '00000000-0000-0000-0000-000000000060' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000060',
          building_id: building.id,
          apartment_id: apartment1.id,
          invoice_number: 'INV-2024-001',
          amount: 1500,
          due_date: new Date('2024-12-31'),
          status: 'pending',
          description: 'Monthly maintenance fee',
        },
      });

      // Create announcement
      await this.prisma.announcements.upsert({
        where: { id: '00000000-0000-0000-0000-000000000070' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000070',
          building_id: building.id,
          author_id: committeeProfile.id,
          title: 'Welcome to Horizon HCM',
          content: 'This is a sample announcement to demonstrate the system.',
          priority: 'normal',
        },
      });

      // Create maintenance request
      await this.prisma.maintenance_requests.upsert({
        where: { id: '00000000-0000-0000-0000-000000000080' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000080',
          building_id: building.id,
          apartment_id: apartment1.id,
          requester_id: ownerProfile.id,
          title: 'Leaking faucet',
          description: 'The kitchen faucet is leaking and needs repair.',
          category: 'plumbing',
          priority: 'medium',
          status: 'pending',
        },
      });

      // Create meeting
      await this.prisma.meetings.upsert({
        where: { id: '00000000-0000-0000-0000-000000000090' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000090',
          building_id: building.id,
          organizer_id: committeeProfile.id,
          title: 'Annual General Meeting',
          description: 'Annual meeting to discuss building matters.',
          meeting_date: new Date('2024-12-15T18:00:00Z'),
          location: 'Building Lobby',
          type: 'general',
        },
      });

      // Create poll
      await this.prisma.polls.upsert({
        where: { id: '00000000-0000-0000-0000-000000000100' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000100',
          building_id: building.id,
          creator_id: committeeProfile.id,
          title: 'Should we install solar panels?',
          description: 'Vote on whether to install solar panels on the roof.',
          end_date: new Date('2024-12-31'),
          is_anonymous: false,
        },
      });

      // Create notification templates
      const templates = [
        {
          name: 'new_poll',
          title: 'New Poll',
          body: '{{pollTitle}} - Vote by {{endDate}}',
          language: 'en',
          is_active: true,
        },
        {
          name: 'new_message',
          title: 'New Message',
          body: '{{senderName}}: {{messagePreview}}',
          language: 'en',
          is_active: true,
        },
        {
          name: 'new_invoice',
          title: 'New Invoice',
          body: 'Invoice {{invoiceNumber}} for {{amount}} - Due {{dueDate}}',
          language: 'en',
          is_active: true,
        },
      ];

      for (const template of templates) {
        await this.prisma.notification_templates.upsert({
          where: { name: template.name },
          update: {},
          create: template,
        });
      }

      this.logger.log('Database seeding completed successfully');

      return {
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
            tenant: { email: 'tenant@horizon.com', password: 'Password123!' },
          },
        },
      };
    } catch (error) {
      this.logger.error('Error seeding database:', error);
      throw error;
    }
  }

  async unseedDatabase(): Promise<{ message: string; details: any }> {
    this.logger.log('Starting database unseeding...');

    try {
      // Delete in reverse order of dependencies
      const deletedPollVotes = await this.prisma.poll_votes.deleteMany({});
      const deletedPolls = await this.prisma.polls.deleteMany({});
      const deletedMeetingAttendees = await this.prisma.meeting_attendees.deleteMany({});
      const deletedMeetingAgendaItems = await this.prisma.meeting_agenda_items.deleteMany({});
      const deletedMeetings = await this.prisma.meetings.deleteMany({});
      const deletedMaintenanceComments = await this.prisma.maintenance_comments.deleteMany({});
      const deletedMaintenanceRequests = await this.prisma.maintenance_requests.deleteMany({});
      const deletedAnnouncementReads = await this.prisma.announcement_reads.deleteMany({});
      const deletedAnnouncementComments = await this.prisma.announcement_comments.deleteMany({});
      const deletedAnnouncements = await this.prisma.announcements.deleteMany({});
      const deletedPayments = await this.prisma.payments.deleteMany({});
      const deletedInvoices = await this.prisma.invoices.deleteMany({});
      const deletedMessages = await this.prisma.messages.deleteMany({});
      const deletedDocuments = await this.prisma.documents.deleteMany({});
      const deletedNotifications = await this.prisma.notifications.deleteMany({});
      const deletedNotificationTemplates = await this.prisma.notification_templates.deleteMany({});
      const deletedCommitteeMembers = await this.prisma.building_committee_members.deleteMany({});
      const deletedTenants = await this.prisma.apartment_tenants.deleteMany({});
      const deletedOwners = await this.prisma.apartment_owners.deleteMany({});
      const deletedApartments = await this.prisma.apartments.deleteMany({});
      const deletedBuildings = await this.prisma.buildings.deleteMany({});
      const deletedDevices = await this.prisma.devices.deleteMany({});
      const deletedProfiles = await this.prisma.user_profiles.deleteMany({});
      const deletedUsers = await this.prisma.user.deleteMany({});

      this.logger.log('Database unseeding completed successfully');

      return {
        message: 'Database unseeded successfully',
        details: {
          deletedUsers: deletedUsers.count,
          deletedProfiles: deletedProfiles.count,
          deletedBuildings: deletedBuildings.count,
          deletedApartments: deletedApartments.count,
          deletedOwners: deletedOwners.count,
          deletedTenants: deletedTenants.count,
          deletedCommitteeMembers: deletedCommitteeMembers.count,
          deletedInvoices: deletedInvoices.count,
          deletedPayments: deletedPayments.count,
          deletedAnnouncements: deletedAnnouncements.count,
          deletedMaintenanceRequests: deletedMaintenanceRequests.count,
          deletedMeetings: deletedMeetings.count,
          deletedPolls: deletedPolls.count,
          deletedNotifications: deletedNotifications.count,
          deletedNotificationTemplates: deletedNotificationTemplates.count,
          deletedMessages: deletedMessages.count,
          deletedDocuments: deletedDocuments.count,
        },
      };
    } catch (error) {
      this.logger.error('Error unseeding database:', error);
      throw error;
    }
  }
}
