import { HealthCheckRepository, getPool } from '@hpbrain/database';
import { getDriver } from '../neo4j/client.js';
import { eventBus } from '@hpbrain/events';
/**
 * A health check that can hang is worse than one that fails — a load
 * balancer or orchestrator with its own short timeout budget gets nothing
 * useful either way, but a hanging check also holds a connection/thread
 * open. Real gap found while wiring /health, /live, /ready to actually
 * work: pool.query() had no timeout, so against an unreachable Postgres
 * it took 30+ seconds (the driver's default) to fail instead of seconds.
 */
function withTimeout(promise, ms, label) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
    ]);
}
export class HealthService {
    healthRepo;
    constructor(healthRepo = new HealthCheckRepository()) {
        this.healthRepo = healthRepo;
    }
    /**
     * Best-effort recording — a health check's OWN result must never depend
     * on successfully writing that result somewhere. This was a real bug:
     * checkDatabase()'s failure path called healthRepo.record(), which
     * itself needs the database that was just found to be down, causing an
     * unhandled second failure that could crash or double-respond to the
     * original request. Never exercised before because nothing called these
     * methods from a public, always-hit, unauthenticated path until the
     * Backend Completion Program's /health, /live, /ready endpoints.
     */
    async recordBestEffort(checkName, status, details, responseTime) {
        try {
            await this.healthRepo.record(checkName, status, details, responseTime);
        }
        catch {
            // Intentionally swallowed — failing to persist a health-check
            // record must never affect the health check result itself.
        }
    }
    async checkDatabase() {
        const start = Date.now();
        try {
            const pool = getPool();
            await withTimeout(pool.query('SELECT 1'), 2000, 'Database health check');
            const responseTime = Date.now() - start;
            await this.recordBestEffort('database', 'healthy', { message: 'PostgreSQL connected' }, responseTime);
            return { status: 'healthy', responseTime };
        }
        catch (e) {
            await this.recordBestEffort('database', 'unhealthy', { error: e.message });
            return { status: 'unhealthy', details: { error: e.message } };
        }
    }
    async checkNeo4j() {
        const start = Date.now();
        try {
            const driver = getDriver();
            const session = driver.session();
            try {
                await withTimeout(session.run('RETURN 1 as n'), 2000, 'Neo4j health check');
                const responseTime = Date.now() - start;
                await this.recordBestEffort('neo4j', 'healthy', { message: 'Neo4j connected' }, responseTime);
                return { status: 'healthy', responseTime };
            }
            finally {
                await session.close();
            }
        }
        catch (e) {
            await this.recordBestEffort('neo4j', 'unhealthy', { error: e.message });
            return { status: 'unhealthy', details: { error: e.message } };
        }
    }
    async checkEvents() {
        const start = Date.now();
        try {
            const history = eventBus.getHistory();
            const responseTime = Date.now() - start;
            await this.recordBestEffort('events', 'healthy', { eventCount: history.length }, responseTime);
            return { status: 'healthy', responseTime, details: { eventCount: history.length } };
        }
        catch (e) {
            await this.recordBestEffort('events', 'unhealthy', { error: e.message });
            return { status: 'unhealthy', details: { error: e.message } };
        }
    }
    async checkSystem() {
        try {
            const usage = process.memoryUsage();
            const details = {
                memory: { heapUsed: Math.round(usage.heapUsed / 1024 / 1024), heapTotal: Math.round(usage.heapTotal / 1024 / 1024), unit: 'MB' },
                uptime: Math.round(process.uptime()),
            };
            const status = details.memory.heapUsed > 500 ? 'degraded' : 'healthy';
            await this.recordBestEffort('system', status, details);
            return { status, details };
        }
        catch (e) {
            await this.recordBestEffort('system', 'unhealthy', { error: e.message });
            return { status: 'unhealthy', details: { error: e.message } };
        }
    }
    async getHealthStatus() {
        const [database, neo4j, events, system] = await Promise.all([
            this.checkDatabase(),
            this.checkNeo4j(),
            this.checkEvents(),
            this.checkSystem(),
        ]);
        const checks = { database, neo4j, events, system };
        const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');
        const anyUnhealthy = Object.values(checks).some((c) => c.status === 'unhealthy');
        return {
            status: anyUnhealthy ? 'unhealthy' : allHealthy ? 'healthy' : 'degraded',
            checks: checks,
            timestamp: new Date().toISOString(),
        };
    }
}
