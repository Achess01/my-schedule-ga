import * as dotenv from 'dotenv';

dotenv.config();

export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET ?? 'default-dev-secret';
export const JWT_EXPIRATION = process.env.JWT_EXPIRATION ?? '1h';
export const PORT = process.env.PORT ?? 3001;
export const SCHEDULE_CLASS_URL =
  process.env.SCHEDULE_CLASS_URL ?? 'http://localhost:3000';
