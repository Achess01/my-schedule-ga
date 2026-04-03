import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCareerDto {
  @ApiProperty()
  @IsString({ message: 'El nombre es obligatorio' })
  name: string;
}
