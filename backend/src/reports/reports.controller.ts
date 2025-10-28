import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async getReport(
    @Query('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.reportsService.getReport(userId, start, end);
  }

  @Get('dashboard')
  async getDashboard(@Query('userId') userId: string) {
    return this.reportsService.getDashboardData(userId);
  }
}
