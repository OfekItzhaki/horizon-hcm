import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from '../users/dto/register-user.dto';
import { generateId } from '../common/utils/id-generator';
import * as argon2 from '@node-rs/argon2';

@Injectable()
export class RegistrationService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterUserDto) {
    // Validate terms acceptance
    if (!dto.acceptedTerms) {
      throw new BadRequestException('You must accept the terms and conditions');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await argon2.hash(dto.password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // Create user and profile in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create auth user
      const user = await tx.user.create({
        data: {
          id: generateId(),
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          emailVerified: false,
          tenantId: dto.tenantId || 'default',
          roles: ['user'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create user profile
      const profile = await tx.user_profiles.create({
        data: {
          id: generateId(),
          user_id: user.id,
          full_name: dto.fullName,
          phone_number: dto.phone,
          user_type: 'TENANT', // Default to tenant, can be changed later
          preferred_language: 'en',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return { user, profile };
    });

    // Return user without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = result.user;

    return {
      user: userWithoutPassword,
      profile: result.profile,
    };
  }
}
