import { Job } from "bull";
import { BaseQueue } from "./base-queue";
import { IntegrationService } from "../service/integration.service";

export interface MarketingBroadcastJobData {
  businessId: string;
  phone: string;
  message: string;
}

export class MarketingBroadcastQueue extends BaseQueue<MarketingBroadcastJobData> {
  constructor() {
    super("marketing-broadcast-queue");
  }

  protected async handle(job: Job<MarketingBroadcastJobData>): Promise<void> {
    const { businessId, phone, message } = job.data;
    console.log(`[Marketing Broadcast Queue] Sending broadcast to: ${phone}`);
    try {
      await IntegrationService.sendWhatsAppMessage(businessId, phone, message);
    } catch (err: any) {
      console.error(`[Marketing Broadcast Queue] Failed to send to ${phone}:`, err?.message || err);
      throw err; // Allow Bull to retry if needed
    }
  }
}

export const marketingBroadcastQueue = new MarketingBroadcastQueue();
