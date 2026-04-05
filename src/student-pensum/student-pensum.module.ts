import { Module } from '@nestjs/common';
import { StudentPensumService } from './student-pensum.service';
import { StudentPensumController } from './student-pensum.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StudentPensumController],
  providers: [StudentPensumService],
})
export class StudentPensumModule {}
