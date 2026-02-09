import { BookingSlotStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import { db } from "../config/prisma";
import { getRabbitMQChannel } from "../config/rabbitmq";
import { messagePublisher } from "./message-publisher.service";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { OrderRepository } from "../repositories/order.repository";
import { CreateOrderInput } from "../schemas/order.schema";
import { createMidtransTransactionService } from "./payment.service";
import { getOutletByIdService } from "./outlet.service";
import { getBusinessByIdService } from "./business.service"; // Impor service bisnis
import { BookingRepository } from "../repositories/booking.repository";
import { createOrderRecord } from "./helpers/order-create.helper";
import { PaymentRepository } from "../repositories/payment.repository";
import { SocketEmitter } from "../socket/socket-emiiter";
import { MidtransTransactionStatus, PaymentResponse } from "../types/Others";
import Console from "../utils/logger";
import { paymentQueue } from "../queues/payment.queue";
import { formatDateTime } from "../utils";

type OrderWithRelations = NonNullable<Awaited<ReturnType<typeof OrderRepository.findById>>> &
  Record<string, any>;

type ProductWithRelations = NonNullable<Awaited<ReturnType<typeof OrderRepository.findById>>> &
  Record<string, any>;
type CustomerOrderRecord = Awaited<
  ReturnType<typeof OrderRepository.getOrderByCustomerPhone>
>[number] &
  Record<string, any>;

const SERVICE_QUEUE_STATUSES: OrderStatus[] = [
  OrderStatus.AWAITING_PAYMENT,
  OrderStatus.PROCESSING,
  OrderStatus.CONFIRMED,
  OrderStatus.READY,
  OrderStatus.ON_GOING,
];

const SERVICE_QUEUE_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.AWAITING_PAYMENT]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.ON_GOING, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.ON_GOING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

interface QueueMetaPayload {
  position: number;
  totalAhead: number;
  totalOrders: number;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  status: OrderStatus;
}

interface QueueSnapshotEntry {
  order: OrderWithRelations;
  position: number;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  total: number;
}

const queueOrderInclude = {
  items: {
    include: {
      product: {
        include: {
          service: true,
        },
      },
      bookingSlot: {
        include: {
          // staff: true, // Removed as BookingSlot does not have staff relation
        },
      },
    },
  },
  guestCustomer: true,
  outlet: true,
  transaction: true,
  handledByStaff: true,
} as const;

const hasServiceProduct = (order: Pick<OrderWithRelations, "items"> | CustomerOrderRecord) =>
  (order.items ?? []).some((item: any) => item.product?.type === "SERVICE");

const computeQueueSchedule = (
  order: Pick<OrderWithRelations, "items" | "bookingDate" | "createdAt" | "product">,
) => {
  // Look for booking slot in items
  const bookingSlot = order.items?.find((item: any) => item.bookingSlot)?.bookingSlot;

  const slotStart = bookingSlot?.startTime ? new Date(bookingSlot.startTime) : null;
  const slotEnd = bookingSlot?.endTime ? new Date(bookingSlot.endTime) : null;
  const bookingDate = order.bookingDate ? new Date(order.bookingDate) : null;
  const baseStartSource = slotStart ?? bookingDate ?? order.createdAt;
  const start = new Date(baseStartSource);

  if (!slotEnd) {
    const durationMinutes =
      order.items?.find((item: any) => item.product?.type === "SERVICE")?.product?.service
        ?.durationMinutes ?? 60;
    const derivedEnd = new Date(start);
    derivedEnd.setMinutes(derivedEnd.getMinutes() + durationMinutes);
    return { start, end: derivedEnd };
  }

  return { start, end: new Date(slotEnd) };
};

