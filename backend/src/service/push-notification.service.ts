import { Expo, ExpoPushMessage } from "expo-server-sdk";
import webpush from "../config/webpush";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { PushNotificationRepository } from "../repositories/push-notification.repository";
import type { PushSubscriptionPayload } from "../schemas/push-notification.schema";

const expo = new Expo();

interface Payload {
  title: string;
  body: string;
  url: string;
}

export class PushNotificationService {
  constructor(private readonly repo: PushNotificationRepository) {}

  public async subscribe(data: PushSubscriptionPayload) {
    const result = await this.repo.subscribe(data);
    if (!result)
      throw new AppError(Messages.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    return result;
  }

  public async unsubscribe(endpoint: string) {
    const result = await this.repo.deleteByEndpoint(endpoint);
    if (!result) return;
    return result;
  }

  public async sendNotificationToCustomer(
    _orderID: string,
    order: {
      id: string;
      totalAmount: number;
      guestCustomer: {
        pushSubscriptions: {
          id: string;
          endpoint: string;
          type: "WEB" | "EXPO";
          p256dh: string | null;
          auth: string | null;
          expoPushToken: string | null;
          guestCustomerId: string | null;
          userId: string | null;
          staffId: string | null;
          createdAt: Date;
          updatedAt: Date;
        }[];
      };
    },
    payload: Payload,
  ) {
    try {
      const subscriptions = order.guestCustomer.pushSubscriptions;
      if (subscriptions.length === 0) {
        return;
      }

      const sendPromises = subscriptions.map(async (sub) => {
        try {
          await this.sendByType(sub.type, sub, payload);
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(
              `Menghapus subscription yang sudah tidak valid: ${sub.id}`,
            );
            await this.repo.delete(sub.id);
          } else {
            console.error("Gagal kirim ke satu device:", err);
          }
        }
      });
      await Promise.all(sendPromises);
    } catch (error) {
      console.log(error);
    }
  }

  public async sendNotificationToStaff(outletId: string, payload: Payload) {
    try {
      const subscriptions = await this.repo.getStaffSubscriptionsByOutlet(
        outletId,
      );
      if (subscriptions.length === 0) {
        console.log(
          `Tidak ada subscription aktif untuk staff di outlet ${outletId}`,
        );
        return;
      }

      const sendPromises = subscriptions.map(async (sub) => {
        try {
          await this.sendByType(sub.type, sub, payload);
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(
              `Menghapus subscription staff yang sudah tidak valid: ${sub.id}`,
            );
            await this.repo.delete(sub.id);
          } else {
            console.error("Gagal kirim push ke staff device:", err);
          }
        }
      });
      await Promise.all(sendPromises);
    } catch (error) {
      console.error("Error sending staff notifications:", error);
    }
  }

  private async sendByType(
    type: "WEB" | "EXPO",
    sub: {
      endpoint: string;
      p256dh: string | null;
      auth: string | null;
      expoPushToken: string | null;
    },
    payload: Payload,
  ) {
    if (type === "EXPO") {
      const token = sub.expoPushToken || sub.endpoint;
      if (!Expo.isExpoPushToken(token)) return;

      const message: ExpoPushMessage = {
        to: token,
        sound: "default",
        channelId: "default",
        priority: "high",
        title: payload.title,
        body: payload.body,
        data: { url: payload.url },
      };
      await expo.sendPushNotificationsAsync([message]);
      return;
    }

    if (!sub.p256dh || !sub.auth) return;

    const pushSubFormat = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };
    await webpush.sendNotification(pushSubFormat, JSON.stringify(payload));
  }
}
