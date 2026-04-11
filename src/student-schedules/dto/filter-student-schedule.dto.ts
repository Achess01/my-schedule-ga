import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class FilterStudentScheduleDto {
  @ApiPropertyOptional({
    description: 'Filtrar por horarios activos. Por defecto true',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'El active debe ser un boolean' })
  active?: boolean;

  @ApiPropertyOptional({ description: 'Filtrar por studentPensumId' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El studentPensumId debe ser un numero entero' })
  @Min(1, { message: 'El studentPensumId debe ser positivo' })
  studentPensumId?: number;
}
