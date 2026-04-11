import { PartialType } from '@nestjs/swagger';
import { CreateStudentScheduleDto } from './create-student-schedule.dto';

export class UpdateStudentScheduleDto extends PartialType(
  CreateStudentScheduleDto,
) {}
