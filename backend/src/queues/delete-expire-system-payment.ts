import { Job } from "bull";
import { BaseQueue } from "./base-queue";
import { deletePaymentExpiry } from "../jobs/payment-expire-delete.job";

export class DeleteExpireSystemPayment extends BaseQueue<{ triggeredAt: string }> {
    constructor() {
        super('delete-expiry-payment')

    }

    protected async handle(job: Job<{ triggeredAt: string }>): Promise<void> {
        console.log('Cleanup dimulai', job.data.triggeredAt);

        await deletePaymentExpiry()

        console.log('Cleanup selesai');
    }
}