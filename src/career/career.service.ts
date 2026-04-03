import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCareerDto } from './dto/create-career.dto';
import { UpdateCareerDto } from './dto/update-career.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CareerService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createCareerDto: CreateCareerDto) {
    const withSameName = await this.prismaService.career.findUnique({
      where: { name: createCareerDto.name },
    });

    if (withSameName) {
      throw new ConflictException('Ya existe una carrera con este nombre');
    }

    return this.prismaService.career.create({ data: createCareerDto });
  }

  findAll() {
    return this.prismaService.career.findMany();
  }

  async checkIfExists(id: number) {
    const career = await this.prismaService.career.findUnique({
      where: { careerId: id },
    });

    if (!career) {
      throw new NotFoundException(`La carrera con el id ${id} no se encontró`);
    }
  }

  async findOne(id: number) {
    const career = await this.prismaService.career.findUnique({
      where: { careerId: id },
    });

    if (!career) {
      throw new NotFoundException(`La carrera con el id ${id} no se encontró`);
    }

    return career;
  }

  async update(id: number, updateCareerDto: UpdateCareerDto) {
    await this.checkIfExists(id);
    return this.prismaService.career.update({
      where: { careerId: id },
      data: updateCareerDto,
    });
  }

  async remove(id: number) {
    await this.checkIfExists(id);

    return this.prismaService.career.delete({
      where: { careerId: id },
    });
  }
}
