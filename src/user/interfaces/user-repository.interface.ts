export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface User {
  id: number;
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  role: Role;
  studentId?: number | null;
  student?: {
    studentId: number;
    entryDate: Date;
    firstname: string;
    lastname: string;
  } | null;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  role: Role;
  studentId?: number;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}

export const USER_REPOSITORY = 'USER_REPOSITORY';
