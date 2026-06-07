import { BaseService } from "./base.service";
import { IntegrationRepository } from "../repositories/integration.repository";
import { OutletRepository } from "../repositories/outlet.repository";
import { LoyaltyRepository } from "../repositories/loyalty.repository";
import { marketingBroadcastQueue } from "../queues/marketing-broadcast.queue";
import { SendBroadcastInput } from "../schemas/marketing.schema";

export class MarketingService extends BaseService {
  static async sendBroadcast(businessId: string, data: SendBroadcastInput) {
    // 1. Verify WhatsApp integration is connected
    const integration = await IntegrationRepository.findByBusinessAndProvider(businessId, "WHATSAPP");
    if (!integration || integration.status !== "CONNECTED") {
      this.badRequest("Integrasi WhatsApp belum terhubung atau tidak aktif. Silakan hubungkan WhatsApp terlebih dahulu.");
    }

    // 2. Resolve outlet IDs to target
    let targetOutletIds: string[] = [];
    if (data.outletId) {
      // Validate outlet belongs to the business
      const outlet = await OutletRepository.findById(data.outletId);
      if (!outlet || outlet.businessId !== businessId) {
        this.notFound("Outlet tidak ditemukan");
      }
      targetOutletIds = [data.outletId];
    } else {
      // Fetch all outlets of the business
      const outlets = await OutletRepository.findByBusinessId(businessId);
      targetOutletIds = outlets.map((o) => o.id);
    }

    if (targetOutletIds.length === 0) {
      this.badRequest("Bisnis Anda tidak memiliki outlet aktif.");
    }

    // 3. Fetch loyalty members for the outlets
    // Use a Set to ensure unique customer phones (since a customer might be a member of multiple outlets)
    const uniquePhones = new Set<string>();
    const recipients: Array<{ name: string; phone: string }> = [];

    for (const outletId of targetOutletIds) {
      // Fetch all members (limit 100000 to fetch everything)
      const result = await LoyaltyRepository.findMembersByOutlet(
        outletId,
        undefined,
        0,
        100000,
        undefined,
        undefined,
        data.tierId
      );

      for (const m of result) {
        const phone = m.guestCustomer.phone;
        if (phone && !uniquePhones.has(phone)) {
          uniquePhones.add(phone);
          recipients.push({
            name: m.guestCustomer.name,
            phone: phone,
          });
        }
      }
    }

    if (recipients.length === 0) {
      return {
        message: "Tidak ada member loyalty yang cocok dengan kriteria filter.",
        queuedCount: 0,
      };
    }

    // 4. Queue broadcast jobs with staggered delays
    const now = Date.now();
    let baseDelay = 0;
    if (data.scheduledAt) {
      const scheduledTime = new Date(data.scheduledAt).getTime();
      baseDelay = scheduledTime - now;
      if (baseDelay < 0) {
        baseDelay = 0;
      }
    }

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      // Personalize message: replace [nama] or [nama_member] with customer name
      let personalizedMessage = data.message
        .replace(/\[nama\]/gi, recipient.name)
        .replace(/\[nama_member\]/gi, recipient.name);

      const jobDelay = baseDelay + i * 3000; // Stagger by 3 seconds for each recipient

      await marketingBroadcastQueue.add(
        {
          businessId,
          phone: recipient.phone,
          message: personalizedMessage,
        },
        {
          delay: jobDelay,
          attempts: 3, // retry up to 3 times on failure
          backoff: 10000, // wait 10s before retry
        }
      );
    }

    return {
      message: `Berhasil menjadwalkan siaran untuk ${recipients.length} member loyalty.`,
      queuedCount: recipients.length,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : new Date().toISOString(),
    };
  }
}
