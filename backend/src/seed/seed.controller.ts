import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '@ofeklabs/horizon-auth';
import * as bcrypt from 'bcrypt';

@ApiTags('seed')
@Controller('seed')
export class SeedController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('debug/users')
  @ApiOperation({ summary: 'Debug: List all users (email only)' })
  async debugUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        emailVerified: true,
        roles: true,
        isActive: true,
        passwordHash: true, // Check if password exists
      },
    });
    return { 
      count: users.length, 
      users: users.map(u => ({
        ...u,
        hasPassword: !!u.passwordHash,
        passwordHash: u.passwordHash ? `${u.passwordHash.substring(0, 10)}...` : null,
      }))
    };
  }

  @Public()
  @Post('debug/test-password')
  @ApiOperation({ summary: 'Debug: Test password verification' })
  async testPassword(@Body() body: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return { found: false };
    }

    const isValid = await bcrypt.compare(body.password, user.passwordHash);
    
    return {
      found: true,
      email: user.email,
      hasPassword: !!user.passwordHash,
      passwordValid: isValid,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
    };
  }
}
