import { Job } from "bull";
import { BaseQueue } from "./base-queue";
import { processPaymentProofCleanup } from "../jobs/paymentProofCleanup.job";

export class CleanupFile extends BaseQueue<{ triggeredAt: string }> {
    constructor() {
        super('cleanup-queue');
    }

    protected async handle(job: Job<{ triggeredAt: string }>): Promise<void> {
        console.log('Cleanup dimulai', job.data.triggeredAt);

        await processPaymentProofCleanup()

        console.log('Cleanup selesai');
    }
}