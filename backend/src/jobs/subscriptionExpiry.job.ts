import { Job } from "bull";
import Console from "../utils/logger";
import { SubscriptionExpiryService } from "../service/subscription-expiry.service";

/**
 * Job processor for checking and expiring subscriptions
 */
export const processSubscriptionExpiry = async (job: Job) => {
    Console.log("[JOB] Processing subscription expiry check...");

    try {
        const result = await SubscriptionExpiryService.expireSubscriptions();
        Console.log(`[JOB] Subscription expiry check completed. Expired: ${result.expired}`);
        return result;
    } catch (error) {
        Console.error("[JOB] Error processing subscription expiry:", error);
        throw error;
    }
};

/**
 * Job processor for notifying expiring subscriptions
 */
export const processSubscriptionExpiryNotification = async (job: Job) => {
    Console.log("[JOB] Processing subscription expiry notifications...");

    try {
        const result = await SubscriptionExpiryService.notifyExpiringSubscriptions(7);
        Console.log(`[JOB] Subscription expiry notifications sent. Count: ${result.notified}`);
        return result;
    } catch (error) {
        Console.error("[JOB] Error sending subscription expiry notifications:", error);
        throw error;
    }
};
