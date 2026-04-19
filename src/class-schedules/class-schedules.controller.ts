import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ClassSchedulesService } from './class-schedules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('class-schedules')
export class ClassSchedulesController {
  constructor(private readonly classSchedulesService: ClassSchedulesService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  findAll() {
    return this.classSchedulesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classSchedulesService.findOne(+id);
  }

  @Post('notify-change/:generatedScheduleId')
  notifyChange(@Param('generatedScheduleId') generatedScheduleId: string) {
    return this.classSchedulesService.notifyChange(generatedScheduleId);
  }
}
