import 'dotenv/config';
import { z } from 'zod';
const schema = z.object({
    DB_CONNECTION: z.string().default('mysql'),
    DB_HOST: z.string().min(1).default('127.0.0.1'),
    DB_PORT: z.coerce.number().int().positive().default(3306),
    DB_DATABASE: z.string().min(1).default('hp_brain_test'),
    DB_USERNAME: z.string().min(1).default('root'),
    DB_PASSWORD: z.string().min(1).default(''),
    DB_SSL: z.enum(['true', 'false']).default('false'),
});
export const config = schema.parse(process.env);
export const dbSsl = config.DB_SSL === 'true';
