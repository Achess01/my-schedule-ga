import { Module } from '@nestjs/common';
import { PensumCourseService } from './pensum-course.service';
import { PensumCourseController } from './pensum-course.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PensumCourseController],
  providers: [PensumCourseService],
})
export class PensumCourseModule {}
