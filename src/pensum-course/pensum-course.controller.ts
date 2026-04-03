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
import { PensumCourseService } from './pensum-course.service';
import { CreatePensumCourseDto } from './dto/create-pensum-course.dto';
import { UpdatePensumCourseDto } from './dto/update-pensum-course.dto';
import { FilterPensumCourseDto } from './dto/filter-pensum-course.dto';

@ApiTags('pensum-course')
@ApiBearerAuth()
@Controller('pensum-course')
export class PensumCourseController {
  constructor(private readonly pensumCourseService: PensumCourseService) {}

  @ApiOperation({ summary: 'Crear relacion pensum-curso' })
  @ApiCreatedResponse({
    description: 'Relacion pensum-curso creada exitosamente',
  })
  @ApiConflictResponse({
    description: 'Ya existe una relacion pensum-curso para ese pensum y curso',
  })
  @ApiNotFoundResponse({
    description: 'Pensum, curso o area de estudio no encontrados',
  })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createPensumCourseDto: CreatePensumCourseDto) {
    return this.pensumCourseService.create(createPensumCourseDto);
  }

  @ApiOperation({ summary: 'Listar relaciones pensum-curso' })
  @ApiOkResponse({
    description: 'Relaciones pensum-curso obtenidas exitosamente',
  })
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() filter: FilterPensumCourseDto) {
    return this.pensumCourseService.findAll({
      pensumId: filter.pensumId,
      courseName: filter.courseName?.trim(),
    });
  }

  @ApiOperation({ summary: 'Obtener relacion pensum-curso por id' })
  @ApiOkResponse({ description: 'Relacion pensum-curso obtenida exitosamente' })
  @ApiNotFoundResponse({ description: 'Relacion pensum-curso no encontrada' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pensumCourseService.findOne(+id);
  }

  @ApiOperation({ summary: 'Actualizar relacion pensum-curso' })
  @ApiOkResponse({
    description: 'Relacion pensum-curso actualizada exitosamente',
  })
  @ApiNotFoundResponse({
    description:
      'Relacion pensum-curso, pensum, curso o area de estudio no encontrados',
  })
  @ApiConflictResponse({
    description: 'Ya existe una relacion pensum-curso para ese pensum y curso',
  })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePensumCourseDto: UpdatePensumCourseDto,
  ) {
    return this.pensumCourseService.update(+id, updatePensumCourseDto);
  }

  @ApiOperation({ summary: 'Eliminar relacion pensum-curso' })
  @ApiOkResponse({
    description: 'Relacion pensum-curso eliminada exitosamente',
  })
  @ApiNotFoundResponse({ description: 'Relacion pensum-curso no encontrada' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pensumCourseService.remove(+id);
  }
}
