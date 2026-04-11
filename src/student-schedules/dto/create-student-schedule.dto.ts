import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, Min } from 'class-validator';

export class CreateStudentScheduleDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt({ message: 'El id de horario debe ser un numero entero' })
  @Min(1, { message: 'El id de horario debe ser positivo' })
  scheduleId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt({ message: 'El id de studentPensum debe ser un numero entero' })
  @Min(1, { message: 'El id de studentPensum debe ser positivo' })
  studentPensumId: number;

  @ApiProperty({ type: [Number] })
  @IsArray({ message: 'courseCodes debe ser un arreglo' })
  @ArrayNotEmpty({ message: 'Debe enviar al menos un curso' })
  @Type(() => Number)
  @IsInt({
    each: true,
    message: 'Cada codigo de curso debe ser un numero entero',
  })
  @Min(1, {
    each: true,
    message: 'Cada codigo de curso debe ser positivo',
  })
  courseCodes: number[];
}
