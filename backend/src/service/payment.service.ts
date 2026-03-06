import path from "path";
import { snap, coreApi } from "../config/midtrans";
import { getOrderByIdService } from "./order.service";
import { db } from "../config/prisma";
import { config } from "../config";
import {
  PaymentStatus,
  Order,
  OrderItem,
  Product,
  GuestCustomer,
  ManualPaymentType,
  OrderStatus,
} from "@prisma/client";
import { messagePublisher } from "./message-publisher.service";
import { CreatePaymentPayload } from "../schemas/payment-v2.schema";
import {
  paymentMethod,
  MidtransPaymentMethod,
  PaymentMethodId,
  paymentMethodMapping,
} from "../constants/payment-method";
import { OutletRepository } from "../repositories/outlet.repository";
import { ProductRepository } from "../repositories/product.repository";
import { generateOrderCode } from "../utils";
import Console from "../utils/logger";
import {
  MidtransItem,
  MidtransPayload,
  MidtransWebhookPayloadType,
  PaymentResponse,
} from "../types/Others";
import { mappingTransactionStatusForMidtrans } from "../utils/mapping";
import { AppError } from "../errors/app-error";
import { Messages } from "../constants/message";
import { HttpStatus } from "../constants/http-status";
import { socketUtils } from "../utils/socket.utils";
import { ManualPaymentRepository } from "../repositories/manual-payment.repository";
import { buildMidtransCorePayload } from "../utils/midtrans-core.utils";
import { SocketEmitter } from "../socket/socket-emiiter";
import { schedulePaymentExpiration } from "../queues/payment.queue";
import { PaymentRepository } from "../repositories/payment.repository";
import { orderExpiryJob } from "../jobs/payment-expiry.job";
import { OperatingHoursRepository } from "../repositories/operating-hours.repository";
import { validateFileMagicBytes, deleteFile, fileExists } from "../utils/file.utils";

// Konstanta untuk fee rates
const TRANSACTION_FEE_RATE = 0.02;
const TRANSACTION_BANK_FEE_RATE = 4000;
const APPLICATION_FEE_RATE = 0.03;

type OrderWithDetails = Order & {
  items: (OrderItem & { product: Product })[];
  guestCustomer: GuestCustomer;
};

type OutletWithBusiness = Awaited<ReturnType<typeof OutletRepository.findById>>;

type ManualPaymentInstructions = {
  manualType: ManualPaymentType;
  outletName: string;
  businessName: string;
  qrImageUrl?: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  note?: string | null;
};

