import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from '../users/dto/register-user.dto';
import { generateId } from '../common/utils/id-generator';
import axios from 'axios';

@Injectable()
export class RegistrationService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterUserDto) {
    // Validate terms acceptance
    if (!dto.acceptedTerms) {
      throw new BadRequestException('You must accept the terms and conditions');
    }

    // Use the auth package's registration endpoint to create the user
    // This ensures password hashing is done correctly
    try {
      await axios.post(`http://localhost:3001/auth/register`, {
        email: dto.email,
        password: dto.password,
        fullName: dto.fullName,
        tenantId: dto.tenantId || 'default',
      });
    } catch (error: any) {
      // If user already exists or other error, throw it
      if (error.response?.status === 409) {
        throw new BadRequestException('User with this email already exists');
      }
      throw error;
    }

    // Get the created user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('User creation failed');
    }

    // Create user profile with HCM-specific fields
    const profile = await this.prisma.user_profiles.create({
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

    // Return user without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      profile,
    };
  }
}
