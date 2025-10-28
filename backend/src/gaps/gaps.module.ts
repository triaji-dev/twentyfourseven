import { Module } from '@nestjs/common';
import { GapsController } from './gaps.controller';
import { GapsService } from './gaps.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [GapsController],
  providers: [GapsService, PrismaService],
})
export class GapsModule {}
