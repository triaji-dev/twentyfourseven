import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { StartTimerDto, StopTimerDto } from './dto/timer.dto';

@Injectable()
export class TimerService {
  constructor(private prisma: PrismaService) {}

  async startTimer(startTimerDto: StartTimerDto) {
    const { userId, categoryId, projectId, notes } = startTimerDto;

    // Check if there's an active timer
    const activeTimer = await this.prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
    });

    if (activeTimer) {
      throw new Error('There is already an active timer. Please stop it first.');
    }

    // Create new time entry
    const timeEntry = await this.prisma.timeEntry.create({
      data: {
        userId,
        categoryId,
        projectId,
        notes,
        startTime: new Date(),
      },
      include: {
        category: true,
        project: true,
      },
    });

    return timeEntry;
  }

  async stopTimer(stopTimerDto: StopTimerDto) {
    const { userId, entryId, notes } = stopTimerDto;

    // Find the time entry
    const timeEntry = await this.prisma.timeEntry.findFirst({
      where: {
        id: entryId,
        userId,
        endTime: null,
      },
    });

    if (!timeEntry) {
      throw new Error('Active timer not found');
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - timeEntry.startTime.getTime()) / 1000);

    // Update the time entry
    const updatedEntry = await this.prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        endTime,
        duration,
        notes: notes || timeEntry.notes,
      },
      include: {
        category: true,
        project: true,
      },
    });

    return updatedEntry;
  }

  async getActiveTimer(userId: string) {
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

    return activeTimer;
  }
}
