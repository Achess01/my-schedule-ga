import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class CreatePensumDto {
  @ApiProperty()
  @IsString({ message: 'El nombre es obligatorio' })
  name: string;

  @ApiProperty()
  @IsInt({ message: 'Los créditos necesarios deben ser un número entero' })
  @Min(0, { message: 'Los créditos necesarios no pueden ser negativos' })
  creditsNeeded: number;

  @ApiProperty()
  @IsInt({ message: 'El id de carrera debe ser un número entero' })
  @Min(1, { message: 'El id de carrera debe ser positivo' })
  careerId: number;
}
