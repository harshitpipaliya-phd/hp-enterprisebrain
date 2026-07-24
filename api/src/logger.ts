import pino from 'pino';
import { config } from './config.js';

/**
 * Structured logging (audit finding: 6 raw console.* calls, no log levels, no
 * structured output). Pino chosen for its low overhead — this is a request-path
 * dependency, so a slow logger becomes a latency problem under load.
 *
 * In development, pretty-prints for readability. In production, emits raw JSON
 * so it's parseable by any log aggregator (CloudWatch, Datadog, etc.) without
 * a custom parser.
 */
export const logger = pino({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: config.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty', options: { colorize: true } },
});