// Sub-fungsi untuk validasi dan prepare data
async function validateItemsAndPrepareData(inputItems: any[], outletId: string) {
  const productIds = inputItems.map((item) => item.productId);
  const [products, outlet] = await Promise.all([
    ProductRepository.findManyByIds(productIds),
    OutletRepository.findById(outletId),
  ]);

  if (!outlet) {
    throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const itemDetails: MidtransItem[] = [];
  let totalProductPrice = 0;

  for (const item of inputItems) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new AppError(Messages.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const priceProduct = () => {
      let price = 0;
      switch (product.type) {
        case "GOODS":
          price = product.goods?.sellingPrice ?? 0;
          break;
        case "SERVICE":
          price = product.service?.sellingPrice ?? 0;
          break;
        case "TICKET":
          price = product.ticket?.sellingPrice ?? 0;
          break;
        default:
          price = 0;
          break;
      }

      return price;
    };
    // (product.type === "GOODS" ? product.goods?.sellingPrice : product.service?.sellingPrice) ?? 0;

    const subtotal = priceProduct() * item.quantity;
    totalProductPrice += subtotal;

    itemDetails.push({
      id: product.id,
      name: product.name,
      price: priceProduct(),
      quantity: item.quantity,
    });
  }

  return { productMap, outlet, itemDetails, totalProductPrice };
}

// Sub-fungsi untuk hitung biaya
function calculateFees(totalProductPrice: number, outlet: any, payment_method: string) {
  let transactionFeeTotal: number = 0;
  let applicationFee: number = 0;
  let grossAmount: number = 0;

  if (payment_method.startsWith("qris") || payment_method.endsWith("-va")) {
    transactionFeeTotal =
      outlet.business.defaultTransactionFeeBearer === "CUSTOMER"
        ? payment_method.endsWith("-va")
          ? TRANSACTION_BANK_FEE_RATE
          : Math.floor(totalProductPrice * TRANSACTION_FEE_RATE)
        : 0;

    applicationFee = Math.floor(totalProductPrice * APPLICATION_FEE_RATE);
  }
  grossAmount = totalProductPrice + transactionFeeTotal + applicationFee;

  console.log(grossAmount, totalProductPrice);

  return { transactionFeeTotal, applicationFee, grossAmount };
}

function buildManualInstructions(
  outlet: OutletWithBusiness,
  manualType: ManualPaymentType,
): ManualPaymentInstructions {
  if (!outlet) {
    throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const baseInstruction: ManualPaymentInstructions = {
    manualType,
    outletName: outlet.name,
    businessName: outlet.business?.name ?? "",
  };

  if (manualType === ManualPaymentType.QRIS_OFFLINE) {
    if (!outlet.manualQrImageUrl) {
      throw new AppError(Messages.MANUAL_QRIS_NOT_CONFIGURED, HttpStatus.BAD_REQUEST);
    }
    return {
      ...baseInstruction,
      qrImageUrl: outlet.manualQrImageUrl,
    };
  }

  if (manualType === ManualPaymentType.OWNER_TRANSFER) {
    if (
      !outlet.business.bankAccount ||
      !outlet.business.bankName ||
      !outlet.business.accountHolder
    ) {
      throw new AppError(Messages.MANUAL_TRANSFER_NOT_CONFIGURED, HttpStatus.BAD_REQUEST);
    }

    return {
      ...baseInstruction,
      bankAccount: {
        bankName: outlet.business.bankName,
        accountNumber: outlet.business.bankAccount,
        accountHolder: outlet.business.accountHolder,
      },
    };
  }

  throw new AppError(Messages.MANUAL_PAYMENT_TYPE_UNKNOWN, HttpStatus.BAD_REQUEST);
}

async function createManualTransactionRecord(params: {
  orderId: string;
  amount: number;
  paymentMethodId: PaymentMethodId;
  manualType: ManualPaymentType;
  expiresAt: Date;
}) {
  return ManualPaymentRepository.createManualTransaction({
    amount: params.amount,
    paymentMethod: params.paymentMethodId,
    status: PaymentStatus.PENDING,
    isManual: true,
    manualMethod: params.manualType,
    expiresAt: params.expiresAt,
    externalId: params.orderId,
    order: {
      connect: {
        id: params.orderId,
      },
    },
  });
}

function toPublicUrl(filePath: string) {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
  return `${config.BASE_URL}/${relativePath}`;
}

function formatManualPaymentResponse(options: {
  order: OrderWithDetails;
  transactionId: string;
  manualType: ManualPaymentType;
  instructions: ManualPaymentInstructions;
  expiresAt: Date;
  grossAmount: number;
  fees: {
    applicationFee: number;
    transactionFee: number;
    subtotal: number;
  };
}) {
  return {
    order_id: options.order.id,
    transaction_id: options.transactionId,
    transaction_status: "pending",
    gross_amount: options.grossAmount,
    expiry_time: options.expiresAt.toISOString(),
    manual: {
      type: options.manualType,
      instructions: options.instructions,
      fee_summary: options.fees,
    },
    customer_details: {
      name: options.order.guestCustomer.name,
      phone: options.order.guestCustomer.phone,
    },
  };
}

// Sub-fungsi untuk create order dan items
// Delegates to repository which already wraps operations in a DB transaction.
async function createOrderAndItems(
  orderId: string,
  grossAmount: number,
  applicationFee: number,
  transactionFeeTotal: number,
  selectedSlotId: string | undefined,
  staffId: string | undefined,
  outletId: string,
  customerDetails: any,
  inputItems: any[],
  productMap: Map<string, Product>,
) {
  try {
    await PaymentRepository.createOrderWithItems({
      orderId,
      grossAmount,
      appFee: applicationFee,
      midtransFee: transactionFeeTotal,
      selectedSlotId: selectedSlotId ?? null,
      staffId: staffId ?? null,
      outletId,
      customer: { name: customerDetails.name, phone: customerDetails.phone },
      items: inputItems.map((it) => ({ productId: it.productId, quantity: it.quantity })),
    });
  } catch (err: any) {
    const msg = err && err.message ? String(err.message).toLowerCase() : "";

    if (msg.includes("stok") || msg.includes("stok tidak") || msg.includes("stock")) {
      throw new AppError(Messages.PRODUCT_OUT_OF_STOCK, HttpStatus.BAD_REQUEST);
    }

    if (msg.includes("booking slot required") || msg.includes("booking slot")) {
      throw new AppError(Messages.BOOKING_SLOT_REQUIRED, HttpStatus.BAD_REQUEST);
    }

    if (msg.includes("already booked") || msg.includes("booked") || msg.includes("blocked")) {
      throw new AppError(Messages.BOOKING_SLOT_ALREADY_BOOKED, HttpStatus.BAD_REQUEST);
    }

    if (msg.includes("product not found")) {
      throw new AppError(Messages.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // Re-throw unknown errors
    throw err;
  }
}

// Sub-fungsi untuk handle Midtrans charge
async function handleMidtransCharge(payload: MidtransPayload, orderId: string) {
  try {
    const midtransResponse = (await coreApi.charge(payload)) as MidtransWebhookPayloadType;
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
        orderId: orderId,
        status: mappingTransactionStatusForMidtrans(midtransResponse.transaction_status),
        rawMidtrans: midtransResponse,
      },
    });

    return midtransResponse;
  } catch (error) {
    await db.order.delete({
      where: {
        id: orderId,
      },
    });
    throw error;
  }
}

export async function createMidtransTransactionService(
  orderId: string,
  finalAmount: number,
  midtransFee: number,
  appFee: number,
  paymentMethod: "online" | "qris",
  chargedTo: "customer" | "owner",
) {
  const order = (await getOrderByIdService(orderId)) as OrderWithDetails;
  if (!order) {
    throw new Error("Order not found");
  }

  const itemDetails = order.items.map((item) => ({
    id: item.productId,
    name: item.product.name,
    price: Math.round(item.priceAtTimeOfOrder),
    quantity: item.quantity,
  }));

  // Selalu tambahkan biaya Midtrans sebagai item terpisah
  if (midtransFee > 0) {
    itemDetails.push({
      id: "midtrans_fee",
      name: "Biaya Admin Midtrans (1%)",
      price: midtransFee,
      quantity: 1,
    });
  }

  // Tambahkan biaya aplikasi sebagai item terpisah jika ada
  if (appFee > 0) {
    itemDetails.push({
      id: "app_fee",
      name: "Biaya Admin Aplikasi (3%)",
      price: appFee,
      quantity: 1,
    });
  }

  const calculatedGrossAmount = itemDetails.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);

  const parameter = {
    transaction_details: {
      order_id: order.id,
      gross_amount: calculatedGrossAmount,
    },
    customer_details: {
      first_name: order.guestCustomer.name,
      phone: order.guestCustomer.phone,
    },
    item_details: itemDetails,
    expiry: {
      unit: "minute",
      duration: 10,
    },
  };

  const transaction = await snap.createTransaction(parameter);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.transaction.create({
    data: {
      orderId: order.id,
      amount: calculatedGrossAmount,
      status: PaymentStatus.PENDING,
      externalId: transaction.token,
      paymentUrl: transaction.redirect_url,
      expiresAt: expiresAt,
    },
  });

  await schedulePaymentExpiration(order.id, expiresAt);

  // Emit notification to business outlet
  try {
    socketUtils.emitToBusinessOutlet(order.outletId, {
      type: "payment_created",
      orderId: order.id,
      amount: calculatedGrossAmount,
      paymentMethod: paymentMethod,
      customerName: order.guestCustomer.name,
      timestamp: new Date(),
    });
    console.log(`📡 Emitted payment_created event for outlet ${order.outletId}`);
  } catch (socketError) {
    console.error("❌ Error emitting payment_created event:", socketError);
  }

  return transaction;
}

