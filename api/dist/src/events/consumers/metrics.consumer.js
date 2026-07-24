import { logger } from '../../logger.js';
// Stub consumer for metrics collection - to be implemented in future stories
export class MetricsConsumer {
    name = 'MetricsConsumer';
    async consume(_event) {
        // Stub: In production, this would increment counters, record histograms, etc.
        logger.debug(`[MetricsConsumer] Would record metric for ${_event.type} tenant=${_event.tenantId}`);
    }
}
