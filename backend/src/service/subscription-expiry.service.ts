import { SubscriptionRepository } from "../repositories/subscription.repository";
import { BusinessRepository } from "../repositories/business.repository";
import { SubscriptionStatus } from "@prisma/client";

/**
 * Service to handle subscription expiry checks and updates
 */
export class SubscriptionExpiryService {
    /**
     * Check and expire subscriptions that have passed their end date
     */
    static async expireSubscriptions() {
        console.log("[CRON] Checking for expired subscriptions...");

        try {
            const expiredSubscriptions = await SubscriptionRepository.getExpiredSubscriptions();

            if (expiredSubscriptions.length === 0) {
                console.log("[CRON] No expired subscriptions found");
                return { expired: 0 };
            }

            console.log(`[CRON] Found ${expiredSubscriptions.length} expired subscriptions`);

            let expiredCount = 0;

            for (const subscription of expiredSubscriptions) {
                try {
                    // Update subscription status
                    await SubscriptionRepository.updateStatus(subscription.id, "EXPIRED");

                    // Update business status
                    await BusinessRepository.update(subscription.businessId, {
                        subscriptionStatus: "EXPIRED",
                    });

                    expiredCount++;
                    console.log(`[CRON] Expired subscription for business: ${subscription.business.name}`);
                } catch (error) {
                    console.error(
                        `[CRON] Error expiring subscription ${subscription.id}:`,
                        error
                    );
                }
            }

            console.log(`[CRON] Successfully expired ${expiredCount} subscriptions`);
            return { expired: expiredCount };
        } catch (error) {
            console.error("[CRON] Error in expireSubscriptions:", error);
            throw error;
        }
    }

    /**
     * Get subscriptions expiring soon (for notifications)
     */
    static async getExpiringSubscriptions(daysFromNow: number = 7) {
        try {
            const expiring = await SubscriptionRepository.getExpiringSubscriptions(daysFromNow);
            
            console.log(`[INFO] Found ${expiring.length} subscriptions expiring in ${daysFromNow} days`);
            
            return expiring;
        } catch (error) {
            console.error("[ERROR] Error getting expiring subscriptions:", error);
            throw error;
        }
    }

    /**
     * Send notification for expiring subscriptions
     * This is a placeholder - implement with actual notification service
     */
    static async notifyExpiringSubscriptions(daysFromNow: number = 7) {
        try {
            const expiring = await this.getExpiringSubscriptions(daysFromNow);

            for (const subscription of expiring) {
                // TODO: Implement actual notification (email, WhatsApp, etc.)
                console.log(
                    `[NOTIFICATION] Subscription expiring for ${subscription.business.name} (${subscription.business.owner.email}) on ${subscription.endDate}`
                );
            }

            return { notified: expiring.length };
        } catch (error) {
            console.error("[ERROR] Error notifying expiring subscriptions:", error);
            throw error;
        }
    }
}
