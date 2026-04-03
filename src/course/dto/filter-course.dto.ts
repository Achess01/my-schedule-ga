import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterCourseDto {
  @ApiPropertyOptional({ description: 'Filtrar por nombre' })
  name?: string;

  @ApiPropertyOptional({ description: 'Filtrar por código' })
  courseCode?: number;
}
