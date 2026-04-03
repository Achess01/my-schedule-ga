import { Module } from '@nestjs/common';
import { StudyAreaService } from './study-area.service';
import { StudyAreaController } from './study-area.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StudyAreaController],
  providers: [StudyAreaService],
})
export class StudyAreaModule {}
