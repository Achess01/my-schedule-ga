import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PensumService } from './pensum.service';
import { CreatePensumDto } from './dto/create-pensum.dto';
import { UpdatePensumDto } from './dto/update-pensum.dto';
import { FilterPensumDto } from './dto/filter-pensum.dto';

@ApiTags('pensum')
@ApiBearerAuth()
@Controller('pensum')
export class PensumController {
  constructor(private readonly pensumService: PensumService) {}

  @ApiOperation({ summary: 'Crear pensum', description: 'SOLO ADMIN' })
  @ApiCreatedResponse({ description: 'Pensum creado exitósamente' })
  @ApiConflictResponse({ description: 'Ya existe un pensum con ese nombre' })
  @ApiNotFoundResponse({ description: 'Carrera no encontrada' })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede crear pensums' })
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  create(@Body() createPensumDto: CreatePensumDto) {
    return this.pensumService.create(createPensumDto);
  }

  @ApiOperation({ summary: 'Listar pensums' })
  @ApiOkResponse({ description: 'Pensums obtenidos exitosamente' })
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() filter: FilterPensumDto) {
    const parsedName = filter.name?.trim();

    return this.pensumService.findAll({
      name: parsedName,
    });
  }

  @ApiOperation({ summary: 'Obtener pensum por id' })
  @ApiOkResponse({ description: 'Pensum obtenido exitosamente' })
  @ApiNotFoundResponse({ description: 'Pensum no encontrado' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pensumService.findOne(+id);
  }

  @ApiOperation({ summary: 'Actualizar pensum', description: 'SOLO ADMIN' })
  @ApiOkResponse({ description: 'Pensum actualizado exitosamente' })
  @ApiNotFoundResponse({ description: 'Pensum o carrera no encontrados' })
  @ApiConflictResponse({ description: 'Ya existe un pensum con ese nombre' })
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePensumDto: UpdatePensumDto) {
    return this.pensumService.update(+id, updatePensumDto);
  }

  @ApiOperation({ summary: 'Eliminar pensum', description: 'SOLO ADMIN' })
  @ApiOkResponse({ description: 'Pensum eliminado exitosamente' })
  @ApiNotFoundResponse({ description: 'Pensum no encontrado' })
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pensumService.remove(+id);
  }
}
