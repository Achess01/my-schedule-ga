import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GradeType } from '../generated/prisma/enums';
import { Prisma } from '../generated/prisma/client';
import type { JwtPayload } from '../auth/auth.service';
import { CreateStudentGradeDto } from './dto/create-student-grade.dto';
import { UpdateStudentGradeDto } from './dto/update-student-grade.dto';
import { PrismaService } from '../prisma/prisma.service';

interface FindAllStudentGradeFilters {
  studentId?: number;
  pensumId?: number;
  isApproved?: boolean;
}

const SEMESTER_TYPES: GradeType[] = [
  GradeType.FIRST_SEMESTER,
  GradeType.SECOND_SEMESTER,
];
const VACATION_TYPES: GradeType[] = [
  GradeType.VACATIONS_JUNE,
  GradeType.VACATIONS_DECEMBER,
];

const GRADE_TYPE_DESCRIPTIONS: Record<GradeType, string> = {
  FIRST_SEMESTER: 'Primer Semestre',
  SECOND_SEMESTER: 'Segundo Semestre',
  VACATIONS_JUNE: 'EDV Junio',
  VACATIONS_DECEMBER: 'EDV Diciembre',
};

@Injectable()
export class StudentGradeService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createStudentGradeDto: CreateStudentGradeDto) {
    await this.ensureLinksAreValid(
      createStudentGradeDto.studentPensumId,
      createStudentGradeDto.pensumCourseId,
    );

    await this.validatePrerequisitesAndRequiredCredits(
      createStudentGradeDto.studentPensumId,
      createStudentGradeDto.pensumCourseId,
    );

    await this.validateAttemptsConstraints(
      createStudentGradeDto.studentPensumId,
      createStudentGradeDto.pensumCourseId,
      createStudentGradeDto.gradeType,
    );

