import { notificationWorker } from './notification.worker';
import { serviceOrderWorker } from './service-order.worker';
import logger from '../utils/winston.logger';

class WorkerManager {
    private workers = {
        notification: notificationWorker,
        serviceOrder: serviceOrderWorker
    };

    async startAll() {
        logger.info('🚀 Starting all workers...', {
            event: 'workers_start_all',
            component: 'worker_manager',
            workerCount: Object.keys(this.workers).length
        });

        try {
            // Start semua workers secara parallel
            await Promise.all([
                this.workers.notification.start(),
                this.workers.serviceOrder.start()
            ]);

            logger.info('✅ All workers started successfully', {
                event: 'workers_started',
                component: 'worker_manager',
                workers: Object.keys(this.workers)
            });

        } catch (error: any) {
            logger.error('❌ Failed to start workers', {
                error: error.message,
                stack: error.stack,
                event: 'workers_start_failed',
                component: 'worker_manager'
            });
            throw error;
        }
    }

    stopAll() {
        logger.info('🛑 Stopping all workers...', {
            event: 'workers_stop_all',
            component: 'worker_manager'
        });

        Object.values(this.workers).forEach(worker => {
            worker.stop();
        });

        logger.info('✅ All workers stopped', {
            event: 'workers_stopped',
            component: 'worker_manager'
        });
    }

    // Graceful shutdown handler
    setupGracefulShutdown() {
        const signals = ['SIGTERM', 'SIGINT'];

        signals.forEach(signal => {
            process.on(signal, () => {
                logger.info(`🛑 Received ${signal}, shutting down workers gracefully...`, {
                    event: 'graceful_shutdown',
                    component: 'worker_manager',
                    signal
                });

                this.stopAll();

                // Give workers time to finish current tasks
                setTimeout(() => {
                    logger.info('👋 Worker manager shutdown complete', {
                        event: 'shutdown_complete',
                        component: 'worker_manager'
                    });
                    process.exit(0);
                }, 5000);
            });
        });
    }
}

export const workerManager = new WorkerManager();

// Auto-start jika file ini dijalankan langsung
if (require.main === module) {
    workerManager.setupGracefulShutdown();

    workerManager.startAll().catch((error) => {
        logger.error('💥 Worker manager crashed', {
            error: error.message,
            stack: error.stack,
            event: 'worker_manager_crashed',
            component: 'worker_manager'
        });
        process.exit(1);
    });
}
