import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterPensumDto {
  @ApiPropertyOptional({ description: 'Filtrar por nombre' })
  @IsOptional()
  @IsString()
  name?: string;
}
