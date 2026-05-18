import { Job } from "bull";
import { BaseQueue } from "./base-queue";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { EmailService } from "../service/email.service";

export class SubscriptionExpiryNotificationQueue extends BaseQueue<{ triggeredAt: string }> {
    constructor() {
        super('subscription-expiry-notification');
    }

    protected async handle(job: Job<{ triggeredAt: string }>): Promise<void> {
        const subscriptions = await SubscriptionRepository.getExpiringSubscriptions(7);

        if (subscriptions.length === 0) {
            console.info('[SUBSCRIPTION-EXPIRY-NOTIFICATION] No subscriptions expiring soon');
            return;
        }

        for (const subscription of subscriptions) {
            const owner = subscription.business.owner;
            const daysLeft = Math.ceil(
                (new Date(subscription.nextBillingDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            try {
                await EmailService.sendEmail({
                    to: owner.email!,
                    subject: `Langganan akan berakhir dalam ${daysLeft} hari - ${subscription.business.name}`,
                    html: `
                        <h2>Halo ${owner.name},</h2>
                        <p>Langganan Anda untuk <strong>${subscription.business.name}</strong> akan berakhir dalam <strong>${daysLeft} hari</strong>.</p>
                        
                        <h3>Detail Langganan:</h3>
                        <ul>
                            <li>Plan: ${subscription.plan.name}</li>
                            <li>Billing Cycle: ${subscription.billingCycle === 30 ? 'Monthly' : 'Yearly'}</li>
                            <li>Harga: Rp ${subscription.pricePerCycle.toLocaleString('id-ID')}</li>
                            <li>Berakhir: ${new Date(subscription.nextBillingDate!).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</li>
                        </ul>
                        
                        <p>
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/owner/subscription" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                                Perpanjang Sekarang
                            </a>
                        </p>
                        
                        <p style="color: #666; font-size: 12px; margin-top: 20px;">
                            Jika Anda tidak memperpanjang sebelum berakhir, akses ke fitur BOSS akan ditangguhkan.
                        </p>
                    `,
                    text: `Langganan Anda akan berakhir dalam ${daysLeft} hari. Perpanjang sekarang di ${process.env.FRONTEND_URL || 'http://localhost:3000'}/owner/subscription`,
                });

                console.log(`[SUBSCRIPTION-EXPIRY-NOTIFICATION] Sent notification to ${owner.email}`);
            } catch (error) {
                console.error(`[SUBSCRIPTION-EXPIRY-NOTIFICATION] Failed to send email to ${owner.email}:`, error);
            }
        }

        console.log(`[SUBSCRIPTION-EXPIRY-NOTIFICATION] Processed ${subscriptions.length} subscriptions`);
    }
}
