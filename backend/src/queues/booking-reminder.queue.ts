import { Job } from "bull";
import { BaseQueue } from "./base-queue";
import { db } from "../config/prisma";
import webpush from "../config/webpush";
import Console from "../utils/logger";

export class BookingReminderQueue extends BaseQueue<{ triggeredAt: string }> {
  constructor() {
    super("booking-reminder");
  }

  protected async handle(job: Job<{ triggeredAt: string }>): Promise<void> {
    const now = new Date();
    // Cari booking dalam window 55 s.d. 75 menit ke depan (sekitar 1 jam lagi)
    const targetStart = new Date(now.getTime() + 50 * 60 * 1000);
    const targetEnd = new Date(now.getTime() + 75 * 60 * 1000);

    Console.log(`[BOOKING-REMINDER-JOB] Checking bookings between ${targetStart.toISOString()} and ${targetEnd.toISOString()}`);

    const slots = await db.bookingSlot.findMany({
      where: {
        status: "BOOKED",
        reminderSent: false,
        startTime: {
          gte: targetStart,
          lte: targetEnd,
        },
      },
      include: {
        productService: {
          include: {
            product: true,
          },
        },
        order: {
          include: {
            order: {
              include: {
                guestCustomer: {
                  include: {
                    pushSubscriptions: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (slots.length === 0) {
      Console.log(`[BOOKING-REMINDER-JOB] No upcoming bookings to remind.`);
      return;
    }

    Console.log(`[BOOKING-REMINDER-JOB] Found ${slots.length} upcoming booking slots to remind.`);

    for (const slot of slots) {
      const customer = slot.order?.order?.guestCustomer;
      const serviceName = slot.productService?.product?.name || "Layanan Jasa";
      const startTimeStr = new Date(slot.startTime).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (!customer || !customer.pushSubscriptions || customer.pushSubscriptions.length === 0) {
        Console.log(`[BOOKING-REMINDER-JOB] Customer ${customer?.name || "Unknown"} has no active push subscriptions. Marking as sent to avoid double checking.`);
        await db.bookingSlot.update({
          where: { id: slot.id },
          data: { reminderSent: true },
        });
        continue;
      }

      const payload = JSON.stringify({
        title: "Pengingat Jadwal Layanan",
        body: `Halo ${customer.name}, layanan ${serviceName} Anda dijadwalkan akan dimulai dalam 1 jam lagi (pukul ${startTimeStr}).`,
        url: "/history",
      });

      Console.log(`[BOOKING-REMINDER-JOB] Sending reminder to ${customer.name} for ${serviceName}. subscriptions count: ${customer.pushSubscriptions.length}`);

      const sendPromises = customer.pushSubscriptions.map(async (subDb: any) => {
        const pushSubFormat = {
          endpoint: subDb.endpoint,
          keys: {
            p256dh: subDb.p256dh,
            auth: subDb.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubFormat, payload);
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            Console.log(`[BOOKING-REMINDER-JOB] Removing invalid push subscription: ${subDb.id}`);
            await db.pushSubscription.delete({ where: { id: subDb.id } }).catch(() => {});
          } else {
            Console.error("[BOOKING-REMINDER-JOB] Failed to send to subscription device:", err.message);
          }
        }
      });

      await Promise.all(sendPromises);

      // Tandai booking slot telah dikirimi reminder
      await db.bookingSlot.update({
        where: { id: slot.id },
        data: { reminderSent: true },
      });
    }

    Console.info(`[BOOKING-REMINDER-JOB] Finished sending reminders. Checked at: ${job.data.triggeredAt}`);
  }
}
