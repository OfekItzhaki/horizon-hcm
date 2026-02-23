import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@ofeklabs/horizon-auth';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: any) {
    // Get user with profile
    const userWithProfile = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        user_profiles: true,
      },
    });

    if (!userWithProfile) {
      return null;
    }

    const profile = userWithProfile.user_profiles[0];

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
      twoFactorEnabled: userWithProfile.twoFactorEnabled || false,
      createdAt: userWithProfile.createdAt,
      updatedAt: userWithProfile.updatedAt,
    };
  }
}
