"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationEvents = exports.eventBus = void 0;
const node_events_1 = require("node:events");
class EventBus {
    bus = new node_events_1.EventEmitter();
    history = [];
    on(type, handler) {
        this.bus.on(type, handler);
    }
    off(type, handler) {
        this.bus.off(type, handler);
    }
    async publish(event) {
        const full = { ...event, timestamp: new Date().toISOString() };
        this.history.push(full);
        await this.bus.emitAsync(full.type, full);
    }
    getHistory(type) {
        if (!type)
            return [...this.history];
        return this.history.filter((e) => e.type === type);
    }
}
exports.eventBus = new EventBus();
exports.OrganizationEvents = {
    Created: 'OrganizationCreated',
    Updated: 'OrganizationUpdated',
    Archived: 'OrganizationArchived',
};
