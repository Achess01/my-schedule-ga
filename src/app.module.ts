import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CareerModule } from './career/career.module';
import { CourseModule } from './course/course.module';

@Module({
  imports: [PrismaModule, AuthModule, CareerModule, CourseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