export async function createQrisPaymentService(orderId: string) {
  const order = await getOrderByIdService(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const parameter = {
    payment_type: "qris",
    transaction_details: {
      order_id: order.id,
      gross_amount: order.totalAmount,
    },
    custom_expiry: {
      order_time: new Date().toISOString().slice(0, 19) + " +0700",
      expiry_duration: 15,
      unit: "minute",
    },
  };

  const chargeResponse = await coreApi.charge(parameter);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Save transaction details to our database
  await db.transaction.create({
    data: {
      orderId: order.id,
      amount: order.totalAmount,
      status: PaymentStatus.PENDING,
      externalId: chargeResponse.transaction_id,
      paymentUrl:
        chargeResponse.actions?.find((a: any) => a.name === "deeplink-redirect")?.url ||
        chargeResponse.actions?.find((a: any) => a.name === "generate-qr-code")?.url,
      expiresAt: expiresAt,
    },
  });

  await schedulePaymentExpiration(order.id, expiresAt);

  // Emit notification to business outlet
  try {
    SocketEmitter.getInstance().emitToBusinessOutlet(order.outletId, {
      amount: order.totalAmount,
      orderId: order.id,
      customerName: order.guestCustomer.name,
      paymentMethod: "qris",
      timestamp: new Date(),
    });
    console.log(`📡 Emitted payment_created event for outlet ${order.outletId}`);
  } catch (socketError) {
    console.error("❌ Error emitting payment_created event:", socketError);
  }

  return chargeResponse;
}

export async function createPaymentService(data: CreatePaymentPayload) {
  const {
    guestCustomer: customerDetails,
    items: inputItems,
    paymentMethod: payment_method,
    onlinePaymentChannel,
    bookingSlotId: selectedSlotId,
    staffId,
    outletId,
  } = data;

  // Validasi dan prepare data
  const {
    productMap,
    outlet,
    itemDetails: baseItemDetails,
    totalProductPrice,
  } = await validateItemsAndPrepareData(inputItems, outletId);

  // Hitung biaya - gunakan onlinePaymentChannel untuk online payment
  const paymentMethodForFees =
    payment_method === "online" && onlinePaymentChannel ? onlinePaymentChannel : payment_method;
  const { transactionFeeTotal, applicationFee, grossAmount } = calculateFees(
    totalProductPrice,
    outlet,
    paymentMethodForFees,
  );

  // Tambahkan item biaya ke detail
  const itemDetails = [...baseItemDetails];
  if (transactionFeeTotal > 0) {
    itemDetails.push({
      id: `transaction-fee-${outletId}`,
      name: "Biaya Transaksi",
      price: transactionFeeTotal,
      quantity: 1,
    });
  }
  itemDetails.push({
    id: "app_fee",
    name: "Biaya Aplikasi",
    price: applicationFee,
    quantity: 1,
  });

  const orderId: string = generateOrderCode({ name: outlet.name ?? "Order" });

  // Untuk online payment, gunakan onlinePaymentChannel untuk lookup method
  // Untuk manual payment (qris/cash), gunakan payment_method
  const paymentMethodIdForLookup =
    payment_method === "online" && onlinePaymentChannel
      ? onlinePaymentChannel
      : (payment_method as PaymentMethodId);

  const methodDefinition = paymentMethod.find((method) => method.id === paymentMethodIdForLookup);

  // Online Midtrans payments tidak perlu method definition (semua di midtrans now disabled)
  // Hanya manual payments yang perlu method definition
  const isOnlinePayment = payment_method === "online";

  if (!isOnlinePayment && !methodDefinition) {
    throw new AppError(Messages.PAYMENT_METHOD_NOT_FOUND, HttpStatus.BAD_REQUEST);
  }

  const manualType =
    methodDefinition && "manualType" in methodDefinition
      ? (methodDefinition.manualType as ManualPaymentType)
      : undefined;
  const isManualFlow = methodDefinition?.flow === "manual";

  if (isManualFlow && !manualType) {
    throw new AppError(Messages.MANUAL_PAYMENT_TYPE_UNKNOWN, HttpStatus.BAD_REQUEST);
  }

  // Create order dan items terlebih dahulu

  if (isManualFlow && manualType) {
    const instructions = buildManualInstructions(outlet, manualType);

    try {
      await createOrderAndItems(
        orderId,
        grossAmount,
        applicationFee,
        transactionFeeTotal,
        selectedSlotId,
        staffId,
        outletId,
        customerDetails,
        inputItems,
        productMap,
      );
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const transaction = await createManualTransactionRecord({
        orderId,
        amount: grossAmount,
        paymentMethodId: paymentMethodIdForLookup as PaymentMethodId,
        manualType,
        expiresAt,
      });

      const orderWithDetails = (await db.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: { product: true },
          },
          guestCustomer: true,
        },
      })) as OrderWithDetails | null;

      if (!orderWithDetails) {
        throw new AppError(Messages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      await db.order.update({
        where: { id: orderId },
        data: {
          orderStatus: OrderStatus.AWAITING_PAYMENT,
          paymentStatus: PaymentStatus.PENDING,
        },
      });

      try {
        // await paymentQueue.add({ orderId }, { delay });
        await orderExpiryJob.add(orderId);
        SocketEmitter.getInstance().emitToCashier(outletId, {
          orderId,
          amount: grossAmount,
          paymentMethod: manualType,
          customerName: customerDetails.name,
          timestamp: new Date(),
        });
        SocketEmitter.getInstance().emitToBusinessOutlet(outletId, {
          orderId,
          amount: grossAmount,
          paymentMethod: manualType,
          customerName: customerDetails.name,
          timestamp: new Date(),
        });
        SocketEmitter.getInstance().emitNotificationToOutlet(outletId, {
          message: `Pesanan baru, Order ID: ${orderId}`,
          timestamp: new Date(),
        });
        console.log(`📡 Emitted manual_payment_created event for outlet ${outletId}`);
      } catch (socketError) {
        console.error("❌ Error emitting manual_payment_created event:", socketError);
      }

      return formatManualPaymentResponse({
        order: orderWithDetails,
        transactionId: transaction.id,
        manualType,
        instructions,
        expiresAt,
        grossAmount,
        fees: {
          applicationFee,
          transactionFee: transactionFeeTotal,
          subtotal: totalProductPrice,
        },
      });
    } catch (error) {
      try {
        await PaymentRepository.restockAndCancelOrder(orderId);
        await db.order.delete({ where: { id: orderId } });
      } catch (cleanupError) {
        const message = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        if (!message.toLowerCase().includes("order not found")) {
          Console.error("Failed to rollback manual payment order", cleanupError);
        }
      }
      throw error;
    }
  }

  await createOrderAndItems(
    orderId,
    grossAmount,
    applicationFee,
    transactionFeeTotal,
    selectedSlotId,
    staffId,
    outletId,
    customerDetails,
    inputItems,
    productMap,
  );

  // Untuk online payment, gunakan onlinePaymentChannel untuk Midtrans mapping
  if (!onlinePaymentChannel) {
    throw new AppError("Online payment channel wajib diisi", HttpStatus.BAD_REQUEST);
  }

  // Map payment channel to Midtrans payment type
  // Format: "qris_dynamic" -> "qris", "va_bca" -> "bca_va", etc.
  let finalMidtransType: string;

  if (onlinePaymentChannel.startsWith("qris")) {
    finalMidtransType = "qris";
  } else if (onlinePaymentChannel.includes("_va") || onlinePaymentChannel.includes("-va")) {
    // "va_bca" -> "bca_va", "bca-va" -> "bca_va"
    const bankName = onlinePaymentChannel.replace("va_", "").replace("-va", "").replace("_va", "");
    finalMidtransType = `${bankName}_va`;
  } else if (onlinePaymentChannel.startsWith("ewallet_")) {
    // "ewallet_gopay" -> "gopay"
    finalMidtransType = onlinePaymentChannel.replace("ewallet_", "");
  } else {
    throw new AppError(Messages.PAYMENT_METHOD_NOT_SUPPORTED, HttpStatus.BAD_REQUEST);
  }

  const payload = buildMidtransCorePayload({
    orderId,
    grossAmount,
    itemDetails,
    customer: {
      name: customerDetails.name,
      phone: customerDetails.phone,
    },
    paymentType: finalMidtransType,
  });

  // Handle Midtrans charge
  const result = await handleMidtransCharge(payload, orderId);

  // Set order to AWAITING_PAYMENT
  await db.order.update({
    where: { id: orderId },
    data: {
      orderStatus: OrderStatus.AWAITING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
    },
  });

  // Schedule 10-minute payment expiry
  await orderExpiryJob.add(orderId);

  // Emit notification to business outlet
  try {
    SocketEmitter.getInstance().emitNotificationToOutlet(outletId, {
      message: `Ada pesanan baru, OrderID: ${orderId}`,
      timestamp: new Date(),
    });
    SocketEmitter.getInstance().emitToBusinessOutlet(outletId, {
      orderId,
      amount: grossAmount,
      paymentMethod: payment_method,
      customerName: customerDetails.name,
      timestamp: new Date(),
    });
    console.log(`📡 Emitted payment_created event for outlet ${outletId}`);
  } catch (socketError) {
    console.error("❌ Error emitting payment_created event:", socketError);
  }

  return result;
}

