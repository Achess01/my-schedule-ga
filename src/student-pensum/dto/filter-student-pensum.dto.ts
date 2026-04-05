import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class FilterStudentPensumDto {
  @ApiPropertyOptional({ description: 'Filtrar por id de estudiante' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El id de estudiante debe ser un numero entero' })
  @Min(1, { message: 'El id de estudiante debe ser positivo' })
  studentId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por id de pensum' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El id de pensum debe ser un numero entero' })
  @Min(1, { message: 'El id de pensum debe ser positivo' })
  pensumId?: number;
}
