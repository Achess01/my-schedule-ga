import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateStudyAreaDto {
  @ApiProperty()
  @IsString({ message: 'El nombre es obligatorio' })
  name: string;

  @ApiProperty()
  @IsString({ message: 'La descripción es obligatoria' })
  description: string;
}
