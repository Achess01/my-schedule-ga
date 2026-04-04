import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateUserData,
  IUserRepository,
  User,
} from '../interfaces/user-repository.interface';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
      include: { role: true, student: true },
    });

    return user as User | null;
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: { role: true, student: true },
    });

    return user as User | null;
  }

  async create(data: CreateUserData): Promise<User> {
    const user = await this.prismaService.user.create({
      data: {
        email: data.email,
        password: data.password,
        firstname: data.firstname,
        lastname: data.lastname,
        role: { connect: { id: data.role.id } },
        ...(data.studentId !== undefined
          ? { student: { connect: { studentId: data.studentId } } }
          : {}),
      },
      include: { role: true, student: true },
    });

    return user as User;
  }
}
