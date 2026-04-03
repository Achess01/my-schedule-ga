import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePensumCoursePrerequisiteDto } from './dto/create-pensum-course-prerequisite.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PensumCoursePrerequisiteService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    createPensumCoursePrerequisiteDto: CreatePensumCoursePrerequisiteDto,
  ) {
    const { pensumCourseId, prerequisiteId } =
      createPensumCoursePrerequisiteDto;

    if (pensumCourseId === prerequisiteId) {
      throw new ConflictException(
        'Un pensum-curso no puede ser prerrequisito de si mismo',
      );
    }

    const postRequisite = await this.ensurePensumCourseExists(pensumCourseId);
    const prerequisite = await this.ensurePensumCourseExists(prerequisiteId);

    if (prerequisite.semester >= postRequisite.semester) {
      throw new ConflictException(
        'El prerrequisito debe pertenecer a un semestre menor que el curso postrequisito',
      );
    }

    const reciprocal =
      await this.prismaService.pensumCoursePrerequisite.findUnique({
        where: {
          pensumCourseId_prerequisiteId: {
            pensumCourseId: prerequisiteId,
            prerequisiteId: pensumCourseId,
          },
        },
      });

    if (reciprocal) {
      throw new ConflictException(
        'Dos pensum-curso no pueden ser prerrequisito entre si',
      );
    }

    const existing =
      await this.prismaService.pensumCoursePrerequisite.findUnique({
        where: {
          pensumCourseId_prerequisiteId: {
            pensumCourseId,
            prerequisiteId,
          },
        },
      });

    if (existing) {
      throw new ConflictException('La relacion de prerrequisito ya existe');
    }

    return this.prismaService.pensumCoursePrerequisite.create({
      data: {
        pensumCourse: { connect: { pensumCourseId } },
        prerequisite: { connect: { pensumCourseId: prerequisiteId } },
      },
    });
  }

  async remove(pensumCourseId: number, prerequisiteId: number) {
    await this.ensureRelationExists(pensumCourseId, prerequisiteId);

    return this.prismaService.pensumCoursePrerequisite.delete({
      where: {
        pensumCourseId_prerequisiteId: {
          pensumCourseId,
          prerequisiteId,
        },
      },
    });
  }

  private async ensurePensumCourseExists(pensumCourseId: number) {
    const pensumCourse = await this.prismaService.pensumCourse.findUnique({
      where: { pensumCourseId },
    });

    if (!pensumCourse) {
      throw new NotFoundException(
        `El pensum-curso con el id ${pensumCourseId} no se encontro`,
      );
    }

    return pensumCourse;
  }

  private async ensureRelationExists(
    pensumCourseId: number,
    prerequisiteId: number,
  ) {
    const relation =
      await this.prismaService.pensumCoursePrerequisite.findUnique({
        where: {
          pensumCourseId_prerequisiteId: {
            pensumCourseId,
            prerequisiteId,
          },
        },
      });

    if (!relation) {
      throw new NotFoundException(
        'La relacion de prerrequisito indicada no se encontro',
      );
    }
  }
}
