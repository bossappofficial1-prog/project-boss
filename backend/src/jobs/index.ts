import { paymentProofCleanupQueue, scheduleDailyPaymentProofCleanup } from "../queues/payment-proof-cleanup.queue"
import Console from "../utils/logger";
import { processPaymentProofCleanup } from "./paymentProofCleanup.job"
import { cleanupScheduler } from "./cleanup.job";
import { checkSubscriptionExpireJob } from "./check-subscription-expire.job";
import { deletePaymentExpiryScheduler } from "./payment-expire-delete.job";

declare global {
    var __jobsInitialized: boolean | undefined;
}

export const setUpJobs = () => {
    if (globalThis.__jobsInitialized) {
        Console.log(`Jobs already initialized, skip duplicate setup`);
        return;
    }

    globalThis.__jobsInitialized = true;
    Console.log(`Init jobs`);

    paymentProofCleanupQueue.process('daily-cleanup', processPaymentProofCleanup);
    paymentProofCleanupQueue.on('completed', (job) => {
        Console.log(`✅ Job ${job.id} (${job.name}) completed`);
    });

    paymentProofCleanupQueue.on('failed', (job, error) => {
        Console.error(`Payment proof cleanup job ${job.id} failed`, error);
    });

    cleanupScheduler.register()
    checkSubscriptionExpireJob.register()
    deletePaymentExpiryScheduler.register()
}