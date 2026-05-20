import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { TransactionDeleteRepository } from "../repositories/transaction-delete.repository";
import { DeleteRequestStatus, StockMovementType } from "@prisma/client";
import { getUserByIdService } from "./user.service";
import { PushNotificationService } from "./push-notification.service";
import { PushNotificationRepository } from "../repositories/push-notification.repository";
import { db } from "../config/prisma";

export class TransactionDeleteService {
  static async requestDeleteTransaction(params: {
    transactionId: string;
    cashierId: string;
    reason?: string;
  }) {
    const { transactionId, cashierId, reason } = params;

    const transaction = await TransactionDeleteRepository.findTransactionWithDetails(transactionId);
    if (!transaction) {
      throw new AppError("Transaksi tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    if (transaction.status !== "SUCCESS") {
      throw new AppError("Hanya transaksi berhasil yang dapat diajukan untuk dihapus", HttpStatus.BAD_REQUEST);
    }

    const existingPending = await TransactionDeleteRepository.findPendingRequestByTransaction(transactionId);
    if (existingPending) {
      throw new AppError("Transaksi ini sudah memiliki permintaan penghapusan yang menunggu persetujuan", HttpStatus.BAD_REQUEST);
    }

    const order = transaction.order!;
    const itemsSnapshot = order.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.priceAtTimeOfOrder,
      type: item.product.type,
    }));

    const deleteRequest = await TransactionDeleteRepository.createDeleteRequest({
      transactionId,
      orderId: order.id,
      outletId: order.outletId,
      requestedBy: cashierId,
      reason,
      customerName: order.guestCustomer.name,
      customerPhone: order.guestCustomer.phone,
      items: itemsSnapshot,
      totalAmount: order.totalAmount,
    });

    try {
      const outlet = order.outlet;
      const ownerId = outlet.business.owner.id;
      const owner = await getUserByIdService(ownerId);

      if (owner) {
        const ownerSubscriptions = await db.pushSubscription.findMany({
          where: { userId: ownerId },
        });

        if (ownerSubscriptions.length > 0) {
          const pushService = new PushNotificationService(new PushNotificationRepository());
          const payload = JSON.stringify({
            title: "Permintaan Penghapusan Transaksi",
            body: `${deleteRequest.requestedStaff?.name || "Kasir"} mengajukan penghapusan transaksi sebesar Rp ${order.totalAmount.toLocaleString("id-ID")}`,
            url: "/owner/transaction-deletes",
          });

          for (const sub of ownerSubscriptions) {
            try {
              const pushSubFormat = {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              };
              await (pushService as any).sendNotificationToCustomer("", {
                id: "",
                totalAmount: 0,
                guestCustomer: { pushSubscriptions: [sub] },
              }, JSON.parse(payload));
            } catch {
              // Silent fail for individual push
            }
          }
        }
      }
    } catch {
      // Non-blocking: push notification failure should not fail the request
    }

    return deleteRequest;
  }

  static async approveDeleteRequest(params: {
    requestId: string;
    ownerId: string;
  }) {
    const { requestId, ownerId } = params;

    const request = await TransactionDeleteRepository.findRequestById(requestId);
    if (!request) {
      throw new AppError("Permintaan penghapusan tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    if (request.status !== DeleteRequestStatus.PENDING) {
      throw new AppError("Permintaan ini sudah diproses sebelumnya", HttpStatus.BAD_REQUEST);
    }

    const outlet = request.outlet;
    if (outlet.business.ownerId !== ownerId) {
      throw new AppError("Anda tidak memiliki akses untuk menyetujui permintaan ini", HttpStatus.FORBIDDEN);
    }

    if (!request.transactionId || !request.orderId) {
      throw new AppError("Data transaksi tidak lengkap", HttpStatus.BAD_REQUEST);
    }

    const transaction = await TransactionDeleteRepository.findTransactionWithDetails(request.transactionId);
    if (!transaction || !transaction.order) {
      throw new AppError("Transaksi terkait tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    const order = transaction.order;

    for (const item of order.items) {
      if (item.product.type === "GOODS" && item.product.goods) {
        await TransactionDeleteRepository.restoreGoodsStock(
          item.product.goods.id,
          item.quantity,
          order.id,
          item.hppAtTimeOfOrder,
        );

        await TransactionDeleteRepository.createStockLog({
          productGoodsId: item.product.goods.id,
          type: StockMovementType.RETURN,
          quantity: item.quantity,
          hppPerUnit: item.hppAtTimeOfOrder,
          referenceType: "TRANSACTION_DELETE",
          referenceId: requestId,
          notes: `Restock dari penghapusan transaksi ${order.id}`,
        });
      } else if (item.product.type === "TICKET" && item.product.ticket) {
        await TransactionDeleteRepository.restoreTicketQuota(
          item.product.ticket.id,
          item.quantity,
        );

        await TransactionDeleteRepository.cancelTicketCodes(item.id);
      }
    }

    if (order.pointsRedeemed > 0) {
      try {
        await TransactionDeleteRepository.refundLoyaltyPoints(
          order.outletId,
          order.guestCustomerId,
          order.id,
          order.pointsRedeemed,
        );
      } catch {
        // Non-blocking: loyalty refund failure should not fail the deletion
      }
    }

    await TransactionDeleteRepository.deleteTransactionAndOrder(
      request.transactionId,
      request.orderId,
    );

    await TransactionDeleteRepository.updateRequestStatus(requestId, {
      status: DeleteRequestStatus.APPROVED,
      approvedBy: "owner",
      approvedAt: new Date(),
    });

    return { success: true, message: "Permintaan penghapusan disetujui. Transaksi telah dihapus dan stok dikembalikan." };
  }

  static async rejectDeleteRequest(params: {
    requestId: string;
    ownerId: string;
    rejectionNote: string;
  }) {
    const { requestId, ownerId, rejectionNote } = params;

    const request = await TransactionDeleteRepository.findRequestById(requestId);
    if (!request) {
      throw new AppError("Permintaan penghapusan tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    if (request.status !== DeleteRequestStatus.PENDING) {
      throw new AppError("Permintaan ini sudah diproses sebelumnya", HttpStatus.BAD_REQUEST);
    }

    const outlet = request.outlet;
    if (outlet.business.ownerId !== ownerId) {
      throw new AppError("Anda tidak memiliki akses untuk menolak permintaan ini", HttpStatus.FORBIDDEN);
    }

    await TransactionDeleteRepository.updateRequestStatus(requestId, {
      status: DeleteRequestStatus.REJECTED,
      approvedBy: "owner",
      approvedAt: new Date(),
      rejectionNote,
    });

    return { success: true, message: "Permintaan penghapusan ditolak." };
  }

  static async getDeleteRequestsByOutlet(outletId: string, status?: string) {
    const deleteStatus = status ? (status as DeleteRequestStatus) : undefined;
    return TransactionDeleteRepository.getRequestsByOutlet(outletId, deleteStatus);
  }

  static async getOwnerPendingRequests(businessId: string) {
    return TransactionDeleteRepository.getOwnerPendingRequests(businessId);
  }
}
