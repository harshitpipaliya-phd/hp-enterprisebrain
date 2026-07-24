import { logger } from '../../logger.js';
import type { StoredEvent, EventConsumer } from '../event.backbone.js';

// Stub consumer for AI processing - to be implemented in future stories
export class AIConsumer implements EventConsumer {
  name = 'AIConsumer';

  async consume(_event: StoredEvent): Promise<void> {
    // Stub: In production, this would trigger AI reasoning, recommendations, etc.
    logger.debug(`[AIConsumer] Would process ${_event.type} for AI reasoning on ${_event.entityType}:${_event.entityId}`);
  }
}
