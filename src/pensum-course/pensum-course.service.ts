import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePensumCourseDto } from './dto/create-pensum-course.dto';
import { UpdatePensumCourseDto } from './dto/update-pensum-course.dto';
import { PrismaService } from '../prisma/prisma.service';

interface FindAllPensumCourseFilters {
  pensumId: number;
  courseName?: string;
}

@Injectable()
export class PensumCourseService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createPensumCourseDto: CreatePensumCourseDto) {
    const existing = await this.prismaService.pensumCourse.findFirst({
      where: {
        pensumId: createPensumCourseDto.pensumId,
        courseCode: createPensumCourseDto.courseCode,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe una relacion de curso para este pensum con ese curso',
      );
    }

    await this.ensurePensumExists(createPensumCourseDto.pensumId);
    await this.ensureCourseExists(createPensumCourseDto.courseCode);
    await this.ensureStudyAreaExists(createPensumCourseDto.studyAreaId);

    return this.prismaService.pensumCourse.create({
      data: {
        credits: createPensumCourseDto.credits,
        requiredCreds: createPensumCourseDto.requiredCreds,
        isMandatory: createPensumCourseDto.isMandatory,
        semester: createPensumCourseDto.semester,
        pensum: {
          connect: { pensumId: createPensumCourseDto.pensumId },
        },
        course: {
          connect: { courseCode: createPensumCourseDto.courseCode },
        },
        studyArea: {
          connect: { id: createPensumCourseDto.studyAreaId },
        },
      },
    });
  }

  findAll(filters: FindAllPensumCourseFilters) {
    return this.prismaService.pensumCourse.findMany({
      where: {
        pensumId: filters.pensumId,
        ...(filters.courseName
          ? {
              course: {
                name: {
                  contains: filters.courseName,
                  mode: 'insensitive',
                },
              },
            }
          : {}),
      },
      include: {
        course: true,
        pensum: true,
        studyArea: true,
        prerequisites: {
          include: {
            prerequisite: {
              include: {
                course: true,
              },
            },
          },
        },
        postrequisites: {
          include: {
            pensumCourse: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });
  }

  // TODO: Check how to return the pensumCourse in pre and post requisites
  async findOne(id: number) {
    const pensumCourse = await this.prismaService.pensumCourse.findUnique({
      where: { pensumCourseId: id },
      include: {
        course: true,
        pensum: true,
        studyArea: true,
        prerequisites: {
          include: {
            prerequisite: {
              include: {
                course: true,
              },
            },
          },
        },
        postrequisites: {
          include: {
            pensumCourse: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!pensumCourse) {
      throw new NotFoundException(
        `El pensum-curso con el id ${id} no se encontró`,
      );
    }

    return pensumCourse;
  }

  async update(id: number, updatePensumCourseDto: UpdatePensumCourseDto) {
    await this.checkIfExists(id);

    if (updatePensumCourseDto.studyAreaId !== undefined) {
      await this.ensureStudyAreaExists(updatePensumCourseDto.studyAreaId);
    }

    return this.prismaService.pensumCourse.update({
      where: { pensumCourseId: id },
      data: {
        ...(updatePensumCourseDto.credits !== undefined
          ? { credits: updatePensumCourseDto.credits }
          : {}),
        ...(updatePensumCourseDto.requiredCreds !== undefined
          ? { requiredCreds: updatePensumCourseDto.requiredCreds }
          : {}),
        ...(updatePensumCourseDto.isMandatory !== undefined
          ? { isMandatory: updatePensumCourseDto.isMandatory }
          : {}),
        ...(updatePensumCourseDto.studyAreaId !== undefined
          ? {
              studyArea: { connect: { id: updatePensumCourseDto.studyAreaId } },
            }
          : {}),
      },
    });
  }

  async remove(id: number) {
    await this.checkIfExists(id);

    return this.prismaService.pensumCourse.delete({
      where: { pensumCourseId: id },
    });
  }

  private async checkIfExists(id: number) {
    const pensumCourse = await this.prismaService.pensumCourse.findUnique({
      where: { pensumCourseId: id },
    });

    if (!pensumCourse) {
      throw new NotFoundException(
        `El pensum-curso con el id ${id} no se encontro`,
      );
    }
  }

  private async ensurePensumExists(pensumId: number) {
    const pensum = await this.prismaService.pensum.findUnique({
      where: { pensumId },
    });

    if (!pensum) {
      throw new NotFoundException(
        `El pensum con el id ${pensumId} no se encontro`,
      );
    }
  }

  private async ensureCourseExists(courseCode: number) {
    const course = await this.prismaService.course.findUnique({
      where: { courseCode },
    });

    if (!course) {
      throw new NotFoundException(
        `El curso con el código ${courseCode} no se encontró`,
      );
    }
  }

  private async ensureStudyAreaExists(studyAreaId: number) {
    const studyArea = await this.prismaService.studyArea.findUnique({
      where: { id: studyAreaId },
    });

    if (!studyArea) {
      throw new NotFoundException(
        `El area de estudio con el id ${studyAreaId} no se encontro`,
      );
    }
  }
}
