import { CleanupFile } from "./cleanup.queue";
import { GenerateTransactionReportQueue } from "./generate-transaction-report.queue";
import { OrderExpiryQueue } from "./order-expiry.queue";
import { TestQueue } from "./test.queue";

export const queues = [
    new TestQueue(),
    new CleanupFile(),
    new OrderExpiryQueue(),
    new GenerateTransactionReportQueue()
]