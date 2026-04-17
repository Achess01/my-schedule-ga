import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import type { JwtPayload } from '../auth/auth.service';
import { CreateStudentPensumDto } from './dto/create-student-pensum.dto';
import { PrismaService } from '../prisma/prisma.service';

interface FindAllStudentPensumFilters {
  studentId?: number;
  pensumId?: number;
}

@Injectable()
export class StudentPensumService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createStudentPensumDto: CreateStudentPensumDto) {
    await this.ensureStudentExists(createStudentPensumDto.studentId);
    await this.ensurePensumExists(createStudentPensumDto.pensumId);

    const existing = await this.prismaService.studentPensum.findUnique({
      where: {
        studentId_pensumId: {
          studentId: createStudentPensumDto.studentId,
          pensumId: createStudentPensumDto.pensumId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'El estudiante ya esta registrado en este pensum',
      );
    }

    return this.prismaService.studentPensum.create({
      data: {
        student: { connect: { studentId: createStudentPensumDto.studentId } },
        pensum: { connect: { pensumId: createStudentPensumDto.pensumId } },
      },
      include: {
        student: true,
        pensum: true,
      },
    });
  }

  findAll(filters: FindAllStudentPensumFilters, user: JwtPayload) {
    const where: Prisma.StudentPensumWhereInput = {};

    if (filters.pensumId !== undefined) {
      where.pensumId = filters.pensumId;
    }

    if (user.role === 'STUDENT') {
      if (!user.studentId) {
        throw new UnauthorizedException(
          'Usuario STUDENT sin studentId en token',
        );
      }
      where.studentId = user.studentId;
    } else if (filters.studentId !== undefined) {
      where.studentId = filters.studentId;
    }

    return this.prismaService.studentPensum.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        student: true,
        pensum: true,
      },
    });
  }

  async findOne(id: number, user: JwtPayload) {
    const studentPensum = await this.prismaService.studentPensum.findUnique({
      where: { studentPensumId: id },
      include: {
        student: true,
        pensum: true,
      },
    });

    if (!studentPensum) {
      throw new NotFoundException(
        `El registro estudiante-pensum con id ${id} no existe`,
      );
    }

    if (user.role === 'STUDENT') {
      if (!user.studentId) {
        throw new UnauthorizedException(
          'Usuario STUDENT sin studentId en token',
        );
      }

      if (studentPensum.studentId !== user.studentId) {
        throw new UnauthorizedException(
          'No autorizado para acceder a este registro',
        );
      }
    }

    return studentPensum;
  }

  async remove(id: number) {
    await this.ensureExists(id);

    return this.prismaService.studentPensum.delete({
      where: { studentPensumId: id },
    });
  }

  async findAssignableCourses(
    studentId: number,
    pensumId: number,
    user: JwtPayload,
  ) {
    if (user.role === 'STUDENT') {
      if (!user.studentId) {
        throw new UnauthorizedException(
          'Usuario STUDENT sin studentId en token',
        );
      }

      if (studentId !== user.studentId) {
        throw new ForbiddenException(
          'No autorizado para consultar cursos asignables de otro estudiante',
        );
      }
    }

    if (!studentId) {
      throw new BadRequestException('Debe enviar un studentId valido');
    }

    await this.ensureStudentExists(studentId);
    await this.ensurePensumExists(pensumId);

    const studentPensum = await this.prismaService.studentPensum.findUnique({
      where: {
        studentId_pensumId: {
          studentId,
          pensumId,
        },
      },
      include: {
        student: true,
        pensum: true,
      },
    });

    if (!studentPensum) {
      throw new NotFoundException(
        'El estudiante no está registrado en el pensum indicado',
      );
    }

    const approvedGrades = await this.prismaService.studentGrade.findMany({
      where: {
        studentPensumId: studentPensum.studentPensumId,
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

    const approvedPensumCourseIds = new Set<number>();
    const approvedCreditsByPensumCourseId = new Map<number, number>();

    for (const grade of approvedGrades) {
      approvedPensumCourseIds.add(grade.pensumCourse.pensumCourseId);
      approvedCreditsByPensumCourseId.set(
        grade.pensumCourse.pensumCourseId,
        grade.pensumCourse.credits,
      );
    }

    const approvedCredits = Array.from(
      approvedCreditsByPensumCourseId.values(),
    ).reduce((sum, credits) => sum + credits, 0);

    const pensumCourses = await this.prismaService.pensumCourse.findMany({
      where: { pensumId },
      include: {
        course: true,
        studyArea: true,
        prerequisites: {
          select: {
            prerequisiteId: true,
          },
        },
      },
    });

    const assignableCourses = pensumCourses.filter((pensumCourse) => {
      if (approvedPensumCourseIds.has(pensumCourse.pensumCourseId)) {
        return false;
      }

      const hasAllPrerequisites = pensumCourse.prerequisites.every(
        (prerequisite) =>
          approvedPensumCourseIds.has(prerequisite.prerequisiteId),
      );

      if (!hasAllPrerequisites) {
        return false;
      }

      return approvedCredits >= pensumCourse.requiredCreds;
    });

    return {
      studentPensumId: studentPensum.studentPensumId,
      studentId: studentPensum.studentId,
      pensumId: studentPensum.pensumId,
      approvedCredits,
      assignableCourses,
    };
  }

  private async ensureExists(id: number) {
    const studentPensum = await this.prismaService.studentPensum.findUnique({
      where: { studentPensumId: id },
    });

    if (!studentPensum) {
      throw new NotFoundException(
        `El registro estudiante-pensum con id ${id} no existe`,
      );
    }
  }

  private async ensureStudentExists(studentId: number) {
    const student = await this.prismaService.student.findUnique({
      where: { studentId },
    });

    if (!student) {
      throw new NotFoundException(
        `El estudiante con id ${studentId} no existe`,
      );
    }
  }

  private async ensurePensumExists(pensumId: number) {
    const pensum = await this.prismaService.pensum.findUnique({
      where: { pensumId },
    });

    if (!pensum) {
      throw new NotFoundException(`El pensum con id ${pensumId} no existe`);
    }
  }
}
