import { Module } from '@nestjs/common';
import { StudentSchedulesService } from './student-schedules.service';
import { StudentSchedulesController } from './student-schedules.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClassSchedulesModule } from '../class-schedules/class-schedules.module';

@Module({
  imports: [PrismaModule, ClassSchedulesModule],
  controllers: [StudentSchedulesController],
  providers: [StudentSchedulesService],
})
export class StudentSchedulesModule {}
