import { LogsRepository } from '@hpbrain/database';
export class Logger {
    logsRepo;
    minLevel;
    constructor(logsRepo = new LogsRepository(), minLevel = 'INFO') {
        this.logsRepo = logsRepo;
        this.minLevel = minLevel;
    }
    async log(level, message, context = {}) {
        const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
        if (levels.indexOf(level) < levels.indexOf(this.minLevel))
            return;
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
    debug(message, context) { return this.log('DEBUG', message, context); }
    info(message, context) { return this.log('INFO', message, context); }
    warn(message, context) { return this.log('WARN', message, context); }
    error(message, context) { return this.log('ERROR', message, context); }
    fatal(message, context) { return this.log('FATAL', message, context); }
}
export const logger = new Logger();
