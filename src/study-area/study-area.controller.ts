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
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StudyAreaService } from './study-area.service';
import { CreateStudyAreaDto } from './dto/create-study-area.dto';
import { UpdateStudyAreaDto } from './dto/update-study-area.dto';
import { FilterStudyAreaDto } from './dto/filter-study-area.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('study-area')
@ApiBearerAuth()
@Controller('study-area')
export class StudyAreaController {
  constructor(private readonly studyAreaService: StudyAreaService) {}

  @ApiOperation({ summary: 'Crear area de estudio', description: 'SOLO ADMIN' })
  @ApiCreatedResponse({ description: 'Área de estudio creada exitosamente' })
  @ApiConflictResponse({
    description: 'Ya existe un area de estudio con ese nombre',
  })
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  create(@Body() createStudyAreaDto: CreateStudyAreaDto) {
    return this.studyAreaService.create(createStudyAreaDto);
  }

  @ApiOperation({ summary: 'Listar áreas de estudio' })
  @ApiOkResponse({ description: 'Áreas de estudio obtenidas exitosamente' })
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() filter: FilterStudyAreaDto) {
    const parsedName = filter.name?.trim();

    return this.studyAreaService.findAll({
      name: parsedName,
    });
  }

  @ApiOperation({ summary: 'Obtener área de estudio por id' })
  @ApiOkResponse({ description: 'Área de estudio obtenida exitosamente' })
  @ApiNotFoundResponse({ description: 'Área de estudio no encontrada' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studyAreaService.findOne(+id);
  }

  @ApiOperation({
    summary: 'Actualizar área de estudio',
    description: 'SOLO ADMIN',
  })
  @ApiOkResponse({ description: 'Área de estudio actualizada exitosamente' })
  @ApiNotFoundResponse({ description: 'Área de estudio no encontrada' })
  @ApiConflictResponse({
    description: 'Ya existe un área de estudio con ese nombre',
  })
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStudyAreaDto: UpdateStudyAreaDto,
  ) {
    return this.studyAreaService.update(+id, updateStudyAreaDto);
  }

  @ApiOperation({
    summary: 'Eliminar área de estudio',
    description: 'SOLO ADMIN',
  })
  @ApiOkResponse({ description: 'Área de estudio eliminada exitosamente' })
  @ApiNotFoundResponse({ description: 'Área de estudio no encontrada' })
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studyAreaService.remove(+id);
  }
}
