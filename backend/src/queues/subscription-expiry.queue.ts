import Bull from "bull";
import { config } from "../config";
import Console from "../utils/logger";

/**
 * Queue for subscription expiry checks
 */
export const subscriptionExpiryQueue = new Bull("subscription-expiry", {
    redis: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD,
    },
});

/**
 * Queue for subscription expiry notifications
 */
export const subscriptionNotificationQueue = new Bull("subscription-notification", {
    redis: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD,
    },
});

/**
 * Schedule daily subscription expiry check (runs at 1 AM every day)
 */
export const scheduleDailySubscriptionExpiryCheck = () => {
    Console.log("[SCHEDULER] Setting up daily subscription expiry check...");
    
    // Run at 1:00 AM every day
    subscriptionExpiryQueue.add(
        "daily-expiry-check",
        {},
        {
            repeat: {
                cron: "0 1 * * *", // 1 AM daily
            },
            removeOnComplete: true,
            removeOnFail: false,
        }
    );

    Console.log("[SCHEDULER] Daily subscription expiry check scheduled (1:00 AM)");
};

/**
 * Schedule daily subscription expiry notifications (runs at 9 AM every day)
 */
export const scheduleDailySubscriptionNotifications = () => {
    Console.log("[SCHEDULER] Setting up daily subscription expiry notifications...");
    
    // Run at 9:00 AM every day
    subscriptionNotificationQueue.add(
        "daily-expiry-notification",
        {},
        {
            repeat: {
                cron: "0 9 * * *", // 9 AM daily
            },
            removeOnComplete: true,
            removeOnFail: false,
        }
    );

    Console.log("[SCHEDULER] Daily subscription expiry notifications scheduled (9:00 AM)");
};
