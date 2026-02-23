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
  ],
  exports: [PrismaService, PrismaClient],
})
export class PrismaModule {}
