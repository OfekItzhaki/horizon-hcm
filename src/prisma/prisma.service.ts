import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
    console.log('✅ PrismaService constructor called');
  }

  async onModuleInit() {
    console.log('✅ PrismaService connecting to database...');
    await this.$connect();
    console.log('✅ PrismaService connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
