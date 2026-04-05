import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class FilterStudentGradeDto {
  @ApiPropertyOptional({ description: 'Filtrar por studentId' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El studentId debe ser un numero entero' })
  @Min(1, { message: 'El studentId debe ser positivo' })
  studentId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por pensumId' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El pensumId debe ser un numero entero' })
  @Min(1, { message: 'El pensumId debe ser positivo' })
  pensumId?: number;
}
