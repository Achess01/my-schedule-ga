import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FilterStudentDto {
  @ApiPropertyOptional({ description: 'Filtrar por carnet' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El carnet debe ser un numero entero' })
  @Min(1, { message: 'El carnet debe ser positivo' })
  studentId?: number;

  @ApiPropertyOptional({ description: 'Buscar por nombre o apellido' })
  @IsOptional()
  @IsString()
  search?: string;
}
