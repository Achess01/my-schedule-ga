import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { StudentPensumService } from './student-pensum.service';
import { CreateStudentPensumDto } from './dto/create-student-pensum.dto';
import { FilterStudentPensumDto } from './dto/filter-student-pensum.dto';
import { FindAssignableCoursesDto } from './dto/find-assignable-courses.dto';

@ApiTags('student-pensum')
@ApiBearerAuth()
@Controller('student-pensum')
export class StudentPensumController {
  constructor(private readonly studentPensumService: StudentPensumService) {}

  @ApiOperation({ summary: 'Registrar estudiante en pensum' })
  @ApiCreatedResponse({ description: 'Registro estudiante-pensum creado' })
  @ApiConflictResponse({
    description: 'El estudiante ya se encuentra registrado en este pensum',
  })
  @ApiNotFoundResponse({ description: 'Estudiante o pensum no encontrados' })
  @ApiForbiddenResponse({
    description: 'Solo ADMIN puede crear registros estudiante-pensum',
  })
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  create(@Body() createStudentPensumDto: CreateStudentPensumDto) {
    return this.studentPensumService.create(createStudentPensumDto);
  }

  @ApiOperation({ summary: 'Un estudiante se registran en un pensum' })
  @ApiCreatedResponse({ description: 'Registro estudiante-pensum creado' })
  @ApiConflictResponse({
    description: 'El estudiante ya se encuentra registrado en este pensum',
  })
  @ApiNotFoundResponse({ description: 'Estudiante o pensum no encontrados' })
  @ApiForbiddenResponse({
    description: 'Solo STUDENT se puede registrar en un pensum',
  })
  @Roles('STUDENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('join/:pensumId')
  join(@Param('pensumId') pensumId: string, @Req() req: Request) {
    const user = req['user'] as JwtPayload;

    return this.studentPensumService.create({
      pensumId: +pensumId,
      studentId: user.studentId ?? 0,
    });
  }

  @ApiOperation({ summary: 'Listar registros estudiante-pensum' })
  @ApiOkResponse({ description: 'Registros estudiante-pensum obtenidos' })
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() filter: FilterStudentPensumDto, @Req() req: Request) {
    const user = req['user'] as JwtPayload;

    return this.studentPensumService.findAll(
      {
        studentId: filter.studentId,
        pensumId: filter.pensumId,
      },
      user,
    );
  }

  @ApiOperation({
    summary: 'Listar cursos asignables de un estudiante por pensum',
  })
  @ApiOkResponse({ description: 'Cursos asignables obtenidos' })
  @ApiNotFoundResponse({
    description:
      'Estudiante, pensum o registro estudiante-pensum no encontrados',
  })
  @ApiForbiddenResponse({
    description: 'No autorizado para consultar cursos asignables',
  })
  @UseGuards(JwtAuthGuard)
  @Get('assignable-courses')
  findAssignableCourses(
    @Query() query: FindAssignableCoursesDto,
    @Req() req: Request,
  ) {
    const user = req['user'] as JwtPayload;

    const resolvedStudentId = user.studentId ?? query.studentId;

    if (!resolvedStudentId) {
      throw new BadRequestException('Debe enviar studentId en query o token');
    }

    return this.studentPensumService.findAssignableCourses(
      resolvedStudentId,
      query.pensumId,
      user,
    );
  }

  @ApiOperation({ summary: 'Obtener registro estudiante-pensum por id' })
  @ApiOkResponse({ description: 'Registro estudiante-pensum obtenido' })
  @ApiNotFoundResponse({
    description: 'Registro estudiante-pensum no encontrado',
  })
  @ApiForbiddenResponse({
    description: 'No autorizado para consultar este registro',
  })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req['user'] as JwtPayload;
    return this.studentPensumService.findOne(+id, user);
  }

  @ApiOperation({ summary: 'Eliminar registro estudiante-pensum' })
  @ApiOkResponse({ description: 'Registro estudiante-pensum eliminado' })
  @ApiNotFoundResponse({
    description: 'Registro estudiante-pensum no encontrado',
  })
  @ApiForbiddenResponse({
    description: 'Solo ADMIN puede eliminar registros estudiante-pensum',
  })
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentPensumService.remove(+id);
  }
}
