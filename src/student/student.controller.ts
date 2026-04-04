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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { FilterStudentDto } from './dto/filter-student.dto';

@ApiTags('student')
@ApiBearerAuth()
@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @ApiOperation({ summary: 'Crear estudiante' })
  @ApiCreatedResponse({ description: 'Estudiante creado exitosamente' })
  @ApiConflictResponse({
    description: 'Ya existe un estudiante con ese carnet',
  })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede crear estudiantes' })
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }

  @ApiOperation({ summary: 'Listar estudiantes' })
  @ApiOkResponse({ description: 'Estudiantes obtenidos exitosamente' })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede listar estudiantes' })
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  findAll(@Query() filter: FilterStudentDto) {
    return this.studentService.findAll({
      studentId: filter.studentId,
      search: filter.search?.trim(),
    });
  }

  @ApiOperation({ summary: 'Obtener estudiante por carnet' })
  @ApiOkResponse({ description: 'Estudiante obtenido exitosamente' })
  @ApiNotFoundResponse({ description: 'Estudiante no encontrado' })
  @ApiForbiddenResponse({
    description: 'Token requerido para consultar estudiante',
  })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(+id);
  }

  @ApiOperation({ summary: 'Actualizar estudiante' })
  @ApiOkResponse({ description: 'Estudiante actualizado exitosamente' })
  @ApiNotFoundResponse({ description: 'Estudiante no encontrado' })
  @ApiConflictResponse({
    description: 'Ya existe un estudiante con ese carnet',
  })
  @ApiForbiddenResponse({
    description: 'Solo ADMIN puede actualizar estudiantes',
  })
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentService.update(+id, updateStudentDto);
  }

  @ApiOperation({ summary: 'Eliminar estudiante' })
  @ApiOkResponse({ description: 'Estudiante eliminado exitosamente' })
  @ApiNotFoundResponse({ description: 'Estudiante no encontrado' })
  @ApiForbiddenResponse({
    description: 'Solo ADMIN puede eliminar estudiantes',
  })
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentService.remove(+id);
  }
}
