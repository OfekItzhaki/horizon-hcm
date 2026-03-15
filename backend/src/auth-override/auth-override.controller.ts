import { Controller, Post, Body, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '@ofeklabs/horizon-auth';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@ApiTags('auth-override')
@Controller('auth-override')
export class AuthOverrideController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login (temporary override)' })
  async login(@Body() body: { email: string; password: string }) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(body.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_PRIVATE_KEY, {
      algorithm: 'RS256',
      expiresIn: '24h',
    });

    // Generate refresh token (simplified - in production use proper refresh token logic)
    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      process.env.JWT_PRIVATE_KEY,
      {
        algorithm: 'RS256',
        expiresIn: '7d',
      }
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles,
        emailVerified: user.emailVerified,
      },
    };
  }

  @Public()
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile (override)' })
  async getProfile(@Headers('authorization') authorization: string) {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authorization.substring(7);

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_PUBLIC_KEY, {
        algorithms: ['RS256'],
      }) as any;

      // Get user with profile
      const userWithProfile = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: {
          profile: true,
        },
      });

      if (!userWithProfile) {
        throw new UnauthorizedException('User not found');
      }

      const profile = userWithProfile.profile;

      // Return user data in the format expected by frontend
      return {
        id: userWithProfile.id,
        email: userWithProfile.email,
        name: profile?.full_name || userWithProfile.fullName || '',
        phone: profile?.phone_number || '',
        role: userWithProfile.roles[0] || 'user',
        roles: userWithProfile.roles,
        emailVerified: userWithProfile.emailVerified,
        isActive: userWithProfile.isActive,
        avatar: null,
        language: profile?.preferred_language || 'en',
        theme: profile?.theme || 'light',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token (override)' })
  async refresh(@Body() body: { refreshToken: string }) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(body.refreshToken, process.env.JWT_PUBLIC_KEY, {
        algorithms: ['RS256'],
      }) as any;

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Generate new tokens
      const payload = {
        sub: user.id,
        email: user.email,
        roles: user.roles,
      };

      const accessToken = jwt.sign(payload, process.env.JWT_PRIVATE_KEY, {
        algorithm: 'RS256',
        expiresIn: '24h',
      });

      const refreshToken = jwt.sign(
        { sub: user.id, type: 'refresh' },
        process.env.JWT_PRIVATE_KEY,
        {
          algorithm: 'RS256',
          expiresIn: '7d',
        }
      );

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
