import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { StudentGradeService } from './student-grade.service';
import { CreateStudentGradeDto } from './dto/create-student-grade.dto';
import { UpdateStudentGradeDto } from './dto/update-student-grade.dto';
import { FilterStudentGradeDto } from './dto/filter-student-grade.dto';

@ApiTags('student-grade')
@ApiBearerAuth()
@Controller('student-grade')
export class StudentGradeController {
  constructor(private readonly studentGradeService: StudentGradeService) {}

  @ApiOperation({ summary: 'Crear nota de estudiante' })
  @ApiCreatedResponse({ description: 'Nota creada exitosamente' })
  @ApiNotFoundResponse({
    description: 'studentPensum o pensumCourse no encontrados',
  })
  @ApiConflictResponse({
    description:
      'Regla de intentos o aprobacion incumplida, o relacion de pensum invalida',
  })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede crear notas' })
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  create(@Body() createStudentGradeDto: CreateStudentGradeDto) {
    return this.studentGradeService.create(createStudentGradeDto);
  }

  @ApiOperation({ summary: 'Listar notas de estudiantes' })
  @ApiOkResponse({ description: 'Notas obtenidas exitosamente' })
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() filter: FilterStudentGradeDto, @Req() req: Request) {
    const user = req['user'] as JwtPayload;

    return this.studentGradeService.findAll(
      {
        studentId: filter.studentId,
        pensumId: filter.pensumId,
      },
      user,
    );
  }

  @ApiOperation({ summary: 'Obtener tipos de nota' })
  @ApiOkResponse({ description: 'Tipos de nota obtenidos exitosamente' })
  @UseGuards(JwtAuthGuard)
  @Get('grade-types')
  getGradeTypes() {
    return this.studentGradeService.getGradeTypes();
  }

  @ApiOperation({ summary: 'Obtener nota por id' })
  @ApiOkResponse({ description: 'Nota obtenida exitosamente' })
  @ApiNotFoundResponse({ description: 'Nota no encontrada' })
  @ApiForbiddenResponse({
    description: 'No autorizado para consultar esta nota',
  })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req['user'] as JwtPayload;
    return this.studentGradeService.findOne(+id, user);
  }

  @ApiOperation({ summary: 'Actualizar nota de estudiante' })
  @ApiOkResponse({ description: 'Nota actualizada exitosamente' })
  @ApiNotFoundResponse({ description: 'Nota no encontrada' })
  @ApiConflictResponse({
    description: 'Regla de intentos o aprobacion incumplida',
  })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede actualizar notas' })
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStudentGradeDto: UpdateStudentGradeDto,
  ) {
    return this.studentGradeService.update(+id, updateStudentGradeDto);
  }

  @ApiOperation({ summary: 'Eliminar nota de estudiante' })
  @ApiOkResponse({ description: 'Nota eliminada exitosamente' })
  @ApiNotFoundResponse({ description: 'Nota no encontrada' })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede eliminar notas' })
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentGradeService.remove(+id);
  }
}
