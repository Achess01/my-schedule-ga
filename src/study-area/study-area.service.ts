import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStudyAreaDto } from './dto/create-study-area.dto';
import { UpdateStudyAreaDto } from './dto/update-study-area.dto';
import { PrismaService } from '../prisma/prisma.service';

interface FindAllStudyAreaFilters {
  name?: string;
}

@Injectable()
export class StudyAreaService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createStudyAreaDto: CreateStudyAreaDto) {
    const withSameName = await this.prismaService.studyArea.findUnique({
      where: { name: createStudyAreaDto.name },
    });

    if (withSameName) {
      throw new ConflictException(
        'Ya existe un área de estudio con este nombre',
      );
    }

    return this.prismaService.studyArea.create({ data: createStudyAreaDto });
  }

  findAll(filters?: FindAllStudyAreaFilters) {
    const where: { name?: { contains: string; mode: 'insensitive' } } = {};

    if (filters?.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    return this.prismaService.studyArea.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  async checkIfExists(id: number) {
    const studyArea = await this.prismaService.studyArea.findUnique({
      where: { id },
    });

    if (!studyArea) {
      throw new NotFoundException(
        `El área de estudio con el id ${id} no se encontró`,
      );
    }

    return studyArea;
  }

  async findOne(id: number) {
    const studyArea = await this.prismaService.studyArea.findUnique({
      where: { id },
    });

    if (!studyArea) {
      throw new NotFoundException(
        `El área de estudio con el id ${id} no se encontró`,
      );
    }

    return studyArea;
  }

  async update(id: number, updateStudyAreaDto: UpdateStudyAreaDto) {
    const studyArea = await this.checkIfExists(id);

    if (updateStudyAreaDto.name && studyArea.name !== updateStudyAreaDto.name) {
      const withSameName = await this.prismaService.studyArea.findUnique({
        where: { name: updateStudyAreaDto.name },
      });

      if (withSameName) {
        throw new ConflictException(
          'Ya existe un área de estudio con este nombre',
        );
      }
    }

    return this.prismaService.studyArea.update({
      where: { id },
      data: updateStudyAreaDto,
    });
  }

  async remove(id: number) {
    await this.checkIfExists(id);

    return this.prismaService.studyArea.delete({
      where: { id },
    });
  }
}
