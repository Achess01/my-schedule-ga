import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PrismaService } from '../prisma/prisma.service';

interface FindAllStudentFilters {
  studentId?: number;
  search?: string;
}

@Injectable()
export class StudentService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createStudentDto: CreateStudentDto) {
    const existing = await this.prismaService.student.findUnique({
      where: { studentId: createStudentDto.studentId },
    });

    if (existing) {
      throw new ConflictException('Ya existe un estudiante con ese carnet');
    }

    return this.prismaService.student.create({
      data: {
        studentId: createStudentDto.studentId,
        entryDate: new Date(createStudentDto.entryDate),
        firstname: createStudentDto.firstname,
        lastname: createStudentDto.lastname,
      },
      include: {
        user: true,
      },
    });
  }

  findAll(filters?: FindAllStudentFilters) {
    const where: Prisma.StudentWhereInput = {};

    if (filters?.studentId !== undefined) {
      where.studentId = filters.studentId;
    }

    if (filters?.search) {
      where.OR = [
        {
          firstname: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          lastname: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return this.prismaService.student.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        user: {
          omit: { password: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const student = await this.prismaService.student.findUnique({
      where: { studentId: id },
      include: {
        user: {
          omit: { password: true },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(
        `El estudiante con el carnet ${id} no existe`,
      );
    }

    return student;
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    await this.ensureExists(id);

    return this.prismaService.student.update({
      where: { studentId: id },
      data: {
        ...(updateStudentDto.entryDate !== undefined
          ? { entryDate: new Date(updateStudentDto.entryDate) }
          : {}),
        ...(updateStudentDto.firstname !== undefined
          ? { firstname: updateStudentDto.firstname }
          : {}),
        ...(updateStudentDto.lastname !== undefined
          ? { lastname: updateStudentDto.lastname }
          : {}),
      },
      include: {
        user: true,
      },
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);

    return this.prismaService.student.delete({
      where: { studentId: id },
    });
  }

  private async ensureExists(id: number) {
    const student = await this.prismaService.student.findUnique({
      where: { studentId: id },
    });

    if (!student) {
      throw new NotFoundException(
        `El estudiante con el carnet ${id} no existe`,
      );
    }
  }
}
