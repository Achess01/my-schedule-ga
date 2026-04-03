import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
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
import { PensumCoursePrerequisiteService } from './pensum-course-prerequisite.service';
import { CreatePensumCoursePrerequisiteDto } from './dto/create-pensum-course-prerequisite.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('pensum-course-prerequisite')
@ApiBearerAuth()
@Controller('pensum-course-prerequisite')
export class PensumCoursePrerequisiteController {
  constructor(
    private readonly pensumCoursePrerequisiteService: PensumCoursePrerequisiteService,
  ) {}

  @ApiOperation({
    summary: 'Crear relacion de prerrequisito',
    description: 'SOLO ADMIN',
  })
  @ApiCreatedResponse({
    description: 'Relacion de prerrequisito creada exitosamente',
  })
  @ApiNotFoundResponse({ description: 'Pensum-curso no encontrado' })
  @ApiConflictResponse({
    description:
      'Relacion invalida por duplicidad, reciprocidad, auto-referencia o regla de semestre',
  })
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  create(
    @Body()
    createPensumCoursePrerequisiteDto: CreatePensumCoursePrerequisiteDto,
  ) {
    return this.pensumCoursePrerequisiteService.create(
      createPensumCoursePrerequisiteDto,
    );
  }

  @ApiOperation({
    summary: 'Eliminar relacion de prerrequisito',
    description: 'SOLO ADMIN',
  })
  @ApiOkResponse({
    description: 'Relacion de prerrequisito eliminada exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Relacion de prerrequisito no encontrada',
  })
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':pensumCourseId/:prerequisiteId')
  remove(
    @Param('pensumCourseId') pensumCourseId: string,
    @Param('prerequisiteId') prerequisiteId: string,
  ) {
    return this.pensumCoursePrerequisiteService.remove(
      +pensumCourseId,
      +prerequisiteId,
    );
  }
}
