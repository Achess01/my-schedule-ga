import { Module } from '@nestjs/common';
import { PensumService } from './pensum.service';
import { PensumController } from './pensum.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PensumController],
  providers: [PensumService],
})
export class PensumModule {}
