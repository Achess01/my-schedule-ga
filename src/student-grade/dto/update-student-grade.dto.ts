import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, Min } from 'class-validator';
import { GradeType } from '../../generated/prisma/enums';

export class UpdateStudentGradeDto {
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
  grade: number;
}
