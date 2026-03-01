import { CheckSubscriptionExpire } from "./check-subscriptioin-expire";
import { CleanupFile } from "./cleanup.queue";
import { DeleteExpireSystemPayment } from "./delete-expire-system-payment";
import { GenerateTransactionReportQueue } from "./generate-transaction-report.queue";
import { OrderExpiryQueue } from "./order-expiry.queue";
import { TestQueue } from "./test.queue";

export const queues = [
    new TestQueue(),
    new CleanupFile(),
    new OrderExpiryQueue(),
    new GenerateTransactionReportQueue(),
    new CheckSubscriptionExpire(),
    new DeleteExpireSystemPayment()
]