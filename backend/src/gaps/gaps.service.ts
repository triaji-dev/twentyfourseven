import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class GapsService {
  constructor(private prisma: PrismaService) {}

  async checkGaps(userId: string, startDate: Date, endDate: Date) {
    // Get all time entries for the user within the date range
    const timeEntries = await this.prisma.timeEntry.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        endTime: {
          not: null,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Find gaps between entries
    const gaps = [];
    for (let i = 0; i < timeEntries.length - 1; i++) {
      const currentEnd = timeEntries[i].endTime;
      const nextStart = timeEntries[i + 1].startTime;

      if (currentEnd && nextStart) {
        const gapDuration = Math.floor((nextStart.getTime() - currentEnd.getTime()) / 1000);
        
        // Only consider gaps larger than 5 minutes (300 seconds)
        if (gapDuration > 300) {
          gaps.push({
            start: currentEnd,
            end: nextStart,
            duration: gapDuration,
          });
        }
      }
    }

    return {
      gaps,
      totalGaps: gaps.length,
      totalGapTime: gaps.reduce((sum, gap) => sum + gap.duration, 0),
    };
  }
}
