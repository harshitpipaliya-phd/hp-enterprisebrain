import 'dotenv/config';
import { z } from 'zod';
const envSchema = z.object({
    NODE_ENV: z.string().default('development'),
    NEO4J_URI: z.string().default('neo4j://localhost:7687'),
    NEO4J_USERNAME: z.string().default('neo4j'),
    NEO4J_PASSWORD: z.string().default('password'),
    PORT: z.coerce.number().default(4000),
    JWT_SECRET: z.string().default('change-me-in-production'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
});
export const config = envSchema.parse(process.env);
// Security: refuse to boot in production with the placeholder secret still set.
// A default secret in prod means anyone who reads this repo's source can forge
// valid tokens — this is not a style nitpick, it's an authentication bypass.
if (config.NODE_ENV === 'production' && config.JWT_SECRET === 'change-me-in-production') {
    // eslint-disable-next-line no-console
    console.error('FATAL: JWT_SECRET is still the placeholder value in production. Set a real secret before starting.');
    process.exit(1);
}
