import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { TakeawaysService } from './takeaways.service';
import { CreateTakeawayDto } from './dto/takeaway.dto';

@Controller('takeaways')
export class TakeawaysController {
  constructor(private readonly takeawaysService: TakeawaysService) {}

  @Post()
  async createTakeaway(@Body() createTakeawayDto: CreateTakeawayDto) {
    return this.takeawaysService.createTakeaway(createTakeawayDto);
  }

  @Get()
  async getTakeaways(
    @Query('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.takeawaysService.getTakeaways(userId, start, end);
  }
}
