import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FilterPensumCourseDto {
  @ApiProperty({ description: 'Filtrar por id de pensum' })
  @Type(() => Number)
  @IsInt({ message: 'El id de pensum debe ser un numero entero' })
  @Min(1, { message: 'El id de pensum debe ser positivo' })
  pensumId: number;

  @ApiPropertyOptional({ description: 'Filtrar por nombre del curso' })
  @IsOptional()
  @IsString()
  courseName?: string;
}
