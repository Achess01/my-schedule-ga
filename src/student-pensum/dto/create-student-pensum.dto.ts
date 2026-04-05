import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateStudentPensumDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt({ message: 'El id de estudiante debe ser un numero entero' })
  @Min(1, { message: 'El id de estudiante debe ser positivo' })
  studentId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt({ message: 'El id de pensum debe ser un numero entero' })
  @Min(1, { message: 'El id de pensum debe ser positivo' })
  pensumId: number;
}
