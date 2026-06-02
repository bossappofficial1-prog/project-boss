import { connectRabbitMQ } from "./config/rabbitmq.js";
import { bootstrapQueues } from "./bootstrap/queue.bootstrap.js";
import { workerManager } from "./workers/worker-manager.js";
import logger from "./utils/pino.logger.js";

async function startWorker() {
    try {
        logger.info({ component: 'WorkerEntrypoint' }, 'Initializing worker database and queues...');
        await bootstrapQueues();

        logger.info({ component: 'WorkerEntrypoint' }, 'Connecting to RabbitMQ...');
        await connectRabbitMQ();

        logger.info({ component: 'WorkerEntrypoint' }, 'Starting Worker Manager...');
        workerManager.setupGracefulShutdown();
        await workerManager.startAll();

        logger.info({ component: 'WorkerEntrypoint' }, 'Worker process is fully operational and waiting for messages');
    } catch (error: any) {
        logger.error({ component: 'WorkerEntrypoint', error: error.message }, 'Failed to start worker process');
        process.exit(1);
    }
}

startWorker();
