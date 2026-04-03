import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PrismaService } from '../prisma/prisma.service';

interface FindAllCoursesFilters {
  code?: number;
  name?: string;
}

@Injectable()
export class CourseService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createCourseDto: CreateCourseDto) {
    const withSameNameOrCode = await this.prismaService.course.findFirst({
      where: {
        OR: [
          { name: createCourseDto.name },
          { courseCode: createCourseDto.courseCode },
        ],
      },
    });

    if (
      withSameNameOrCode &&
      withSameNameOrCode.courseCode === createCourseDto.courseCode
    ) {
      throw new ConflictException('Ya existe un curso con este código');
    }

    if (
      withSameNameOrCode &&
      withSameNameOrCode.name === createCourseDto.name
    ) {
      throw new ConflictException('Ya existe un curso con este nombre');
    }

    return this.prismaService.course.create({ data: createCourseDto });
  }

  findAll(filters?: FindAllCoursesFilters) {
    const where: {
      courseCode?: number;
      name?: { contains: string; mode: 'insensitive' };
    } = {};

    if (filters?.code !== undefined && Number.isFinite(filters.code)) {
      where.courseCode = filters.code;
    }

    if (filters?.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    return this.prismaService.course.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  async checkIfExists(id: number) {
    const course = await this.prismaService.course.findUnique({
      where: { courseCode: id },
    });

    if (!course) {
      throw new NotFoundException(
        `El curso con el codigo ${id} no se encontro`,
      );
    }

    return course;
  }

  async findOne(id: number) {
    const course = await this.prismaService.course.findUnique({
      where: { courseCode: id },
    });

    if (!course) {
      throw new NotFoundException(
        `El curso con el código ${id} no se encontró`,
      );
    }

    return course;
  }

  async update(id: number, updateCourseDto: UpdateCourseDto) {
    const course = await this.checkIfExists(id);

    if (course.name !== updateCourseDto.name) {
      const withSameName = await this.prismaService.course.findUnique({
        where: { name: updateCourseDto.name },
      });

      if (withSameName) {
        throw new ConflictException('Ya existe un curso con este nombre');
      }
    }

    return this.prismaService.course.update({
      where: { courseCode: id },
      data: updateCourseDto,
    });
  }

  async remove(id: number) {
    await this.checkIfExists(id);

    return this.prismaService.course.delete({
      where: { courseCode: id },
    });
  }
}
