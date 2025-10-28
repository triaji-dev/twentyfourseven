import { Controller, Get, Query } from '@nestjs/common';
import { GapsService } from './gaps.service';

@Controller('gaps')
export class GapsController {
  constructor(private readonly gapsService: GapsService) {}

  @Get('check')
  async checkGaps(
    @Query('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.gapsService.checkGaps(userId, start, end);
  }
}
