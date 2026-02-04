import { paymentQueue } from "../queues/payment.queue"
import { paymentProofCleanupQueue, scheduleDailyPaymentProofCleanup } from "../queues/payment-proof-cleanup.queue"
import { subscriptionExpiryQueue, subscriptionNotificationQueue, scheduleDailySubscriptionExpiryCheck, scheduleDailySubscriptionNotifications } from "../queues/subscription-expiry.queue"
import Console from "../utils/logger";
import { processPaymentExpiration } from "./paymentExpiration.job"
import { processPaymentProofCleanup } from "./paymentProofCleanup.job"
import { processSubscriptionExpiry, processSubscriptionExpiryNotification } from "./subscriptionExpiry.job"

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

    paymentProofCleanupQueue.process('daily-cleanup', processPaymentProofCleanup);
    paymentProofCleanupQueue.on('completed', (job) => {
        Console.log(`✅ Job ${job.id} (${job.name}) completed`);
    });

    paymentProofCleanupQueue.on('failed', (job, error) => {
        Console.error(`Payment proof cleanup job ${job.id} failed`, error);
    });

    scheduleDailyPaymentProofCleanup();

    // Subscription expiry jobs
    subscriptionExpiryQueue.process('daily-expiry-check', processSubscriptionExpiry);
    subscriptionExpiryQueue.on('completed', (job) => {
        Console.log(`✅ Subscription expiry job ${job.id} completed`);
    });
    subscriptionExpiryQueue.on('failed', (job, error) => {
        Console.error(`Subscription expiry job ${job.id} failed`, error);
    });

    subscriptionNotificationQueue.process('daily-expiry-notification', processSubscriptionExpiryNotification);
    subscriptionNotificationQueue.on('completed', (job) => {
        Console.log(`✅ Subscription notification job ${job.id} completed`);
    });
    subscriptionNotificationQueue.on('failed', (job, error) => {
        Console.error(`Subscription notification job ${job.id} failed`, error);
    });

    scheduleDailySubscriptionExpiryCheck();
    scheduleDailySubscriptionNotifications();
}