import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateTakeawayDto } from './dto/takeaway.dto';

@Injectable()
export class TakeawaysService {
  constructor(private prisma: PrismaService) {}

  async createTakeaway(createTakeawayDto: CreateTakeawayDto) {
    const { userId, content, date } = createTakeawayDto;

    const takeaway = await this.prisma.takeaway.create({
      data: {
        userId,
        content,
        date: date ? new Date(date) : new Date(),
      },
    });

    return takeaway;
  }

  async getTakeaways(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const takeaways = await this.prisma.takeaway.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
    });

    return takeaways;
  }
}
