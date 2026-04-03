import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, Max, Min } from 'class-validator';

export class CreatePensumCourseDto {
  @ApiProperty()
  @IsInt({ message: 'El id de pensum debe ser un numero entero' })
  @Min(1, { message: 'El id de pensum debe ser positivo' })
  pensumId: number;

  @ApiProperty()
  @IsInt({ message: 'El codigo de curso debe ser un numero entero' })
  @Min(1, { message: 'El codigo de curso debe ser positivo' })
  courseCode: number;

  @ApiProperty()
  @IsInt({ message: 'El id de area de estudio debe ser un numero entero' })
  @Min(1, { message: 'El id de area de estudio debe ser positivo' })
  studyAreaId: number;

  @ApiProperty()
  @IsInt({ message: 'Los creditos deben ser un numero entero' })
  @Min(0, { message: 'Los creditos no pueden ser negativos' })
  credits: number;

  @ApiProperty()
  @IsInt({ message: 'Los creditos requeridos deben ser un numero entero' })
  @Min(0, { message: 'Los creditos requeridos no pueden ser negativos' })
  requiredCreds: number;

  @ApiProperty()
  @IsBoolean({ message: 'isMandatory debe ser un valor booleano' })
  isMandatory: boolean;

  @ApiProperty()
  @IsInt({ message: 'El semestre debe ser un numero entero' })
  @Min(1, { message: 'El semestre debe estar entre 1 y 10' })
  @Max(10, { message: 'El semestre debe estar entre 1 y 10' })
  semester: number;
}