async function buildServiceQueueSnapshot(outletId: string): Promise<QueueSnapshotEntry[]> {
  const queueOrders = (await db.order.findMany({
    where: {
      outletId,
      orderStatus: { in: SERVICE_QUEUE_STATUSES },
      items: { some: { product: { type: "SERVICE" } } },
    },
    include: queueOrderInclude,
  })) as OrderWithRelations[];

  if (!queueOrders.length) {
    return [];
  }

  const enriched = queueOrders.map((order) => {
    const schedule = computeQueueSchedule(order as any);
    const sortAnchor = schedule.start ?? new Date(order.createdAt);
    return {
      order,
      schedule,
      sortValue: sortAnchor.getTime(),
    };
  });

  enriched.sort((a, b) => {
    if (a.sortValue !== b.sortValue) {
      return a.sortValue - b.sortValue;
    }
    return a.order.createdAt.getTime() - b.order.createdAt.getTime();
  });

  const total = enriched.length;

  return enriched.map((entry, index) => ({
    order: entry.order,
    position: index + 1,
    scheduledStart: entry.schedule.start,
    scheduledEnd: entry.schedule.end,
    total,
  }));
}

async function resolveQueueMetaForOrder(
  order: OrderWithRelations | CustomerOrderRecord,
  cache: Map<string, QueueSnapshotEntry[]>,
): Promise<QueueMetaPayload | null> {
  const status = order.orderStatus as OrderStatus;
  if (!hasServiceProduct(order) || !SERVICE_QUEUE_STATUSES.includes(status)) {
    return null;
  }

  if (!cache.has(order.outletId)) {
    cache.set(order.outletId, await buildServiceQueueSnapshot(order.outletId));
  }

  const snapshot = cache.get(order.outletId)!;
  const entry = snapshot.find((item) => item.order.id === order.id);

  if (!entry) {
    return null;
  }

  return {
    position: entry.position,
    totalAhead: Math.max(0, entry.position - 1),
    totalOrders: snapshot.length,
    scheduledStart: entry.scheduledStart ? entry.scheduledStart.toISOString() : null,
    scheduledEnd: entry.scheduledEnd ? entry.scheduledEnd.toISOString() : null,
    status,
  };
}

const serializeQueueOrder = (entry: QueueSnapshotEntry) => {
  const { order, position, scheduledStart, scheduledEnd, total } = entry;

  const queueMeta: QueueMetaPayload = {
    position,
    totalAhead: Math.max(0, position - 1),
    totalOrders: total,
    scheduledStart: scheduledStart ? scheduledStart.toISOString() : null,
    scheduledEnd: scheduledEnd ? scheduledEnd.toISOString() : null,
    status: order.orderStatus,
  };

  // Flatten bookingSlot and assignedStaff for frontend compatibility
  const bookingSlot = order.items?.find((item: any) => item.bookingSlot)?.bookingSlot;
  const assignedStaff = order.handledByStaff;

  return {
    ...order,
    bookingSlot,
    assignedStaff,
    position,
    queueNumber: position,
    queueMeta,
  } as OrderWithRelations & { position: number; queueNumber: number; queueMeta: QueueMetaPayload };
};

