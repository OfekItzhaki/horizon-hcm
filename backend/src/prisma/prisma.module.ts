import { Module, Global } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [
    PrismaService,
    // Provide PrismaService as PrismaClient for packages that expect PrismaClient
    {
      provide: PrismaClient,
      useExisting: PrismaService,
    },
    // Provide PrismaService with string token for @ofeklabs/horizon-auth v1.0.2+
    {
      provide: 'PRISMA_CLIENT',
      useExisting: PrismaService,
    },
  ],
  exports: [PrismaService, PrismaClient, 'PRISMA_CLIENT'],
})
export class PrismaModule {}
