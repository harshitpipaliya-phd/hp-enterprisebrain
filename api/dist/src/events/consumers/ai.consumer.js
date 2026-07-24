import { logger } from '../../logger.js';
// Stub consumer for AI processing - to be implemented in future stories
export class AIConsumer {
    name = 'AIConsumer';
    async consume(_event) {
        // Stub: In production, this would trigger AI reasoning, recommendations, etc.
        logger.debug(`[AIConsumer] Would process ${_event.type} for AI reasoning on ${_event.entityType}:${_event.entityId}`);
    }
}
