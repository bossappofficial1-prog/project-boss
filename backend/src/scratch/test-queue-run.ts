import { DailySalesReportQueue } from "../queues/daily-sales-report.queue";
import { db } from "../config/prisma";

async function run() {
    console.log("=== RUNNING DAILY SALES REPORT QUEUE ===");
    const queue = new DailySalesReportQueue();
    const dummyJob = {
        data: {
            triggeredAt: new Date().toISOString(),
        }
    } as any;
    
    await (queue as any).handle(dummyJob);
}

run().catch(console.error).finally(() => db.$disconnect());
