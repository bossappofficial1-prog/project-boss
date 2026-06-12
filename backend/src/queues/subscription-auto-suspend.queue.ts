import { Job } from "bull";
import { BaseQueue } from "./base-queue";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { db } from "../config/prisma";
import { EmailService } from "../service/email.service";
import { config } from "../config";

export class SubscriptionAutoSuspendQueue extends BaseQueue<{
  triggeredAt: string;
}> {
  constructor() {
    super("subscription-auto-suspend");
  }

  protected async handle(job: Job<{ triggeredAt: string }>): Promise<void> {
    const expiredSubscriptions =
      await SubscriptionRepository.getExpiredSubscriptions();

    if (expiredSubscriptions.length === 0) {
      console.info("[SUBSCRIPTION-AUTO-SUSPEND] No expired subscriptions");
      return;
    }

    const businessIds = expiredSubscriptions.map((s) => s.businessId);
    const subscriptionIds = expiredSubscriptions.map((s) => s.id);

    // Batch update subscriptions to SUSPENDED
    await db.businessSubscription.updateMany({
      where: { id: { in: subscriptionIds } },
      data: { status: "SUSPENDED" },
    });

    // Update businesses
    await db.business.updateMany({
      where: { id: { in: businessIds } },
      data: { subscriptionStatus: "SUSPENDED" },
    });

    // Send email notification to each business owner
    for (const subscription of expiredSubscriptions) {
      const owner = subscription.business.owner;

      try {
        await EmailService.sendEmail({
          to: owner.email!,
          subject: `Langganan Ditangguhkan - Aksi Diperlukan`,
          html: `
                        <h2>Halo ${owner.name},</h2>
                        <p>Langganan untuk <strong>${subscription.business.name}</strong> telah ditangguhkan karena belum diperpanjang.</p>
                        
                        <p>Untuk mengembalikan akses:</p>
                        <ol>
                            <li>Masuk ke dashboard BOSS</li>
                            <li>Pergi ke halaman Subscription</li>
                            <li>Klik "Perpanjang" untuk memilih plan dan metode pembayaran</li>
                        </ol>
                        
                        <p>
                            <a href="${config.CLIENT_URL || "http://localhost:3000"}/owner/subscription" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                                Perpanjang Sekarang
                            </a>
                        </p>
                    `,
          text: `Langganan Anda telah ditangguhkan. Perpanjang sekarang di ${process.env.FRONTEND_URL || "http://localhost:3000"}/owner/subscription`,
        });

        console.log(
          `[SUBSCRIPTION-AUTO-SUSPEND] Sent suspension notification to ${owner.email}`,
        );
      } catch (error) {
        console.error(
          `[SUBSCRIPTION-AUTO-SUSPEND] Failed to send email to ${owner.email}:`,
          error,
        );
      }
    }

    console.log(
      `[SUBSCRIPTION-AUTO-SUSPEND] Suspended ${expiredSubscriptions.length} subscriptions`,
    );
  }
}
