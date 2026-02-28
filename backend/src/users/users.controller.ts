import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, CurrentUser } from '@ofeklabs/horizon-auth';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserPreferencesDto } from './dto/update-preferences.dto';
import * as bcrypt from 'bcrypt';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: any) {
    // Handle case where user might be from our override auth
    const userId = user?.id || user?.sub;
    
    if (!userId) {
      throw new BadRequestException('User ID not found in token');
    }

    // Get user with profile
    const userWithProfile = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!userWithProfile) {
      return null;
    }

    const profile = userWithProfile.profile;

    // Return user data in the format expected by frontend
    return {
      id: userWithProfile.id,
      email: userWithProfile.email,
      name: profile?.full_name || userWithProfile.fullName || '',
      phone: profile?.phone_number || '',
      avatar: profile?.avatar_url || '',
      role: profile?.user_type?.toLowerCase() || 'tenant',
      buildings: [], // TODO: Fetch user's buildings
      apartments: [], // TODO: Fetch user's apartments
      language: profile?.preferred_language || 'en',
      theme: 'light',
      notificationPreferences: {
        emailNotifications: true,
        pushNotifications: true,
        enabledTypes: [],
      },
      twoFactorEnabled: false, // TODO: Check if user has 2FA enabled
      createdAt: userWithProfile.createdAt,
      updatedAt: userWithProfile.updatedAt,
    };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    // Update user email if provided
    if (dto.email) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { email: dto.email },
      });
    }

    // Update profile if name or phone provided
    if (dto.name || dto.phone) {
      await this.prisma.user_profiles.updateMany({
        where: { user_id: user.id },
        data: {
          ...(dto.name && { full_name: dto.name }),
          ...(dto.phone && { phone_number: dto.phone }),
          updated_at: new Date(),
        },
      });
    }

    // Return updated profile
    return this.getProfile(user);
  }

  @Post('profile/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // TODO: Upload file to storage service and get URL
    const avatarUrl = `/uploads/avatars/${user.id}/${file.filename}`;

    // Update profile with avatar URL
    await this.prisma.user_profiles.updateMany({
      where: { user_id: user.id },
      data: {
        avatar_url: avatarUrl,
        updated_at: new Date(),
      },
    });

    return { avatarUrl };
  }

  @Post('profile/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    // Get current user
    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!currentUser || !currentUser.passwordHash) {
      throw new BadRequestException('User not found or no password set');
    }

    // Verify current password
    const isValid = await bcrypt.compare(dto.currentPassword, currentUser.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Password changed successfully' };
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user preferences' })
  async getPreferences(@CurrentUser() user: any) {
    const profile = await this.prisma.user_profiles.findFirst({
      where: { user_id: user.id },
    });

    return {
      language: profile?.preferred_language || 'en',
      theme: 'light', // TODO: Add theme to user_profiles table
    };
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user preferences' })
  async updatePreferences(@CurrentUser() user: any, @Body() dto: UpdateUserPreferencesDto) {
    await this.prisma.user_profiles.updateMany({
      where: { user_id: user.id },
      data: {
        ...(dto.language && { preferred_language: dto.language }),
        updated_at: new Date(),
      },
    });

    return this.getPreferences(user);
  }

  @Get('buildings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user buildings' })
  async getBuildings(@CurrentUser() user: any) {
    // Get buildings where user is a committee member, owner, or tenant
    const profile = await this.prisma.user_profiles.findFirst({
      where: { user_id: user.id },
      include: {
        building_committee_members: {
          include: {
            buildings: true,
          },
        },
        apartment_owners: {
          include: {
            apartments: {
              include: {
                buildings: true,
              },
            },
          },
        },
        apartment_tenants: {
          where: { is_active: true },
          include: {
            apartments: {
              include: {
                buildings: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      return [];
    }

    // Collect unique buildings
    const buildingsMap = new Map();

    // From committee memberships
    profile.building_committee_members.forEach((member) => {
      buildingsMap.set(member.buildings.id, {
        id: member.buildings.id,
        name: member.buildings.name,
        address: member.buildings.address_line,
        role: 'committee',
      });
    });

    // From apartment ownership
    profile.apartment_owners.forEach((owner) => {
      const building = owner.apartments.buildings;
      if (!buildingsMap.has(building.id)) {
        buildingsMap.set(building.id, {
          id: building.id,
          name: building.name,
          address: building.address_line,
          role: 'owner',
        });
      }
    });

    // From apartment tenancy
    profile.apartment_tenants.forEach((tenant) => {
      const building = tenant.apartments.buildings;
      if (!buildingsMap.has(building.id)) {
        buildingsMap.set(building.id, {
          id: building.id,
          name: building.name,
          address: building.address_line,
          role: 'tenant',
        });
      }
    });

    return Array.from(buildingsMap.values());
  }
}
