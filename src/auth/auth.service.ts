import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type {
  IUserRepository,
  User,
} from '../user/interfaces/user-repository.interface';
import { USER_REPOSITORY } from '../user/interfaces/user-repository.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ access_token: string }> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este correo');
    }

    const role = await this.prismaService.role.findUnique({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role con el id ${dto.roleId} no encontrado`);
    }

    if (role.name === 'STUDENT' && (!dto.studentId || !dto.entryDate)) {
      throw new ConflictException(
        'studentId y entryDate son requeridos para usuarios con rol STUDENT',
      );
    }

    let studentId: number | undefined;

    if (role.name === 'STUDENT' && dto.studentId && dto.entryDate) {
      const existingStudent = await this.prismaService.student.findUnique({
        where: { studentId: dto.studentId },
      });

      const userWithStudent = await this.prismaService.user.findUnique({
        where: { studentId: dto.studentId },
      });

      if (userWithStudent) {
        throw new ConflictException(
          'Ya existe un usuario asociado a este estudiante',
        );
      }

      if (existingStudent) {
        await this.prismaService.student.update({
          where: { studentId: dto.studentId },
          data: {
            firstname: dto.firstname,
            lastname: dto.lastname,
            entryDate: new Date(dto.entryDate),
          },
        });
      } else {
        await this.prismaService.student.create({
          data: {
            studentId: dto.studentId,
            firstname: dto.firstname,
            lastname: dto.lastname,
            entryDate: new Date(dto.entryDate),
          },
        });
      }

      studentId = dto.studentId;
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    const user = await this.userRepository.create({
      firstname: dto.firstname,
      lastname: dto.lastname,
      role: role,
      email: dto.email,
      password: hashedPassword,
      ...(studentId !== undefined ? { studentId } : {}),
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };
    return { access_token: await this.jwtService.signAsync(payload) };
  }

  async login(dto: LoginDto): Promise<{
    access_token: string;
    user: Omit<User, 'password'>;
  }> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        student: user.student,
      },
    };
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const profile = { ...user, password: undefined };
    delete profile.password;

    return profile;
  }
}
