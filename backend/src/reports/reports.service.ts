import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getReport(userId: string, startDate: Date, endDate: Date) {
    // Get all time entries within the date range
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
      include: {
        category: true,
        project: true,
      },
    });

    // Calculate total time by category
    const categoryStats: Record<string, any> = {};
    let totalDuration = 0;

    timeEntries.forEach((entry) => {
      const categoryId = entry.categoryId;
      const categoryName = entry.category.name;
      const duration = entry.duration || 0;

      if (!categoryStats[categoryId]) {
        categoryStats[categoryId] = {
          categoryId,
          categoryName,
          color: entry.category.color,
          totalDuration: 0,
          count: 0,
        };
      }

      categoryStats[categoryId].totalDuration += duration;
      categoryStats[categoryId].count += 1;
      totalDuration += duration;
    });

    // Convert to array and add percentages
    const categoryData = Object.values(categoryStats).map((stat: any) => ({
      ...stat,
      percentage: totalDuration > 0 ? (stat.totalDuration / totalDuration) * 100 : 0,
    }));

    // Get goals progress
    const goals = await this.prisma.goal.findMany({
      where: {
        userId,
        completed: false,
      },
    });

    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        // Calculate hours spent on goal (this is simplified - you may want to link goals to categories/projects)
        const progress = 0; // Placeholder - implement based on your business logic
        
        return {
          ...goal,
          progress,
          progressPercentage: (progress / goal.targetHours) * 100,
        };
      })
    );

    return {
      totalDuration,
      totalHours: totalDuration / 3600,
      categoryData: categoryData.sort((a, b) => b.totalDuration - a.totalDuration),
      entryCount: timeEntries.length,
      goals: goalsWithProgress,
      startDate,
      endDate,
    };
  }

  async getDashboardData(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's data
    const todayReport = await this.getReport(userId, today, tomorrow);

    // Get week data
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekReport = await this.getReport(userId, weekStart, tomorrow);

    // Get active timer
    const activeTimer = await this.prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
      include: {
        category: true,
        project: true,
      },
    });

    return {
      today: todayReport,
      week: weekReport,
      activeTimer,
    };
  }
}
