import { Module } from '@nestjs/common';
import { TakeawaysController } from './takeaways.controller';
import { TakeawaysService } from './takeaways.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [TakeawaysController],
  providers: [TakeawaysService, PrismaService],
})
export class TakeawaysModule {}
