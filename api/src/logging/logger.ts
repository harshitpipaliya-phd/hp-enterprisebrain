import { LogsRepository } from '@hpbrain/database';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogContext {
  tenantId?: string;
  orgId?: string;
  userId?: string;
  requestId?: string;
  correlationId?: string;
  module?: string;
  executionTime?: number;
  metadata?: Record<string, unknown>;
}

export class Logger {
  constructor(
    private readonly logsRepo = new LogsRepository(),
    private readonly minLevel: LogLevel = 'INFO',
  ) {}

  async log(level: LogLevel, message: string, context: LogContext = {}): Promise<void> {
    const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    if (levels.indexOf(level) < levels.indexOf(this.minLevel)) return;

    await this.logsRepo.log({
      tenantId: context.tenantId ?? null,
      orgId: context.orgId ?? null,
      level,
      message,
      module: context.module ?? null,
      userId: context.userId ?? null,
      requestId: context.requestId ?? null,
      correlationId: context.correlationId ?? null,
      executionTime: context.executionTime ?? null,
      metadata: context.metadata ?? null,
    });
  }

  debug(message: string, context?: LogContext): Promise<void> { return this.log('DEBUG', message, context); }
  info(message: string, context?: LogContext): Promise<void> { return this.log('INFO', message, context); }
  warn(message: string, context?: LogContext): Promise<void> { return this.log('WARN', message, context); }
  error(message: string, context?: LogContext): Promise<void> { return this.log('ERROR', message, context); }
  fatal(message: string, context?: LogContext): Promise<void> { return this.log('FATAL', message, context); }
}

export const logger = new Logger();
