import { paymentQueue } from "../queues/payment.queue"
import { paymentProofCleanupQueue, scheduleDailyPaymentProofCleanup } from "../queues/payment-proof-cleanup.queue"
import Console from "../utils/logger";
import { processPaymentExpiration } from "./paymentExpiration.job"
import { processPaymentProofCleanup } from "./paymentProofCleanup.job"

export const setUpJobs = () => {
    Console.log(`Init jobs`);

    paymentQueue.process(processPaymentExpiration);

    paymentQueue.on('completed', (job) => {
        Console.log(`Job ${job.id} completed`);
    });

    paymentQueue.on('failed', (job, error) => {
        Console.log(`Job ${job.id} failed: `, error)
    });

    paymentQueue.on('stalled', job => {
        Console.warn(`Job ${job.id} stalled`)
    })

    paymentProofCleanupQueue.process(processPaymentProofCleanup);

    paymentProofCleanupQueue.on('failed', (job, error) => {
        Console.error(`Payment proof cleanup job ${job.id} failed`, error);
    });

    scheduleDailyPaymentProofCleanup();
}