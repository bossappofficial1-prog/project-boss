import { CheckSubscriptionExpire } from "./check-subscriptioin-expire";
import { CleanupFile } from "./cleanup.queue";
import { DeleteExpireSystemPayment } from "./delete-expire-system-payment";
import { GenerateServiceOrderNotificationQueue } from "./generate-service-order-notification";
import { GenerateTransactionReportQueue } from "./generate-transaction-report.queue";
import { OrderExpiryQueue } from "./order-expiry.queue";
import { OrderNotificationQueue } from "./order-sent-notification";
import { TestQueue } from "./test.queue";
import { moderationQueue } from "./moderation.queue";

export const queues = [
    new TestQueue(),
    new CleanupFile(),
    new OrderExpiryQueue(),
    new GenerateTransactionReportQueue(),
    new CheckSubscriptionExpire(),
    new DeleteExpireSystemPayment(),
    new GenerateServiceOrderNotificationQueue(),
    new OrderNotificationQueue(),
    moderationQueue
]