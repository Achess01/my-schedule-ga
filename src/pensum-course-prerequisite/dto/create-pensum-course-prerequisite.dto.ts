import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreatePensumCoursePrerequisiteDto {
  @ApiProperty()
  @IsInt({ message: 'El id de pensum-curso debe ser un numero entero' })
  @Min(1, { message: 'El id de pensum-curso debe ser positivo' })
  pensumCourseId: number;

  @ApiProperty()
  @IsInt({ message: 'El id de prerrequisito debe ser un numero entero' })
  @Min(1, { message: 'El id de prerrequisito debe ser positivo' })
  prerequisiteId: number;
}
