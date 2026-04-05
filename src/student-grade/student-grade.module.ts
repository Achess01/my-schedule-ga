import { Module } from '@nestjs/common';
import { StudentGradeService } from './student-grade.service';
import { StudentGradeController } from './student-grade.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StudentGradeController],
  providers: [StudentGradeService],
})
export class StudentGradeModule {}
