import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Matches, Min } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt({ message: 'El carnet debe ser un numero entero' })
  @Min(1, { message: 'El carnet debe ser positivo' })
  studentId: number;

  @ApiProperty({ type: String, format: 'date', example: '2024-01-15' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de ingreso debe tener formato YYYY-MM-DD',
  })
  entryDate: string;

  @ApiProperty()
  @IsString({ message: 'El nombre es obligatorio' })
  firstname: string;

  @ApiProperty()
  @IsString({ message: 'El apellido es obligatorio' })
  lastname: string;
}
