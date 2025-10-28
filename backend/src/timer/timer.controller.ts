import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { TimerService } from './timer.service';
import { StartTimerDto, StopTimerDto } from './dto/timer.dto';

@Controller('timer')
export class TimerController {
  constructor(private readonly timerService: TimerService) {}

  @Post('start')
  async startTimer(@Body() startTimerDto: StartTimerDto) {
    return this.timerService.startTimer(startTimerDto);
  }

  @Post('stop')
  async stopTimer(@Body() stopTimerDto: StopTimerDto) {
    return this.timerService.stopTimer(stopTimerDto);
  }

  @Get('active/:userId')
  async getActiveTimer(@Param('userId') userId: string) {
    return this.timerService.getActiveTimer(userId);
  }
}
