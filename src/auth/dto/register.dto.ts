import {
  IsEmail,
  IsInt,
  Matches,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsString()
  firstname: string;

  @ApiProperty()
  @IsString()
  lastname: string;

  @ApiProperty()
  @IsPositive()
  roleId: number;

  @ApiPropertyOptional({ description: 'Requerido si el rol es STUDENT' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El carnet debe ser un numero entero' })
  @Min(1, { message: 'El carnet debe ser positivo' })
  studentId?: number;

  @ApiPropertyOptional({
    description: 'Requerido si el rol es STUDENT',
    type: String,
    format: 'date',
    example: '2024-01-15',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de ingreso debe tener formato YYYY-MM-DD',
  })
  entryDate?: string;
}