export async function cancelPaymentService(orderId: string) {
  // Cari transaksi berdasarkan orderId
  const transaction = await db.transaction.findFirst({
    where: { orderId },
    include: { order: { include: { items: { include: { product: true } } } } },
  });

  if (!transaction) {
    throw new AppError(Messages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  if (
    transaction.status !== PaymentStatus.PENDING &&
    transaction.status !== PaymentStatus.AWAITING_VERIFICATION &&
    transaction.status !== PaymentStatus.REJECTED_MANUAL
  ) {
    throw new AppError(
      "Pembayaran tidak dapat dibatalkan karena status sudah " + transaction.status,
      HttpStatus.BAD_REQUEST,
    );
  }

  if (!transaction.isManual) {
    // Cancel via Midtrans API (manual HTTP request)
    try {
      await coreApi.transaction.cancel(orderId);
    } catch (error) {
      Console.error("Error expiring Midtrans transaction:", error);
      throw new AppError(
        "Gagal membatalkan pembayaran di Midtrans",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Delegate restock and cancellation logic to repository (transactional)
  try {
    await PaymentRepository.restockAndCancelOrder(orderId);
  } catch (err) {
    Console.error("Error restocking or cancelling order:", err);
    throw new AppError("Gagal membatalkan pembayaran", HttpStatus.INTERNAL_SERVER_ERROR);
  }

  return { message: "Pembayaran berhasil dibatalkan", orderId };
}

export async function uploadManualPaymentProofService(orderId: string, filePath: string) {
  // Validate actual file content (magic bytes) — defends against MIME/extension spoofing
  if (!fileExists(filePath)) {
    throw new AppError("File tidak ditemukan setelah upload", HttpStatus.INTERNAL_SERVER_ERROR);
  }
  const ext = path.extname(filePath).toLowerCase();
  const mimeByExt: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  const claimedMime = mimeByExt[ext] ?? "application/octet-stream";
  try {
    await validateFileMagicBytes(filePath, claimedMime);
  } catch (err) {
    // Delete the file immediately if validation fails
    try {
      deleteFile(filePath);
    } catch {
      /* ignore cleanup error */
    }
    throw new AppError(
      err instanceof Error ? err.message : "File tidak valid",
      HttpStatus.BAD_REQUEST,
    );
  }

  const transaction = await ManualPaymentRepository.findManualTransactionByOrderId(orderId);

  if (!transaction) {
    throw new AppError(Messages.MANUAL_PAYMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  if (!transaction.isManual || !transaction.manualMethod) {
    throw new AppError(Messages.MANUAL_PAYMENT_NOT_AVAILABLE, HttpStatus.BAD_REQUEST);
  }

  if (transaction.status === PaymentStatus.SUCCESS) {
    throw new AppError(Messages.MANUAL_PAYMENT_ALREADY_VERIFIED, HttpStatus.BAD_REQUEST);
  }

  const uploadableStatuses: PaymentStatus[] = [
    PaymentStatus.PENDING,
    PaymentStatus.AWAITING_VERIFICATION,
    PaymentStatus.REJECTED_MANUAL,
  ];

  if (!uploadableStatuses.includes(transaction.status)) {
    throw new AppError(Messages.MANUAL_PAYMENT_PROOF_NOT_ALLOWED, HttpStatus.BAD_REQUEST);
  }

  if (transaction.expiresAt && transaction.expiresAt.getTime() < Date.now()) {
    throw new AppError(Messages.MANUAL_PAYMENT_EXPIRED, HttpStatus.BAD_REQUEST);
  }

  const proofUrl = toPublicUrl(filePath);

  const updated = await ManualPaymentRepository.updateManualTransaction(transaction.id, {
    paymentProofUrl: proofUrl,
    proofUploadedAt: new Date(),
    status: PaymentStatus.AWAITING_VERIFICATION,
  });

  await db.order.update({
    where: { id: orderId },
    data: {
      orderStatus: OrderStatus.AWAITING_PAYMENT,
      paymentStatus: PaymentStatus.AWAITING_VERIFICATION,
    },
  });

  // Tandai booking slot SERVICE → BOOKED saat bukti pembayaran dikirim
  const serviceItems = await db.orderItem.findMany({
    where: { orderId, product: { type: "SERVICE" } },
    select: { id: true },
  });
  if (serviceItems.length > 0) {
    await db.bookingSlot.updateMany({
      where: {
        orderItemId: { in: serviceItems.map((i) => i.id) },
        status: { not: "BOOKED" },
      },
      data: { status: "BOOKED" },
    });
  }

  try {
    await orderExpiryJob.remove(transaction.orderId);

    SocketEmitter.getInstance().emitNotificationToOutlet(transaction.order.outletId, {
      message: `Pesanan ${orderId}, telah mengirim bukti pembayarannya.`,
      timestamp: new Date(),
    });
    SocketEmitter.getInstance().emitToBusinessOutlet(transaction.order.outletId, {
      orderId,
      amount: transaction.amount,
      customerName: transaction.order.guestCustomer.name,
      paymentMethod: transaction.paymentMethod as string,
      timestamp: transaction.createdAt,
    });
  } catch (socketError) {
    console.error("❌ Error emitting manual_payment_proof_uploaded event:", socketError);
  }

  return updated;
}

export async function verifyManualPaymentService(orderId: string, verifierId: string) {
  const transaction = await ManualPaymentRepository.findManualTransactionByOrderId(orderId);

  if (!transaction) {
    throw new AppError(Messages.MANUAL_PAYMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  if (transaction.status !== PaymentStatus.AWAITING_VERIFICATION) {
    throw new AppError(Messages.MANUAL_PAYMENT_PROOF_REQUIRED, HttpStatus.BAD_REQUEST);
  }

  const updatedTransaction = await ManualPaymentRepository.updateManualTransaction(transaction.id, {
    status: PaymentStatus.SUCCESS,
    verifiedAt: new Date(),
    verifiedById: verifierId,
    rejectionNote: null,
  });

  await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: PaymentStatus.SUCCESS,
      orderStatus: OrderStatus.PROCESSING,
    },
  });

  try {
    socketUtils.emitToBusinessOutlet(transaction.order.outletId, {
      type: "manual_payment_verified",
      orderId,
      amount: transaction.amount,
      paymentMethod: transaction.manualMethod,
      timestamp: new Date(),
    });
  } catch (socketError) {
    console.error("❌ Error emitting manual_payment_verified event:", socketError);
  }

  await messagePublisher.publishOrderStatusUpdate(orderId, OrderStatus.PROCESSING);
  await messagePublisher.publishWhatsAppPaymentSuccess(orderId);

  try {
    const customerPhone = transaction.order.guestCustomer?.phone;
    if (customerPhone) {
      SocketEmitter.getInstance().emitToCustomer(customerPhone, {
        orderId,
        amount: transaction.amount,
        status: "settlement",
        transactionStatus: "settlement",
        isManual: true,
        paymentMethod: transaction.manualMethod ?? "manual",
        message: "Pembayaran manual telah diverifikasi",
        type: "payment_success",
      });
    }
  } catch (customerSocketError) {
    console.error("❌ Error emitting customer manual payment success event:", customerSocketError);
  }

  return updatedTransaction;
}

export async function rejectManualPaymentService(
  orderId: string,
  verifierId: string,
  reason: string,
) {
  const transaction = await ManualPaymentRepository.findManualTransactionByOrderId(orderId);

  if (!transaction) {
    throw new AppError(Messages.MANUAL_PAYMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  if (transaction.status !== PaymentStatus.AWAITING_VERIFICATION) {
    throw new AppError(Messages.MANUAL_PAYMENT_PROOF_REQUIRED, HttpStatus.BAD_REQUEST);
  }

  const updatedTransaction = await ManualPaymentRepository.updateManualTransaction(transaction.id, {
    status: PaymentStatus.REJECTED_MANUAL,
    verifiedAt: new Date(),
    verifiedById: verifierId,
    rejectionNote: reason,
  });

  await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: PaymentStatus.REJECTED_MANUAL,
      orderStatus: OrderStatus.AWAITING_PAYMENT,
    },
  });

  try {
    socketUtils.emitToBusinessOutlet(transaction.order.outletId, {
      type: "manual_payment_rejected",
      orderId,
      amount: transaction.amount,
      paymentMethod: transaction.manualMethod,
      reason,
      timestamp: new Date(),
    });
  } catch (socketError) {
    console.error("❌ Error emitting manual_payment_rejected event:", socketError);
  }

  try {
    const customerPhone = transaction.order.guestCustomer?.phone;
    if (customerPhone) {
      SocketEmitter.getInstance().emitToCustomer(customerPhone, {
        orderId,
        amount: transaction.amount,
        status: "rejected",
        transactionStatus: "REJECTED_MANUAL",
        isManual: true,
        paymentMethod: transaction.manualMethod ?? "manual",
        message: `Pembayaran manual ditolak: ${reason}`,
        type: "payment_failed",
      });
    }
  } catch (customerSocketError) {
    console.error("❌ Error emitting customer manual payment rejected event:", customerSocketError);
  }

  return updatedTransaction;
}

export async function getManualPaymentsService(options?: {
  status?: PaymentStatus[];
  outletId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return ManualPaymentRepository.listManualTransactions(options);
}

export async function getPaymentOrderService(orderId: string) {
  const data = await PaymentRepository.getByOrderId(orderId);

  if (!data) throw new AppError(`Orderid tidak ditemukan`, HttpStatus.NOT_FOUND);

  const { order: rawOrder, ...transaction } = data;
  const { guestCustomer, items, outlet, ...order } = rawOrder;

  const convertMidtrans = transaction.rawMidtrans as unknown as PaymentResponse | null;

  // Fetch outlet operating hours
  const operatingHours = await OperatingHoursRepository.findByOutletId(outlet.id);
  const now = new Date();
  const currentDay = now.getDay();
  const todaySchedule = operatingHours.find((oh) => oh.dayOfWeek === currentDay);

  // Determine if currently within operating hours
  let isWithinOperatingHours = false;
  if (todaySchedule && todaySchedule.isOpen) {
    const openTime = new Date(todaySchedule.openTime);
    const closeTime = new Date(todaySchedule.closeTime);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openTime.getHours() * 60 + openTime.getMinutes();
    const closeMinutes = closeTime.getHours() * 60 + closeTime.getMinutes();
    isWithinOperatingHours = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  return {
    id: transaction.orderId,
    status: order.orderStatus,
    totalAmount: transaction.amount,
    outletInfo: {
      name: outlet.name,
      isWithinOperatingHours,
      todaySchedule: todaySchedule
        ? {
          isOpen: todaySchedule.isOpen,
          openTime: todaySchedule.openTime,
          closeTime: todaySchedule.closeTime,
        }
        : null,
      operatingHours: operatingHours.map((oh) => ({
        dayOfWeek: oh.dayOfWeek,
        isOpen: oh.isOpen,
        openTime: oh.openTime,
        closeTime: oh.closeTime,
      })),
    },
    payment: {
      status: transaction.status,
      method: convertMidtrans ? `MIDTRANS` : `MANUAL`,
      isManual: transaction.isManual,
      midtrans: convertMidtrans
        ? {
          transaction_id: convertMidtrans?.transaction_id ?? null,
          order_id: convertMidtrans?.order_id ?? null,
          gross_amount: convertMidtrans?.gross_amount ?? null,
          transaction_status: convertMidtrans?.transaction_status ?? null,
          payment_type: convertMidtrans?.payment_type,
          expiry_time: convertMidtrans?.expiry_time,
          actions: convertMidtrans?.actions ?? null,
          va_numbers: convertMidtrans?.va_numbers ?? null,
          currency: "IDR",
        }
        : null,
      manual: transaction.isManual
        ? {
          type: transaction.paymentMethod,
          paymentProofUrl: transaction.paymentProofUrl,
          intruction: {
            manualType: transaction.paymentMethod,
            outletName: outlet.name,
            businessName: outlet.business.name,
            note: null,
            qrImageUrl: outlet.manualQrImageUrl,
            expiry_time: transaction.expiresAt,
            bankAccount:
              transaction.paymentMethod === "manual-transfer"
                ? {
                  bankName: outlet.business.bankName,
                  accountNumber: outlet.business.bankAccount,
                  accountHolder: outlet.business.accountHolder,
                }
                : null,
          },
        }
        : null,
    },
    customerDetails: {
      name: guestCustomer.name,
      phone: guestCustomer.phone,
    },
    feeDetail: {
      appFee: order.appFee,
      transactionFee: order.midtransFee,
    },
    items: items.map((item) => {
      const productPrice =
        (item.product.type === "GOODS"
          ? item.product.goods?.sellingPrice
          : item.product.type === "TICKET"
            ? item.product.ticket?.sellingPrice
            : item.product.service?.sellingPrice) ?? 0;
      return {
        id: item.id,
        name: item.product.name,
        price: productPrice,
        quantity: item.quantity,
        subtotal: productPrice * item.quantity,
      };
    }),
  };
}
