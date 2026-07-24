import { MetricsRepository } from '@hpbrain/database';
import type { Metric } from '@hpbrain/database';
import type { SystemMetrics } from './observability.types.js';

export class ObservabilityService {
  constructor(
    private readonly metricsRepo = new MetricsRepository(),
  ) {}

  async recordMetric(tenantId: string | null, name: string, value: number, tags?: Record<string, unknown>): Promise<void> {
    await this.metricsRepo.record(tenantId, name, value, tags);
  }

  async getMetrics(tenantId: string, metricName?: string): Promise<Metric[]> {
    return this.metricsRepo.findByTenant(tenantId, metricName);
  }

  async getMetricAggregates(tenantId: string, metricName: string) {
    return this.metricsRepo.getAggregates(tenantId, metricName);
  }

  getSystemMetrics(): SystemMetrics {
    const usage = process.memoryUsage();
    return {
      memory: { used: Math.round(usage.heapUsed / 1024 / 1024), total: Math.round(usage.heapTotal / 1024 / 1024), unit: 'MB' },
      cpu: { usage: 0, unit: '%' },
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
