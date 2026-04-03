import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdatePensumCourseDto {
  @ApiProperty()
  @IsOptional()
  @IsInt({ message: 'El id de area de estudio debe ser un numero entero' })
  @Min(1, { message: 'El id de area de estudio debe ser positivo' })
  studyAreaId: number;

  @ApiProperty()
  @IsOptional()
  @IsInt({ message: 'Los creditos deben ser un numero entero' })
  @Min(0, { message: 'Los creditos no pueden ser negativos' })
  credits: number;

  @ApiProperty()
  @IsOptional()
  @IsInt({ message: 'Los creditos requeridos deben ser un numero entero' })
  @Min(0, { message: 'Los creditos requeridos no pueden ser negativos' })
  requiredCreds: number;

  @ApiProperty()
  @IsOptional()
  @IsBoolean({ message: 'isMandatory debe ser un valor booleano' })
  isMandatory: boolean;
}
