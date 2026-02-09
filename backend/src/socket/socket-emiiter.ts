import { Server } from "socket.io";
import Console from "../utils/logger";
import { SOCKET_EVENT } from "./types";

export class SocketEmitter {
  private static instance: SocketEmitter;
  private io: Server | null = null;

  private constructor() { }

  static getInstance(): SocketEmitter {
    if (!SocketEmitter.instance) {
      SocketEmitter.instance = new SocketEmitter();
    }

    return SocketEmitter.instance;
  }

  init(ioInstance: Server) {
    this.io = ioInstance;
    Console.log("✅ SocketEmitter terhubung ke instance Socket.IO");
  }

  private getIO(): Server {
    if (!this.io) throw new Error("Socket.IO belum diinisialisasi!");
    return this.io;
  }

  sendTestMessage(outletId: string, message: string) {
    const io = this.getIO();
    Console.log(`mengirim event ke outletId: ${outletId}`);
    io.to(outletId).emit(SOCKET_EVENT.PAYMENT_NEW, { message });
  }

  emitToBusinessOutlet(
    outletId: string,
    data: {
      orderId: string;
      amount: number;
      paymentMethod: string;
      customerName: string;
      timestamp: Date;
      type?: string;
      message?: string;
    },
  ) {
    const io = this.getIO();
    const payload = {
      ...data,
      type: data.type ?? "payment_notification",
    };
    io.to(outletId).emit(SOCKET_EVENT.PAYMENT_NEW, payload);
  }

  emitToCustomer(
    userIdentifier: string,
    data: {
      orderId: string;
      amount: number;
      status: string;
      isManual: boolean;
      transactionStatus?: string;
      paymentMethod?: string;
      type?: string;
      message?: string;
      cancellationReason?: string;
    },
  ) {
    const io = this.getIO();
    const payload = {
      ...data,
      type: data.type ?? "customer_notification",
    };
    io.to(userIdentifier).emit(SOCKET_EVENT.ORDER_STATUS_CHANGED, payload);
    io.to(userIdentifier).emit(SOCKET_EVENT.CUSTOMER_NOTIFICATION, payload);
  }

  emitToOrder(orderId: string, payload: unknown) {
    const io = this.getIO();
    io.to(orderId).emit(SOCKET_EVENT.ORDER_EVENT, payload);
    io.to(orderId).emit(SOCKET_EVENT.ORDER_OTHER_EVENT, payload);
  }

  emitToCashier(outletId: string, payload: any) {
    const io = this.getIO();
    io.to(outletId).emit(SOCKET_EVENT.ORDER_EVENT, payload)
  }

  emitQueueUpdate(
    outletId: string,
    data: {
      queue: any[];
      updatedOrderId?: string;
      generatedAt?: string;
    },
  ) {
    const io = this.getIO();
    io.to(outletId).emit(SOCKET_EVENT.QUEUE_UPDATED, {
      outletId,
      updatedOrderId: data.updatedOrderId,
      generatedAt: data.generatedAt ?? new Date().toISOString(),
      queue: data.queue,
    });
  }

  emitNotificationToOutlet(
    outletId: string,
    payload: {
      message: string;
      timestamp: Date;
    },
  ) {
    const io = this.getIO();
    io.to(outletId).emit(SOCKET_EVENT.NOTIFICATION_UPDATE, payload);
    Console.log(`Send Event To Outlet:`, outletId);
  }
}
