import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty()
  @IsInt({ message: 'El código debe ser un número entero' })
  @Min(1, { message: 'El código debe ser positivo' })
  courseCode: number;

  @ApiProperty()
  @IsString({ message: 'El nombre es obligatorio' })
  name: string;

  @ApiProperty()
  @IsInt({ message: 'Los créditos por defecto deben ser un número entero' })
  @Min(0, { message: 'Los créditos por defecto no pueden ser negativos' })
  defaultCredits: number;
}
