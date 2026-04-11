import { Module } from '@nestjs/common';
import { ClassSchedulesService } from './class-schedules.service';
import { ClassSchedulesController } from './class-schedules.controller';

@Module({
  controllers: [ClassSchedulesController],
  providers: [ClassSchedulesService],
})
export class ClassSchedulesModule {}
