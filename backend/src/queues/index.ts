import { CleanupFile } from "./cleanup.queue";
import { OrderExpiryQueue } from "./order-expiry.queue";
import { TestQueue } from "./test.queue";

export const queues = [
    new TestQueue(),
    new CleanupFile(),
    new OrderExpiryQueue()
]