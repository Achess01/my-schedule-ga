import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { StudentSchedulesService } from './student-schedules.service';
import { CreateStudentScheduleDto } from './dto/create-student-schedule.dto';
import { UpdateStudentScheduleDto } from './dto/update-student-schedule.dto';

@ApiTags('student-schedules')
@ApiBearerAuth()
@Controller('student-schedules')
export class StudentSchedulesController {
  constructor(
    private readonly studentSchedulesService: StudentSchedulesService,
  ) {}

  @ApiOperation({ summary: 'Validar cursos para generar horario personal' })
  @ApiCreatedResponse({ description: 'Validaciones completadas correctamente' })
  @ApiNotFoundResponse({
    description: 'Horario general o studentPensum no encontrado',
  })
  @ApiConflictResponse({
    description: 'Reglas académicas o de cursos incumplidas',
  })
  @ApiForbiddenResponse({
    description: 'Solo STUDENT puede generar horario personal',
  })
  @Roles('STUDENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  create(
    @Body() createStudentScheduleDto: CreateStudentScheduleDto,
    @Req() req: Request,
  ) {
    const user = req['user'] as JwtPayload;
    return this.studentSchedulesService.create(createStudentScheduleDto, user);
  }

  @Get()
  findAll() {
    return this.studentSchedulesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentSchedulesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStudentScheduleDto: UpdateStudentScheduleDto,
  ) {
    return this.studentSchedulesService.update(+id, updateStudentScheduleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentSchedulesService.remove(+id);
  }
}
