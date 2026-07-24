import { MetricsRepository } from '@hpbrain/database';
export class ObservabilityService {
    metricsRepo;
    constructor(metricsRepo = new MetricsRepository()) {
        this.metricsRepo = metricsRepo;
    }
    async recordMetric(tenantId, name, value, tags) {
        await this.metricsRepo.record(tenantId, name, value, tags);
    }
    async getMetrics(tenantId, metricName) {
        return this.metricsRepo.findByTenant(tenantId, metricName);
    }
    async getMetricAggregates(tenantId, metricName) {
        return this.metricsRepo.getAggregates(tenantId, metricName);
    }
    getSystemMetrics() {
        const usage = process.memoryUsage();
        return {
            memory: { used: Math.round(usage.heapUsed / 1024 / 1024), total: Math.round(usage.heapTotal / 1024 / 1024), unit: 'MB' },
            cpu: { usage: 0, unit: '%' },
            uptime: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
        };
    }
}
