import { getRabbitMQChannel } from '../config/rabbitmq.js';
import { emailWorker } from './email.worker.js';
import { paymentWorker } from './payment.worker.js';
import { serviceOrderWorker } from './service-order.worker.js';
import { notificationWorker } from './notification.worker.js';
import logger from '../utils/pino.logger.js';

class WorkerManager {
    private workers = {
        email: emailWorker,
        payment: paymentWorker,
        serviceOrder: serviceOrderWorker,
        notification: notificationWorker,
    };

    async startAll() {
        logger.info({
            component: 'WorkerManager',
            workerCount: Object.keys(this.workers).length
        }, 'Starting all backend workers...');

        try {
            const channel = getRabbitMQChannel();

            await Promise.all([
                this.workers.email.start(channel),
                this.workers.payment.start(channel),
                this.workers.serviceOrder.start(channel),
                this.workers.notification.start(channel),
            ]);

            logger.info({
                component: 'WorkerManager',
                workers: Object.keys(this.workers)
            }, 'All backend workers started successfully');

        } catch (error: any) {
            logger.error({
                component: 'WorkerManager',
                error: error.message,
            }, 'Failed to start backend workers');
            throw error;
        }
    }

    stopAll() {
        logger.info({ component: 'WorkerManager' }, 'Stopping all workers...');

        Object.values(this.workers).forEach(worker => {
            worker.stop();
        });

        logger.info({ component: 'WorkerManager' }, 'All workers stopped');
    }

    setupGracefulShutdown() {
        const signals = ['SIGTERM', 'SIGINT'];

        signals.forEach(signal => {
            process.on(signal, () => {
                logger.info({
                    component: 'WorkerManager',
                    signal
                }, 'Received signal, shutting down workers gracefully...');

                this.stopAll();

                setTimeout(() => {
                    logger.info({ component: 'WorkerManager' }, 'Worker manager shutdown complete.');
                    process.exit(0);
                }, 5000);
            });
        });
    }
}

export const workerManager = new WorkerManager();
