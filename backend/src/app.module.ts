import { Module } from '@nestjs/common';
import { PrismaService } from './common/prisma.service';
import { TimerModule } from './timer/timer.module';
import { GapsModule } from './gaps/gaps.module';
import { TakeawaysModule } from './takeaways/takeaways.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [TimerModule, GapsModule, TakeawaysModule, ReportsModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