// List goods orders by outlet with optional status filter and pagination
export async function getGoodsOrdersByOutletService(
  outletId: string,
  userIdentifier: string,
  options?: { status?: OrderStatus; page?: number; limit?: number },
  validateAsOwner: boolean = true,
) {
  const page = Math.max(1, options?.page || 1);
  const limit = Math.min(100, Math.max(1, options?.limit || 20));
  const skip = (page - 1) * limit;

  // Ownership/Access validation
  if (validateAsOwner) {
    const outlet = await getOutletByIdService(outletId);
    const business = await getBusinessByIdService(outlet.businessId);
    if (business.ownerId !== userIdentifier) {
      throw new AppError("Anda tidak berhak mengakses outlet ini.", HttpStatus.FORBIDDEN);
    }
  } else {
    // Validasi untuk kasir
    if (userIdentifier !== outletId) {
      throw new AppError(
        "Anda hanya bisa mengakses pesanan outlet Anda sendiri.",
        HttpStatus.FORBIDDEN,
      );
    }
  }

  const baseWhere = {
    outletId,
    ...(options?.status ? { orderStatus: options.status } : {}),
    items: {
      some: {
        product: { type: "GOODS" },
      },
    },
  } as const;

  const [total, orders] = await db.$transaction([
    db.order.count({ where: baseWhere as any }),
    db.order.findMany({
      where: baseWhere as any,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        items: { include: { product: true } },
        guestCustomer: true,
        transaction: {
          select: {
            paymentProofUrl: true,
          },
        },
      },
    }),
  ]);

  return {
    data: orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// List service queue by outlet (READY orders with SERVICE items), ordered by createdAt asc and position
export async function getServiceQueueByOutletService(
  outletId: string,
  userIdentifier: string,
  options?: { page?: number; limit?: number },
  validateAsOwner: boolean = true,
) {
  const page = Math.max(1, options?.page || 1);
  const limit = Math.min(100, Math.max(1, options?.limit || 50));
  const skip = (page - 1) * limit;

  // Ownership/Access validation
  if (validateAsOwner) {
    // Validasi untuk owner - userIdentifier adalah ownerId
    const outlet = await getOutletByIdService(outletId);
    const business = await getBusinessByIdService(outlet.businessId);
    if (business.ownerId !== userIdentifier) {
      throw new AppError("Anda tidak berhak mengakses outlet ini.", HttpStatus.FORBIDDEN);
    }
  } else {
    // Validasi untuk kasir - userIdentifier adalah outletId dari session kasir
    if (userIdentifier !== outletId) {
      throw new AppError(
        "Anda hanya bisa mengakses antrian outlet Anda sendiri.",
        HttpStatus.FORBIDDEN,
      );
    }
  }

  const snapshot = await buildServiceQueueSnapshot(outletId);
  const total = snapshot.length;
  const pageEntries = snapshot.slice(skip, skip + limit).map(serializeQueueOrder);

  return {
    data: pageEntries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOrderReceiptService(id: string) {
  const orderData = await OrderRepository.receiptData(id);
  const { date, time } = formatDateTime(orderData?.createdAt.toISOString()!);
  const items = orderData?.items.map((item) => ({
    name: item.product.name,
    qty: item.quantity,
    unit: item.product.goods?.unit ?? "",
    price: item.priceAtTimeOfOrder,
    subtotal: item.quantity * item.priceAtTimeOfOrder,
  }));
  const totalQty = orderData?.items.reduce((prev, item) => {
    return prev + item.quantity;
  }, 0);

  return {
    storeName: orderData?.outlet.name,
    address: orderData?.outlet.address,
    phone: orderData?.outlet.phone,
    transactionId: orderData?.id,
    date,
    time,
    orderNo: "-",
    cashier: orderData?.handledByStaff?.name ?? "-",
    customerName: orderData?.guestCustomer.name ?? "-",
    shippingAddress: "-",
    items,
    totalQty,
    subTotal: orderData?.totalAmount,
    total: orderData?.totalAmount,
    printHeight: orderData?.outlet.receiptSettings?.printHeight,
    printWidth: orderData?.outlet.receiptSettings?.printWidth,
    showLogo: orderData?.outlet.receiptSettings?.showLogo,
    photoString: orderData?.outlet.receiptSettings?.photoString,
  };
}

export async function getOrderByIdService(id: string, ownerId?: string) {
  const order = await OrderRepository.findById(id);
  if (!order) {
    throw new AppError(Messages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  // SECURITY FIX: Validate ownership if ownerId is provided
  if (ownerId) {
    const outlet = await getOutletByIdService(order.outletId);
    const business = await getBusinessByIdService(outlet.businessId);

    if (business.ownerId !== ownerId) {
      throw new AppError("Anda tidak berhak mengakses pesanan ini.", HttpStatus.FORBIDDEN);
    }
  }

  return order;
}

export async function refundOrderService(orderId: string) {
  const order = await getOrderByIdService(orderId);

  if (order?.paymentStatus === "REFUNDED") {
    throw new AppError("Pesanan ini sudah di-refund.", HttpStatus.BAD_REQUEST);
  }

  return db.$transaction(async (tx) => {
    // 1. Update order status
    const refundedOrder = await tx.order?.update({
      where: { id: orderId },
      data: { paymentStatus: "REFUNDED" },
    });

    // 2. Create an expense entry for the refund
    await tx.expense.create({
      data: {
        outletId: order?.outletId,
        description: `Refund untuk pesanan #${order?.id}`,
        amount: order?.totalAmount,
        date: new Date(),
      },
    });

    return refundedOrder;
  });
}

export async function createOrderAndMidtransTransactionService(data: CreateOrderInput) {
  const { paymentMethod } = data;

  if (data.bookingSlotId) {
    const slot = await BookingRepository.getSlots(data.bookingSlotId);

    if (!slot) throw new AppError(Messages.BOOKING_SLOT_NOT_FOUND, HttpStatus.NOT_FOUND);
    if (slot.status === "BOOKED")
      throw new AppError(Messages.BOOKING_SLOT_ALREADY_BOOKED, HttpStatus.CONFLICT);
    // if (slot.product.outletId !== data.outletId) {
    //   throw new AppError("Slot tidak berada pada outlet ini.", HttpStatus.FORBIDDEN);
    // }
    // if (slot.staffId && data.staffId && slot.staffId !== data.staffId) {
    //   throw new AppError("Slot ini sudah dialokasikan ke staff lain.", HttpStatus.CONFLICT);
    // }

    // Lock slot untuk mencegah race condition
    await BookingRepository.update(slot.id, {
      status: "BOOKED",
      staffId: null,
    });
  }

  // Jika payment method adalah 'cash', buat order offline tanpa Midtrans
  if (paymentMethod === "cash") {
    const { order } = await createOrderRecord(data);

    const updatedOrder = await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.SUCCESS,
        orderStatus: OrderStatus.READY,
      },
    });

    return { order: updatedOrder, midtransTransaction: undefined as any };
  }

  // Default flow: gunakan Midtrans untuk pembayaran online/QRIS
  const { order, midtransFee, appFee, feeBearer, totalAmount } = await createOrderRecord(data);

  const chargeTo = feeBearer.toLowerCase() as "customer" | "owner";

  const midtransTransaction = await createMidtransTransactionService(
    order.id,
    totalAmount,
    midtransFee,
    appFee,
    paymentMethod as "online" | "qris",
    chargeTo,
  );

  const updatedOrder = await db.order.update({
    where: { id: order.id },
    data: {
      midtransTransactionToken: midtransTransaction.token,
      midtransRedirectUrl: midtransTransaction.redirect_url,
    },
  });

  return { order: updatedOrder, midtransTransaction };
}

export async function updateOrderStatusService(
  orderId: string,
  status: OrderStatus,
  reason?: string,
) {
  // Get order with all relations needed
  const orderData = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
          bookingSlot: true,
        },
      },
      guestCustomer: true,
      outlet: true,
      transaction: true,
      handledByStaff: true,
    },
  });

  if (!orderData) {
    throw new Error("Order not found");
  }

  const order = orderData as any;

  // Handle CANCELLED status - release resources
  if (status === OrderStatus.CANCELLED) {
    await db.$transaction(async (tx) => {
      // Release booking slot and staff
      const bookingSlot = order.items?.find((item: any) => item.bookingSlot)?.bookingSlot;
      if (bookingSlot) {
        await tx.bookingSlot.update({
          where: { id: bookingSlot.id },
          data: {
            status: BookingSlotStatus.AVAILABLE,
            orderItemId: null, // Release order item link
          },
        });
      }

      // Cancel transaction if exists
      if (order.transaction?.id) {
        await tx.transaction.update({
          where: { id: order.transaction.id },
          data: {
            status: PaymentStatus.CANCELLED,
          },
        });
      }

      // Return stock for GOODS items
      for (const item of order.items) {
        if (item.product.type === "GOODS") {
          await tx.productGoods.update({
            where: { productId: item.productId },
            data: {
              currentStock: {
                increment: item.quantity,
              },
            },
          });
        }
      }
    });
  }

  if (status === OrderStatus.PROCESSING) {
    Console.log("UPDATE TRANSACTION STATUS TO SUCCESS");

    if (order.transaction?.id) {
      await db.transaction.update({
        where: {
          id: order.transaction.id,
        },
        data: { status: PaymentStatus.SUCCESS },
      });
    }
  }

  const bookingSlot = order.items?.find((item: any) => item.bookingSlot)?.bookingSlot;
  if (status === "COMPLETED" && bookingSlot) {
    await db.bookingSlot.update({
      where: { id: bookingSlot.id },
      data: {
        status: "AVAILABLE",
        // staffId: null, // Removed as BookingSlot does not have staffId
      },
    });
  }

  const updatePayload = {
    orderStatus: status,
    ...(reason && status === OrderStatus.CANCELLED ? { cancellationReason: reason } : {}),
    ...(status === OrderStatus.PROCESSING ? { paymentStatus: PaymentStatus.SUCCESS } : {}),
    ...(status === OrderStatus.CANCELLED ? { paymentStatus: PaymentStatus.CANCELLED } : {}),
  };
  Console.log(`[SERVICE] Updating Order ${orderId} with payload:`, JSON.stringify(updatePayload));

  // Update pesanan dengan include data yang diperlukan
  const updatedOrder = await db.order.update({
    where: { id: orderId },
    data: updatePayload,
    include: {
      items: {
        include: {
          product: {
            include: {
              goods: true,
              service: true,
            },
          },
        },
      },
      outlet: true,
      guestCustomer: true,
      transaction: true,
    },
  });

  // // Kirim notifikasi status update melalui message publisher
  // await messagePublisher.publishOrderNotification(updatedOrder.id, updatedOrder.orderStatus);

  // Broadcast status update ke customer melalui socket
  try {
    const customerPhone = updatedOrder.guestCustomer?.phone;
    if (customerPhone) {
      const statusMessages: Partial<Record<OrderStatus, string>> = {
        AWAITING_PAYMENT: "Menunggu pembayaran",
        PROCESSING: "Pesanan sedang diproses",
        READY: "Pesanan siap diambil",
        COMPLETED: "Pesanan selesai",
        CANCELLED: "Pesanan dibatalkan",
        CONFIRMED: "Pesanan dikonfirmasi",
      };

      SocketEmitter.getInstance().emitToCustomer(customerPhone, {
        orderId: updatedOrder.id,
        amount: updatedOrder.totalAmount,
        status,
        transactionStatus: status,
        isManual: Boolean(updatedOrder.transaction?.isManual),
        paymentMethod: updatedOrder.transaction?.paymentMethod || "unknown",
        message: statusMessages[status] ?? "Status pesanan diperbarui",
        type: "order_status_update",
        cancellationReason: reason,
      });
    }
  } catch (customerSocketError) {
    console.error("❌ Error emitting customer order status event:", customerSocketError);
  }

  // Broadcast updated queue snapshot to outlet listeners
  try {
    if (hasServiceProduct(updatedOrder as any)) {
      const snapshot = await buildServiceQueueSnapshot(updatedOrder.outletId);
      SocketEmitter.getInstance().emitQueueUpdate(updatedOrder.outletId, {
        updatedOrderId: updatedOrder.id,
        queue: snapshot.map(serializeQueueOrder),
      });
    }
  } catch (queueSocketError) {
    console.error("❌ Error emitting outlet queue snapshot:", queueSocketError);
  }

  // Jika status diubah menjadi COMPLETED dan ini adalah pesanan layanan
  if (
    status === "COMPLETED" &&
    updatedOrder.items.some((item) => item.product.type === "SERVICE")
  ) {
    // Dapatkan antrian untuk outlet yang sama
    const queuedOrders = await db.order.findMany({
      where: {
        outletId: updatedOrder.outletId,
        orderStatus: OrderStatus.READY,
        items: {
          some: {
            product: {
              type: "SERVICE",
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        guestCustomer: true,
      },
    });

    // Update posisi antrian untuk semua pesanan yang tersisa
    for (let i = 0; i < queuedOrders.length; i++) {
      const queuedOrder = queuedOrders[i];
      if (queuedOrder.guestCustomer?.phone) {
        const channel = getRabbitMQChannel();
        await channel.publish(
          "notification_exchange",
          "",
          Buffer.from(
            JSON.stringify({
              type: "queue_position",
              data: {
                phone: queuedOrder.guestCustomer.phone,
                position: i + 1,
              },
            }),
          ),
          { persistent: true },
        );
      }
    }
  }

  return updatedOrder;
}

export async function completeServiceOrderService(orderId: string) {
  // 1. Update status pesanan menjadi COMPLETED
  const completedOrder = await db.order.update({
    where: { id: orderId },
    data: { orderStatus: OrderStatus.COMPLETED },
    include: {
      items: { include: { product: true } },
      outlet: true,
    },
  });

  // 2. Periksa apakah pesanan yang selesai adalah pesanan layanan
  const hasServiceProduct = completedOrder.items.some((item) => item.product.type === "SERVICE");

  // 3. Jika ya, picu ulang pengecekan antrian untuk outlet tersebut
  if (hasServiceProduct) {
    // Dapatkan daftar pesanan dalam antrian untuk outlet ini
    const queuedOrders = await db.order.findMany({
      where: {
        outletId: completedOrder.outletId,
        orderStatus: OrderStatus.READY,
        items: {
          some: {
            product: {
              type: "SERVICE",
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        guestCustomer: true,
      },
    });

    // Publish message untuk mengecek ulang antrian
    await messagePublisher.publishServiceOrderRecheck(completedOrder.id);

    // Kirim notifikasi ke pesanan berikutnya dalam antrian jika ada
    if (queuedOrders.length > 0) {
      const nextOrder = queuedOrders[0];
      if (nextOrder.guestCustomer?.phone) {
        // Kirim notifikasi bahwa giliran mereka sudah dekat
        const channel = getRabbitMQChannel();
        await channel.publish(
          "notification_exchange",
          "",
          Buffer.from(
            JSON.stringify({
              type: "queue_position",
              data: {
                phone: nextOrder.guestCustomer.phone,
                position: 1,
              },
            }),
          ),
          { persistent: true },
        );
      }
    }
  }

  return completedOrder;
}

export async function getOrderByCustomerPhoneService(phone: string) {
  const customerOrder = await OrderRepository.getOrderByCustomerPhone(phone);

  if (!customerOrder || customerOrder.length === 0)
    throw new AppError(Messages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);

  const queueCache = new Map<string, QueueSnapshotEntry[]>();

  const mappedOrders = await Promise.all(
    customerOrder.map(async (order) => {
      const queueMeta = await resolveQueueMetaForOrder(order, queueCache);
      return mapPublicOrderResponse(order, queueMeta);
    }),
  );

  return mappedOrders;
}

const normalizePhoneNumber = (phone?: string | null) => {
  if (!phone) return "";
  const digitsOnly = phone.replace(/[^0-9]/g, "");
  if (digitsOnly.startsWith("62")) return digitsOnly;
  if (digitsOnly.startsWith("0")) return `62${digitsOnly.slice(1)}`;
  return digitsOnly;
};

const mapPublicOrderResponse = (
  order: OrderWithRelations | CustomerOrderRecord,
  queueMeta?: QueueMetaPayload | null,
) => {
  const { guestCustomer, transaction, items, outlet, handledByStaff, ...otherOrder } =
    order as OrderWithRelations & CustomerOrderRecord;

  const bookingSlot = (items ?? []).find((item: any) => item.bookingSlot)?.bookingSlot;
  const assignedStaff = handledByStaff;

  const mappedTransaction = transaction
    ? {
      ...transaction,
      expiryTime: transaction.expiresAt
        ? transaction.expiresAt instanceof Date
          ? transaction.expiresAt.toISOString()
          : transaction.expiresAt
        : ((transaction as any).expiryTime ?? null),
    }
    : null;

  const mappedItems = (items ?? []).map((item: any) => ({
    ...item,
    product: {
      ...item.product,
    },
  }));

  const mappedBookingSlot = bookingSlot
    ? {
      ...bookingSlot,
      startTime:
        bookingSlot.startTime instanceof Date
          ? bookingSlot.startTime.toISOString()
          : bookingSlot.startTime,
      endTime:
        bookingSlot.endTime instanceof Date
          ? bookingSlot.endTime.toISOString()
          : bookingSlot.endTime,
      date: bookingSlot.date instanceof Date ? bookingSlot.date.toISOString() : bookingSlot.date,
      staff: null, // staff is not on booking slot schema
    }
    : null;

  const normalizedOrder = {
    ...otherOrder,
    bookingDate:
      otherOrder.bookingDate instanceof Date
        ? otherOrder.bookingDate.toISOString()
        : (otherOrder.bookingDate ?? null),
    createdAt:
      otherOrder.createdAt instanceof Date
        ? otherOrder.createdAt.toISOString()
        : otherOrder.createdAt,
    updatedAt:
      otherOrder.updatedAt instanceof Date
        ? otherOrder.updatedAt.toISOString()
        : otherOrder.updatedAt,
  };

  return {
    ...normalizedOrder,
    bookingSlot: mappedBookingSlot,
    outlet: outlet ? { ...outlet } : null,
    transaction: mappedTransaction,
    items: mappedItems,
    customerDetails: guestCustomer ? { ...guestCustomer } : null,
    assignedStaff: assignedStaff ? { ...assignedStaff } : null,
    queueMeta: queueMeta ?? null,
    cancellationReason: otherOrder.cancellationReason,
  };
};

const assertCustomerOwnsOrder = (order: OrderWithRelations, phone: string) => {
  const providedPhone = normalizePhoneNumber(phone);
  const orderPhone = normalizePhoneNumber(order?.guestCustomer?.phone);

  if (!providedPhone || !orderPhone || providedPhone !== orderPhone) {
    throw new AppError("Pesanan tidak ditemukan untuk nomor telepon ini", HttpStatus.FORBIDDEN);
  }
};

export async function cancelOrderByCustomerService(
  orderId: string,
  phone: string,
  reason?: string,
) {
  const order = await OrderRepository.findById(orderId);

  if (!order) throw new AppError(Messages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);

  const orderRecord = order as OrderWithRelations;

  assertCustomerOwnsOrder(orderRecord, phone);
  (await paymentQueue.getJob(orderId))?.remove();

  const cancellableStatuses: OrderStatus[] = [
    OrderStatus.AWAITING_PAYMENT,
    OrderStatus.PROCESSING,
    OrderStatus.CONFIRMED,
  ];

  if (!cancellableStatuses.includes(orderRecord.orderStatus)) {
    throw new AppError(
      "Pesanan tidak dapat dibatalkan pada status saat ini",
      HttpStatus.BAD_REQUEST,
    );
  }

  if (reason) {
    Console.log(`[CUSTOMER CANCEL] Order ${orderId} cancellation reason: ${reason}`);
  }

  const updatedOrder = await db.$transaction(async (tx) => {
    for (const item of orderRecord.items) {
      if (item.product.type === "GOODS") {
        await tx.productGoods.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    if (orderRecord.bookingSlot) {
      await tx.bookingSlot.update({
        where: { id: orderRecord.bookingSlot.id },
        data: {
          status: BookingSlotStatus.AVAILABLE,
          orderItemId: null,
        },
      });
    }

    if (orderRecord.transaction) {
      await tx.transaction.update({
        where: { id: orderRecord.transaction.id },
        data: {
          status: PaymentStatus.CANCELLED,
        },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        orderStatus: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.CANCELLED,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        guestCustomer: true,
        outlet: true,
        transaction: true,
      },
    });
  });

  SocketEmitter.getInstance().emitNotificationToOutlet(order.outletId, {
    message: `Pesanan ${orderId}, telah dibatalkan customer`,
    timestamp: new Date(),
  });
  return mapPublicOrderResponse(updatedOrder as OrderWithRelations);
}

export async function updateServiceQueueStatusService(
  orderId: string,
  userIdentifier: string,
  nextStatus: OrderStatus,
  validateAsOwner: boolean = true,
  reason?: string,
) {
  // Ambil order terlebih dahulu
  const order = await OrderRepository.findById(orderId);
  if (!order) {
    throw new AppError(Messages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  // Validasi akses
  if (validateAsOwner) {
    // Validasi untuk owner
    const outlet = await getOutletByIdService(order.outletId);
    const business = await getBusinessByIdService(outlet.businessId);
    if (business.ownerId !== userIdentifier) {
      throw new AppError("Anda tidak berhak mengakses pesanan ini.", HttpStatus.FORBIDDEN);
    }
  } else {
    // Validasi untuk kasir - userIdentifier adalah outletId
    if (order.outletId !== userIdentifier) {
      throw new AppError(
        "Anda hanya bisa mengakses pesanan outlet Anda sendiri.",
        HttpStatus.FORBIDDEN,
      );
    }
  }

  const orderRecord = order as OrderWithRelations;

  if (!hasServiceProduct(orderRecord)) {
    throw new AppError(
      "Perubahan status hanya berlaku untuk pesanan layanan",
      HttpStatus.BAD_REQUEST,
    );
  }

  if (orderRecord.orderStatus === nextStatus) {
    return orderRecord;
  }

  const allowedNext = SERVICE_QUEUE_TRANSITIONS[orderRecord.orderStatus] ?? [];
  if (!allowedNext.includes(nextStatus)) {
    throw new AppError("Transisi status tidak valid untuk pesanan ini", HttpStatus.BAD_REQUEST);
  }

  // Block confirming manual payment if no proof uploaded
  if (
    orderRecord.orderStatus === OrderStatus.AWAITING_PAYMENT &&
    nextStatus === OrderStatus.PROCESSING
  ) {
    const tx = (orderRecord as any).transaction;
    if (tx?.isManual && !tx?.paymentProofUrl) {
      throw new AppError(
        "Tidak dapat mengkonfirmasi pembayaran. Bukti pembayaran belum dikirimkan oleh customer.",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Block advancing beyond PROCESSING for future-date bookings
  const REQUIRES_TODAY: OrderStatus[] = [
    OrderStatus.READY,
    OrderStatus.ON_GOING,
    OrderStatus.COMPLETED,
  ];

  if (REQUIRES_TODAY.includes(nextStatus)) {
    const bookingSlot = (orderRecord as any).items?.find(
      (item: any) => item.bookingSlot,
    )?.bookingSlot;
    const bookingDate = (orderRecord as any).bookingDate;

    const scheduledDate = bookingSlot?.startTime
      ? new Date(bookingSlot.startTime)
      : bookingDate
        ? new Date(bookingDate)
        : null;

    if (scheduledDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const schedDay = new Date(scheduledDate);
      schedDay.setHours(0, 0, 0, 0);

      if (schedDay.getTime() > today.getTime()) {
        const formatted = schedDay.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        throw new AppError(
          `Pesanan ini dijadwalkan untuk ${formatted}. Tidak dapat mengubah status menjadi ${nextStatus === OrderStatus.READY ? "Siap" : nextStatus === OrderStatus.ON_GOING ? "Sedang Dilayani" : "Selesai"} sebelum tanggal jadwal.`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  const updatedOrder = await updateOrderStatusService(orderId, nextStatus, reason);
  return updatedOrder;
}

export async function confirmOrderByCustomerService(orderId: string, phone: string) {
  const order = await OrderRepository.findById(orderId);

  if (!order) throw new AppError(Messages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);

  const orderRecord = order as OrderWithRelations;

  assertCustomerOwnsOrder(orderRecord, phone);

  const confirmableStatuses: OrderStatus[] = [OrderStatus.READY, OrderStatus.ON_GOING];

  if (!confirmableStatuses.includes(orderRecord.orderStatus)) {
    throw new AppError("Pesanan belum dapat dikonfirmasi", HttpStatus.BAD_REQUEST);
  }

  const updatedOrder = await updateOrderStatusService(orderId, OrderStatus.COMPLETED);

  return mapPublicOrderResponse(updatedOrder as OrderWithRelations);
}

export async function expirePaymentOrder(orderId: string) {
  const orderData = await db.order.findUnique({
    where: { id: orderId },
    include: {
      guestCustomer: true,
      transaction: true,
    },
  });

  if (!orderData) throw new AppError(`Order: ${orderId} NOT FOUND`);

  const order = orderData as OrderWithRelations;

  if (
    order.transaction &&
    order.transaction.status !== "PENDING" &&
    order.paymentStatus !== "PENDING"
  ) {
    console.log(`Payment ${orderId} is already ${order.transaction.status}, skipping expiration`);
    return;
  }

  await PaymentRepository.updatePaymentStatusByOrder(orderId, `EXPIRED`);
  SocketEmitter.getInstance().emitToOrder(orderId, {
    message: `Payment for ${orderId} has expired`,
    order_id: orderId,
  });
  SocketEmitter.getInstance().emitNotificationToOutlet(order.outletId, {
    message: `Pembayaran untuk OrderID: ${orderId}, telah kadaluarsa`,
    timestamp: new Date(),
  });
  SocketEmitter.getInstance().emitToCustomer(order.guestCustomer!.phone!, {
    orderId,
    amount: order.totalAmount,
    status: "expired",
    transactionStatus: "expired",
    paymentMethod: order.transaction?.paymentMethod || "unknown",
    isManual: order.transaction?.isManual || false,
    message: "Pembayaran kedaluwarsa",
    type: "payment_expired",
  });

  (await paymentQueue.getJob(orderId))?.remove();
}
