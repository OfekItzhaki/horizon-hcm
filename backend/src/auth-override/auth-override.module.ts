import { Module } from '@nestjs/common';
import { AuthOverrideController } from './auth-override.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuthOverrideController],
})
export class AuthOverrideModule {}
