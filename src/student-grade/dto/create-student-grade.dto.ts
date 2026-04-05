import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, Max, Min } from 'class-validator';
import { GradeType } from '../../generated/prisma/enums';

export class CreateStudentGradeDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt({ message: 'El id de studentPensum debe ser un numero entero' })
  @Min(1, { message: 'El id de studentPensum debe ser positivo' })
  studentPensumId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt({ message: 'El id de pensumCourse debe ser un numero entero' })
  @Min(1, { message: 'El id de pensumCourse debe ser positivo' })
  pensumCourseId: number;

  @ApiProperty()
  @IsBoolean({ message: 'isApproved debe ser booleano' })
  isApproved: boolean;

  @ApiProperty({ enum: GradeType })
  @IsEnum(GradeType, { message: 'El tipo de nota es invalido' })
  gradeType: GradeType;

  @ApiProperty()
  @Type(() => Number)
  @IsInt({ message: 'La nota debe ser un numero entero' })
  @Min(0, { message: 'La nota no puede ser negativa' })
  @Max(100, { message: 'La nota no debe ser mayor a 100' })
  grade: number;
}
