import { dailySalesReportQueue } from "../queues/daily-sales-report.queue";

export class DailySalesReportJob {
  async register() {
    const repeatables =
      await dailySalesReportQueue["queue"].getRepeatableJobs();

    for (const job of repeatables) {
      await dailySalesReportQueue["queue"].removeRepeatableByKey(job.key);
    }

    await dailySalesReportQueue.add(
      { triggeredAt: new Date().toISOString() },
      {
        repeat: {
          cron: "0 0 * * *", // Setiap jam 12 malam
        },
        jobId: "daily-sales-report",
        removeOnComplete: true,
      },
    );
  }
}

export const dailySalesReportJob = new DailySalesReportJob();
