import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.service';
import { ClassSchedulesService } from '../class-schedules/class-schedules.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentScheduleDto } from './dto/create-student-schedule.dto';
import { UpdateStudentScheduleDto } from './dto/update-student-schedule.dto';

@Injectable()
export class StudentSchedulesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly classSchedulesService: ClassSchedulesService,
  ) {}

  async create(
    createStudentScheduleDto: CreateStudentScheduleDto,
    user: JwtPayload,
  ) {
    if (!user.studentId) {
      throw new UnauthorizedException('Usuario STUDENT sin studentId en token');
    }

    const uniqueCourseCodes = this.ensureNoDuplicateCourseCodes(
      createStudentScheduleDto.courseCodes,
    );

    const studentPensum = await this.prismaService.studentPensum.findUnique({
      where: { studentPensumId: createStudentScheduleDto.studentPensumId },
    });

    if (!studentPensum) {
      throw new NotFoundException(
        `El studentPensum con id ${createStudentScheduleDto.studentPensumId} no existe`,
      );
    }

    if (studentPensum.studentId !== user.studentId) {
      throw new UnauthorizedException(
        'El studentPensum no pertenece al estudiante autenticado',
      );
    }

    const generatedSchedule = await this.classSchedulesService.findOne(
      createStudentScheduleDto.scheduleId,
    );

    this.validateCoursesAreInSchedule(
      uniqueCourseCodes,
      generatedSchedule.items,
    );

    const pensumCourses = await this.prismaService.pensumCourse.findMany({
      where: {
        pensumId: studentPensum.pensumId,
        courseCode: { in: uniqueCourseCodes },
      },
      include: {
        prerequisites: {
          select: {
            prerequisiteId: true,
          },
        },
      },
    });

    this.validateCoursesAreInPensum(uniqueCourseCodes, pensumCourses);

    const approvedGrades = await this.prismaService.studentGrade.findMany({
      where: {
        studentPensumId: studentPensum.studentPensumId,
        isApproved: true,
      },
      include: {
        pensumCourse: {
          select: {
            pensumCourseId: true,
            courseCode: true,
            credits: true,
          },
        },
      },
    });

    this.validateCoursesAreNotApproved(uniqueCourseCodes, approvedGrades);

    this.validateCourseAvailabilityByPrerequisitesAndCredits(
      pensumCourses,
      approvedGrades,
    );

    return {
      scheduleId: createStudentScheduleDto.scheduleId,
      studentPensumId: createStudentScheduleDto.studentPensumId,
      selectedCourseCodes: uniqueCourseCodes,
      message:
        'Validaciones completadas correctamente. Listo para ejecutar el algoritmo genetico.',
    };
  }

  findAll() {
    return `This action returns all studentSchedules`;
  }

  findOne(id: number) {
    return `This action returns a #${id} studentSchedule`;
  }

  update(id: number, updateStudentScheduleDto: UpdateStudentScheduleDto) {
    return `This action updates a #${id} studentSchedule`;
  }

  remove(id: number) {
    return `This action removes a #${id} studentSchedule`;
  }

  private ensureNoDuplicateCourseCodes(courseCodes: number[]) {
    const uniqueCourseCodes = Array.from(new Set(courseCodes));

    if (uniqueCourseCodes.length !== courseCodes.length) {
      throw new ConflictException('No se permiten codigos de curso duplicados');
    }

    return uniqueCourseCodes;
  }

  private validateCoursesAreInSchedule(
    selectedCourseCodes: number[],
    generatedScheduleItems: { courseCode: number }[],
  ) {
    const availableCourseCodesInSchedule = new Set(
      generatedScheduleItems.map((item) => item.courseCode),
    );

    const missingCourseCodes = selectedCourseCodes.filter(
      (courseCode) => !availableCourseCodesInSchedule.has(courseCode),
    );

    if (missingCourseCodes.length > 0) {
      throw new ConflictException(
        `Los siguientes cursos no están en el horario seleccionado: ${missingCourseCodes.join(', ')}`,
      );
    }
  }

  private validateCoursesAreInPensum(
    selectedCourseCodes: number[],
    pensumCourses: { courseCode: number }[],
  ) {
    const availableCourseCodesInPensum = new Set(
      pensumCourses.map((course) => course.courseCode),
    );

    const missingCourseCodes = selectedCourseCodes.filter(
      (courseCode) => !availableCourseCodesInPensum.has(courseCode),
    );

    if (missingCourseCodes.length > 0) {
      throw new ConflictException(
        `Los siguientes cursos no pertenecen al pensum del estudiante: ${missingCourseCodes.join(', ')}`,
      );
    }
  }

  private validateCoursesAreNotApproved(
    selectedCourseCodes: number[],
    approvedGrades: { pensumCourse: { courseCode: number } }[],
  ) {
    const approvedCourseCodes = new Set(
      approvedGrades.map((grade) => grade.pensumCourse.courseCode),
    );

    const alreadyApprovedCourseCodes = selectedCourseCodes.filter(
      (courseCode) => approvedCourseCodes.has(courseCode),
    );

    if (alreadyApprovedCourseCodes.length > 0) {
      throw new ConflictException(
        `Los siguientes cursos ya fueron aprobados: ${alreadyApprovedCourseCodes.join(', ')}`,
      );
    }
  }

  private validateCourseAvailabilityByPrerequisitesAndCredits(
    pensumCourses: {
      pensumCourseId: number;
      courseCode: number;
      requiredCreds: number;
      prerequisites: { prerequisiteId: number }[];
    }[],
    approvedGrades: {
      pensumCourse: { pensumCourseId: number; credits: number };
    }[],
  ) {
    const approvedPensumCourseIds = new Set(
      approvedGrades.map((grade) => grade.pensumCourse.pensumCourseId),
    );

    const approvedCreditsByCourse = new Map<number, number>();
    for (const grade of approvedGrades) {
      approvedCreditsByCourse.set(
        grade.pensumCourse.pensumCourseId,
        grade.pensumCourse.credits,
      );
    }

    const approvedCredits = Array.from(approvedCreditsByCourse.values()).reduce(
      (sum, credits) => sum + credits,
      0,
    );

    for (const pensumCourse of pensumCourses) {
      const missingPrerequisites = pensumCourse.prerequisites
        .map((prerequisite) => prerequisite.prerequisiteId)
        .filter(
          (prerequisiteId) => !approvedPensumCourseIds.has(prerequisiteId),
        );

      if (missingPrerequisites.length > 0) {
        throw new ConflictException(
          `No se puede incluir el curso ${pensumCourse.courseCode} porque no tiene todos los prerrequisitos aprobados`,
        );
      }

      if (
        pensumCourse.requiredCreds > 0 &&
        approvedCredits < pensumCourse.requiredCreds
      ) {
        throw new ConflictException(
          `No se puede incluir el curso ${pensumCourse.courseCode} porque no cumple con los creditos requeridos`,
        );
      }
    }
  }
}
