import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePensumDto } from './dto/create-pensum.dto';
import { UpdatePensumDto } from './dto/update-pensum.dto';
import { PrismaService } from '../prisma/prisma.service';

interface FindAllPensumFilters {
  name?: string;
}

@Injectable()
export class PensumService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createPensumDto: CreatePensumDto) {
    const withSameName = await this.prismaService.pensum.findUnique({
      where: { name: createPensumDto.name },
    });

    if (withSameName) {
      throw new ConflictException('Ya existe un pensum con este nombre');
    }

    const career = await this.prismaService.career.findUnique({
      where: { careerId: createPensumDto.careerId },
    });

    if (!career) {
      throw new NotFoundException(
        `La carrera con el id ${createPensumDto.careerId} no se encontró`,
      );
    }

    return this.prismaService.pensum.create({
      data: {
        name: createPensumDto.name,
        creditsNeeded: createPensumDto.creditsNeeded,
        career: {
          connect: { careerId: createPensumDto.careerId },
        },
      },
    });
  }

  findAll(filters?: FindAllPensumFilters) {
    const where: { name?: { contains: string; mode: 'insensitive' } } = {};

    if (filters?.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    return this.prismaService.pensum.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  async checkIfExists(id: number) {
    const pensum = await this.prismaService.pensum.findUnique({
      where: { pensumId: id },
    });

    if (!pensum) {
      throw new NotFoundException(`El pensum con el id ${id} no se encontro`);
    }

    return pensum;
  }

  async findOne(id: number) {
    const pensum = await this.prismaService.pensum.findUnique({
      where: { pensumId: id },
    });

    if (!pensum) {
      throw new NotFoundException(`El pensum con el id ${id} no se encontró`);
    }

    return pensum;
  }

  async update(id: number, updatePensumDto: UpdatePensumDto) {
    const pensum = await this.checkIfExists(id);

    if (pensum.name !== updatePensumDto.name) {
      const withSameName = await this.prismaService.pensum.findUnique({
        where: { name: updatePensumDto.name },
      });

      if (withSameName) {
        throw new ConflictException('Ya existe un pensum con este nombre');
      }
    }

    return this.prismaService.pensum.update({
      where: { pensumId: id },
      data: {
        name: updatePensumDto.name,
        creditsNeeded: updatePensumDto.creditsNeeded,
      },
    });
  }

  async remove(id: number) {
    await this.checkIfExists(id);

    return this.prismaService.pensum.delete({
      where: { pensumId: id },
    });
  }
}