    return this.prismaService.studentGrade.create({
      data: {
        studentPensum: {
          connect: { studentPensumId: createStudentGradeDto.studentPensumId },
        },
        pensumCourse: {
          connect: { pensumCourseId: createStudentGradeDto.pensumCourseId },
        },
        isApproved: createStudentGradeDto.isApproved,
        gradeType: createStudentGradeDto.gradeType,
        grade: createStudentGradeDto.grade,
      },
    });
  }

  findAll(filters: FindAllStudentGradeFilters, user: JwtPayload) {
    const where: Prisma.StudentGradeWhereInput = {};
    const studentPensumFilter: Prisma.StudentPensumWhereInput = {};

    if (filters.pensumId !== undefined) {
      studentPensumFilter.pensumId = filters.pensumId;
    }

    if (filters.isApproved !== undefined) {
      where.isApproved = filters.isApproved;
    }

    if (user.role === 'STUDENT') {
      if (!user.studentId) {
        throw new UnauthorizedException(
          'Usuario STUDENT sin studentId en token',
        );
      }

      studentPensumFilter.studentId = user.studentId;
    } else if (filters.studentId !== undefined) {
      studentPensumFilter.studentId = filters.studentId;
    }

    if (Object.keys(studentPensumFilter).length > 0) {
      where.studentPensum = { is: studentPensumFilter };
    }

    return this.prismaService.studentGrade.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        studentPensum: {
          include: {
            student: true,
            pensum: true,
          },
        },
        pensumCourse: {
          include: {
            course: true,
          },
        },
      },
    });
  }

  async findOne(id: number, user: JwtPayload) {
    const studentGrade = await this.prismaService.studentGrade.findUnique({
      where: { studentGradeId: id },
      include: {
        studentPensum: {
          include: {
            student: true,
            pensum: true,
          },
        },
        pensumCourse: true,
      },
    });

    if (!studentGrade) {
      throw new NotFoundException(`La nota con id ${id} no existe`);
    }

    if (user.role === 'STUDENT') {
      if (!user.studentId) {
        throw new UnauthorizedException(
          'Usuario STUDENT sin studentId en token',
        );
      }

      if (studentGrade.studentPensum.studentId !== user.studentId) {
        throw new ForbiddenException('No autorizado para acceder a esta nota');
      }
    }

    return studentGrade;
  }

  async update(id: number, updateStudentGradeDto: UpdateStudentGradeDto) {
    const current = await this.ensureExists(id);

    await this.validateAttemptsConstraints(
      current.studentPensumId,
      current.pensumCourseId,
      updateStudentGradeDto.gradeType,
      id,
    );

    return this.prismaService.studentGrade.update({
      where: { studentGradeId: id },
      data: {
        isApproved: updateStudentGradeDto.isApproved,
        gradeType: updateStudentGradeDto.gradeType,
        grade: updateStudentGradeDto.grade,
      },
      include: {
        studentPensum: {
          include: {
            student: true,
            pensum: true,
          },
        },
        pensumCourse: true,
      },
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);

    return this.prismaService.studentGrade.delete({
      where: { studentGradeId: id },
    });
  }

  getGradeTypes() {
    return Object.values(GradeType).map((gradeType) => ({
      id: gradeType,
      description: GRADE_TYPE_DESCRIPTIONS[gradeType],
    }));
  }

  private async ensureExists(id: number) {
    const studentGrade = await this.prismaService.studentGrade.findUnique({
      where: { studentGradeId: id },
    });

    if (!studentGrade) {
      throw new NotFoundException(`La nota con id ${id} no existe`);
    }

    return studentGrade;
  }

  private async ensureLinksAreValid(
    studentPensumId: number,
    pensumCourseId: number,
  ) {
    const studentPensum = await this.prismaService.studentPensum.findUnique({
      where: { studentPensumId },
    });

    if (!studentPensum) {
      throw new NotFoundException(
        `El studentPensum con id ${studentPensumId} no existe`,
      );
    }

    const pensumCourse = await this.prismaService.pensumCourse.findUnique({
      where: { pensumCourseId },
    });

    if (!pensumCourse) {
      throw new NotFoundException(
        `El pensumCourse con id ${pensumCourseId} no existe`,
      );
    }

    if (studentPensum.pensumId !== pensumCourse.pensumId) {
      throw new ConflictException(
        'El pensumCourse no pertenece al pensum del studentPensum indicado',
      );
    }
  }

  private async validateAttemptsConstraints(
    studentPensumId: number,
    pensumCourseId: number,
    incomingGradeType: GradeType,
    excludeStudentGradeId?: number,
  ) {
    const where: Prisma.StudentGradeWhereInput = {
      studentPensumId,
      pensumCourseId,
      ...(excludeStudentGradeId !== undefined
        ? { NOT: { studentGradeId: excludeStudentGradeId } }
        : {}),
    };

    const existingGrades = await this.prismaService.studentGrade.findMany({
      where,
    });

    const alreadyApproved = existingGrades.some((grade) => grade.isApproved);
    if (alreadyApproved) {
      throw new ConflictException(
        'No se puede registrar la nota porque ya existe un registro aprobado',
      );
    }

    if (existingGrades.length >= 6) {
      throw new ConflictException(
        'No se puede registrar la nota porque ya existen 6 intentos',
      );
    }

    const semesterCount = existingGrades.filter((grade) =>
      SEMESTER_TYPES.includes(grade.gradeType),
    ).length;

    const vacationCount = existingGrades.filter((grade) =>
      VACATION_TYPES.includes(grade.gradeType),
    ).length;

    if (SEMESTER_TYPES.includes(incomingGradeType) && semesterCount >= 3) {
      throw new ConflictException(
        'No se puede registrar mas de 3 notas de tipo semestral',
      );
    }

    if (VACATION_TYPES.includes(incomingGradeType) && vacationCount >= 3) {
      throw new ConflictException(
        'No se puede registrar mas de 3 notas de tipo vacacional',
      );
    }
  }

  private async validatePrerequisitesAndRequiredCredits(
    studentPensumId: number,
    pensumCourseId: number,
  ) {
    const targetPensumCourse = await this.prismaService.pensumCourse.findUnique(
      {
        where: { pensumCourseId },
        include: {
          prerequisites: {
            select: {
              prerequisiteId: true,
            },
          },
        },
      },
    );

    if (!targetPensumCourse) {
      throw new NotFoundException(
        `El pensumCourse con id ${pensumCourseId} no existe`,
      );
    }

    const prerequisiteIds = targetPensumCourse.prerequisites.map(
      (prerequisite) => prerequisite.prerequisiteId,
    );

    if (prerequisiteIds.length > 0) {
      const approvedPrerequisites =
        await this.prismaService.studentGrade.findMany({
          where: {
            studentPensumId,
            isApproved: true,
            pensumCourseId: { in: prerequisiteIds },
          },
          select: {
            pensumCourseId: true,
          },
        });

      const approvedPrerequisiteIds = new Set(
        approvedPrerequisites.map((grade) => grade.pensumCourseId),
      );

      const hasAllPrerequisites = prerequisiteIds.every((prerequisiteId) =>
        approvedPrerequisiteIds.has(prerequisiteId),
      );

      if (!hasAllPrerequisites) {
        throw new ConflictException(
          'No se puede registrar la nota porque no tiene todos los prerrequisitos aprobados',
        );
      }
    }

    if (targetPensumCourse.requiredCreds > 0) {
      const approvedGrades = await this.prismaService.studentGrade.findMany({
        where: {
          studentPensumId,
          isApproved: true,
        },
        include: {
          pensumCourse: {
            select: {
              pensumCourseId: true,
              credits: true,
            },
          },
        },
      });

      const approvedCreditsByCourse = new Map<number, number>();

      for (const grade of approvedGrades) {
        approvedCreditsByCourse.set(
          grade.pensumCourse.pensumCourseId,
          grade.pensumCourse.credits,
        );
      }

      const approvedCredits = Array.from(
        approvedCreditsByCourse.values(),
      ).reduce((sum, credits) => sum + credits, 0);

      if (approvedCredits < targetPensumCourse.requiredCreds) {
        throw new ConflictException(
          'No se puede registrar la nota porque no cumple con los creditos requeridos',
        );
      }
    }
  }
}
