import { PartialType } from '@nestjs/swagger';
import { CreatePensumCoursePrerequisiteDto } from './create-pensum-course-prerequisite.dto';

export class UpdatePensumCoursePrerequisiteDto extends PartialType(
  CreatePensumCoursePrerequisiteDto,
) {}
