import { notificationWorker } from './notification.worker';
import { serviceOrderWorker } from './service-order.worker';
import logger from './utils/logger'; // Menggunakan logger baru

class WorkerManager {
    private workers = {
        notification: notificationWorker,
        serviceOrder: serviceOrderWorker
        // Di sini kita bisa menambahkan paymentReminderWorker jika ingin dikelola bersama
    };

    async startAll() {
        logger.info('Starting all workers...', {
            component: 'WorkerManager',
            event: 'start_all',
            workerCount: Object.keys(this.workers).length
        });

        try {
            await Promise.all([
                this.workers.notification.start(),
                this.workers.serviceOrder.start()
            ]);

            logger.info('All workers started successfully', {
                component: 'WorkerManager',
                event: 'start_success',
                workers: Object.keys(this.workers)
            });

        } catch (error: any) {
            logger.error('Failed to start workers', {
                component: 'WorkerManager',
                event: 'start_failed',
                error: error.message,
            });
            throw error;
        }
    }

    stopAll() {
        logger.info('Stopping all workers...', {
            component: 'WorkerManager',
            event: 'stop_all'
        });

        Object.values(this.workers).forEach(worker => {
            worker.stop();
        });

        logger.info('All workers stopped', {
            component: 'WorkerManager',
            event: 'stop_success'
        });
    }

    setupGracefulShutdown() {
        const signals = ['SIGTERM', 'SIGINT'];

        signals.forEach(signal => {
            process.on(signal, () => {
                logger.info(`Received ${signal}, shutting down workers gracefully...`, {
                    component: 'WorkerManager',
                    event: 'graceful_shutdown',
                    signal
                });

                this.stopAll();

                setTimeout(() => {
                    logger.info('Worker manager shutdown complete.', {
                        component: 'WorkerManager',
                        event: 'shutdown_complete'
                    });
                    process.exit(0);
                }, 5000); // Beri waktu 5 detik untuk menyelesaikan tugas
            });
        });
    }
}

export const workerManager = new WorkerManager();

if (require.main === module) {
    workerManager.setupGracefulShutdown();
    workerManager.startAll().catch(error => {
        logger.error('Worker manager crashed', {
            component: 'WorkerManager',
            event: 'crash',
            error: error.message,
        });
        process.exit(1);
    });
}
