import { snap, coreApi } from "../../config/midtrans";
import { db } from "../../config/prisma";
import { schedulePaymentExpiration } from "../../queues/payment.queue";
import { buildMidtransCorePayload } from "../../utils/midtrans-core.utils";
import { mappingTransactionStatusForMidtrans } from "../../utils/mapping";
import {
  IPaymentProvider,
  ChargeParams,
  ChargeResult,
  SnapChargeParams,
  SnapChargeResult,
} from "./payment-provider.interface";
import { MidtransWebhookPayloadType } from "../../types/Others";

import { PaymentStatus } from "@prisma/client";

/** Mapping dari channel generik ke format Midtrans Core API */
function resolveMidtransPaymentType(channel: string): string {
  if (channel.startsWith("qris")) return "qris";

  if (channel.includes("_va") || channel.includes("-va")) {
    // "bca_va" → "bca_va", "bca-va" → "bca_va"
    const bank = channel.replace("-va", "").replace("_va", "");
    return `${bank}_va`;
  }

  if (channel.startsWith("ewallet_")) {
    return channel.replace("ewallet_", "");
  }

  throw new Error(`Channel Midtrans tidak dikenal: ${channel}`);
}

export class MidtransProvider implements IPaymentProvider {
  readonly name = "midtrans";

  /**
   * Charge via Midtrans Core API.
   * Digunakan untuk: QRIS, Virtual Account, eWallet.
   * Menyimpan transaksi ke DB setelah berhasil.
   */
  async charge(params: ChargeParams): Promise<ChargeResult> {
    const { orderId, grossAmount, items, customer, channel } = params;

    const paymentType = resolveMidtransPaymentType(channel);

    const payload = buildMidtransCorePayload({
      orderId,
      grossAmount,
      itemDetails: items,
      customer,
      paymentType,
    });

    let midtransResponse: MidtransWebhookPayloadType;
    try {
      midtransResponse = (await coreApi.charge(payload)) as MidtransWebhookPayloadType;
    } catch (error) {
      // Rollback order jika charge gagal
      await db.order.delete({ where: { id: orderId } }).catch(() => { });
      throw error;
    }

    const expiresAt = midtransResponse.expiry_time
      ? new Date(midtransResponse.expiry_time)
      : new Date(Date.now() + 10 * 60 * 1000);

    await db.transaction.create({
      data: {
        id: midtransResponse.transaction_id,
        externalId: midtransResponse.transaction_id,
        amount: Number(midtransResponse.gross_amount),
        paymentMethod: midtransResponse.payment_type,
        expiresAt,
        orderId,
        status: mappingTransactionStatusForMidtrans(midtransResponse.transaction_status),
        rawMidtrans: midtransResponse as any,
      },
    });

    return {
      transactionId: midtransResponse.transaction_id,
      status: midtransResponse.transaction_status,
      expiresAt,
      paymentUrl:
        (midtransResponse as any).actions?.find((a: any) => a.name === "deeplink-redirect")?.url ||
        (midtransResponse as any).actions?.find((a: any) => a.name === "generate-qr-code")?.url,
      raw: midtransResponse,
    };
  }

  /**
   * Buat Snap token untuk halaman redirect Midtrans.
   * Digunakan oleh flow lama (createMidtransTransactionService) dan POS.
   */
  async chargeSnap(params: SnapChargeParams): Promise<SnapChargeResult> {
    const { orderId, grossAmount, items, customer, expiryMinutes = 10 } = params;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: customer.name,
        phone: customer.phone,
      },
      item_details: items,
      expiry: {
        unit: "minute",
        duration: expiryMinutes,
      },
    };

    const transaction = await snap.createTransaction(parameter);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await db.transaction.create({
      data: {
        orderId,
        amount: grossAmount,
        status: PaymentStatus.PENDING,
        externalId: transaction.token,
        paymentUrl: transaction.redirect_url,
        expiresAt,
      },
    });

    await schedulePaymentExpiration(orderId, expiresAt);

    return {
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      expiresAt,
    };
  }

  /**
   * Batalkan transaksi aktif di Midtrans.
   */
  async cancelTransaction(orderId: string): Promise<void> {
    await coreApi.transaction.cancel(orderId);
  }
}

/** Singleton instance untuk digunakan sebagai default */
export const midtransProvider = new MidtransProvider();
