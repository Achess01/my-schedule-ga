import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CareerModule } from './career/career.module';
import { CourseModule } from './course/course.module';
import { StudyAreaModule } from './study-area/study-area.module';
import { PensumModule } from './pensum/pensum.module';
import { PensumCourseModule } from './pensum-course/pensum-course.module';
import { PensumCoursePrerequisiteModule } from './pensum-course-prerequisite/pensum-course-prerequisite.module';
import { RoleModule } from './role/role.module';
import { StudentModule } from './student/student.module';
import { StudentPensumModule } from './student-pensum/student-pensum.module';
import { StudentGradeModule } from './student-grade/student-grade.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CareerModule,
    CourseModule,
    StudyAreaModule,
    PensumModule,
    PensumCourseModule,
    PensumCoursePrerequisiteModule,
    RoleModule,
    StudentModule,
    StudentPensumModule,
    StudentGradeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
