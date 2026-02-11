import { Job } from "bull";
import { BaseQueue } from "./base-queue";
import { BusinessRepository } from "../repositories/business.repository";

export class CheckSubscriptionExpire extends BaseQueue<{ triggeredAt: string }> {
    constructor() {
        super('check-subscription-expire')
    }

    protected async handle(job: Job<{ triggeredAt: string }>): Promise<void> {
        const candidates = await BusinessRepository.getExpiredBusinessSubscriptionsCandidate();

        if (candidates.length === 0) {
            console.info('[SUBSCRIPTION-EXPIRE-JOB] No subscription to expire', {
                triggeredAt: job.data.triggeredAt,
            });
            return;
        }

        await BusinessRepository.markBusinessSubscriptionsAsExpired(candidates.map(b => b.id))
        console.info('[SUBSCRIPTION-EXPIRE-JOB]', {
            triggeredAt: job.data.triggeredAt,
            totalExpired: candidates.length,
            businessIds: candidates.map(b => b.id),
        });
    }
}