import { logger } from '../../logger.js';
import { NotificationRepository } from '@hpbrain/database';
// Not every event is notification-worthy — a curated set, same principle as
// the Task Registry's deliberate scoping: real coverage of what a user
// actually wants to know about, not an unfiltered firehose of every domain
// event ever published.
const NOTIFICATION_WORTHY = {
    RecommendationGenerated: (e) => `New recommendation ready for review (${e.entityType} ${e.entityId})`,
    DecisionMade: () => 'A decision has been recorded',
    HypothesisRejected: () => 'A hypothesis was rejected during case investigation',
    HypothesisConfirmed: () => 'A hypothesis was confirmed — case resolved',
    RiskAssessed: () => 'A new risk has been assessed',
    CaseOpened: () => 'A new case has been opened',
};
/**
 * Notification consumer, made real (product completion pass). Previously a
 * pure logging stub since Sprint 1 — this is the first time an event
 * actually results in a persisted, retrievable notification.
 *
 * Honest limitation: notifies the event's actorId (the person who triggered
 * it), not necessarily who *should* be notified about it (e.g., an
 * approver different from the actor). Real notification routing — who gets
 * told about what — is a product decision (subscriptions? role-based? org
 * chart?) not inferable from the event alone; this is the bounded, real
 * version, not a guess dressed up as the full answer.
 */
export class NotificationConsumer {
    name = 'NotificationConsumer';
    repository = new NotificationRepository();
    async consume(event) {
        const titleFn = NOTIFICATION_WORTHY[event.type];
        if (!titleFn) {
            logger.debug(`[NotificationConsumer] ${event.type} is not notification-worthy, skipping`);
            return;
        }
        await this.repository.create({
            tenantId: event.tenantId,
            userId: event.actorId,
            type: event.type,
            title: titleFn(event),
            entityType: event.entityType,
            entityId: event.entityId,
        });
    }
}
