import type { Metric } from '@hpbrain/database';

export interface SystemMetrics {
  memory: { used: number; total: number; unit: string };
  cpu: { usage: number; unit: string };
  uptime: number;
  timestamp: string;
}

export interface ApiMetrics {
  totalRequests: number;
  avgLatency: number;
  errorRate: number;
  activeConnections: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, { status: string; responseTime?: number; details?: Record<string, unknown> }>;
  timestamp: string;
}
