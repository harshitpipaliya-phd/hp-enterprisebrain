import { logger } from '../../logger.js';
import type { StoredEvent, EventConsumer } from '../event.backbone.js';

// Stub consumer for metrics collection - to be implemented in future stories
export class MetricsConsumer implements EventConsumer {
  name = 'MetricsConsumer';

  async consume(_event: StoredEvent): Promise<void> {
    // Stub: In production, this would increment counters, record histograms, etc.
    logger.debug(`[MetricsConsumer] Would record metric for ${_event.type} tenant=${_event.tenantId}`);
  }
}
