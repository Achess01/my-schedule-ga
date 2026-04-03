import { Module } from '@nestjs/common';
import { PensumCoursePrerequisiteService } from './pensum-course-prerequisite.service';
import { PensumCoursePrerequisiteController } from './pensum-course-prerequisite.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PensumCoursePrerequisiteController],
  providers: [PensumCoursePrerequisiteService],
})
export class PensumCoursePrerequisiteModule {}
