import { createApp } from './app.js';
import { config } from './config.js';
import { closeDriver } from './neo4j/client.js';
import { logger } from './logger.js';
// An unhandled rejection from any single request (e.g. a database being briefly
// unreachable) must not crash the whole process and take down every other route.
// Node's default behavior since v15 is to terminate on unhandled rejection; this
// keeps the server alive and logs instead, matching how a production API should
// degrade (that one request fails) rather than fail (the whole server goes down).
process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    logger.error({ reason }, 'Unhandled promise rejection (request likely failed, server stays up)');
});
process.on('uncaughtException', (err) => {
    // eslint-disable-next-line no-console
    logger.error({ err }, 'Uncaught exception (server stays up)');
});
const app = createApp();
const server = app.listen(config.PORT, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    logger.info(`HP Enterprise Brain Foundation API listening on :${config.PORT}`);
});
async function shutdown() {
    server.close();
    await closeDriver();
    process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
