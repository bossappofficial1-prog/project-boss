import path from "path";
import { getOrderByIdService } from "./order.service";
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
import { OutletRepository } from "@/repositories/outlet.repository";
import { IPaymentProvider } from "@/providers/payment/payment-provider.interface";
import { midtransProvider } from "@/providers/payment/midtrans.provider";
import { ProductRepository } from "@/repositories/product.repository";
import { ManualPaymentRepository } from "@/repositories/manual-payment.repository";
import { PaymentRepository } from "@/repositories/payment.repository";
import { OperatingHoursRepository } from "@/repositories/operating-hours.repository";
import { AppError } from "@/errors/app-error";
import { HttpStatus } from "@/constants/http-status";
import { Messages } from "@/constants/message";
import { MidtransItem, PaymentResponse } from "@/types/Others";
import { paymentMethod, PaymentMethodId } from "@/constants/payment-method";
import { CreatePaymentPayload } from "@/schemas/payment-v2.schema";
import { generateOrderCode } from "@/utils";
import { orderExpiryJob } from "@/jobs/payment-expiry.job";
import { orderNotificationJob } from "@/jobs/payment-notification.job";
import { SocketEmitter } from "@/socket/socket-emiiter";
import { Time } from "@/constants/time";
import Console from "@/utils/logger";
import { coreApi, snap } from "@/config/midtrans";
import { schedulePaymentExpiration } from "@/queues/payment.queue";
import { deleteFile, fileExists, validateFileMagicBytes } from "@/utils/file.utils";
import { generateServiceOrderNotificationQueue } from "@/queues/generate-service-order-notification";
import { socketUtils } from "@/utils/socket.utils";
import { config } from "@/config";
import { OrderRepository } from "@/repositories/order.repository";

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

const defaultProviders = new Map<string, IPaymentProvider>([
  ["midtrans", midtransProvider],
  // ["xendit", xenditProvider],
]);

export class PaymentService {
  constructor(
    private readonly productRepo: typeof ProductRepository = ProductRepository,
    private readonly outletRepo: typeof OutletRepository = OutletRepository,
    private readonly manualPaymentRepo: typeof ManualPaymentRepository = ManualPaymentRepository,
    private readonly paymentRepo: typeof PaymentRepository = PaymentRepository,
    private readonly operatingHoursRepo: typeof OperatingHoursRepository = OperatingHoursRepository,
    private readonly orderRepo: typeof OrderRepository = OrderRepository,
    /** Map provider yang digunakan, default: Midtrans */
    private readonly providers: Map<string, IPaymentProvider> = defaultProviders
  ) { }

  /** Dapatkan provider berdasarkan nama, throw jika tidak ditemukan */
  private getProvider(name: string): IPaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new AppError(
        `Payment provider "${name}" tidak terdaftar`,
        HttpStatus.BAD_REQUEST
      );
    }
    return provider;
  }

  private async validateItemsAndPrepareData(inputItems: any[], outletId: string) {
    const productIds = inputItems.map((item) => item.productId);
    const [products, outlet] = await Promise.all([
      this.productRepo.findManyByIds(productIds),
      this.outletRepo.findById(outletId),
    ]);

    if (!outlet) {
      throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (!outlet.isOpen) {
      throw new AppError(Messages.OUTLET_CLOSED, HttpStatus.BAD_REQUEST);
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

  private calculateFees(totalProductPrice: number, outlet: any, payment_method: string) {
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

    return { transactionFeeTotal, applicationFee, grossAmount };
  }

  private buildManualInstructions(
    outlet: OutletWithBusiness,
    manualType: ManualPaymentType
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

  private async createManualTransactionRecord(params: {
    orderId: string;
    amount: number;
    paymentMethodId: PaymentMethodId;
    manualType: ManualPaymentType;
    expiresAt: Date;
  }) {
    return this.manualPaymentRepo.createManualTransaction({
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

  private toPublicUrl(filePath: string) {
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
    return `${config.BASE_URL}/${relativePath}`;
  }

  private formatManualPaymentResponse(options: {
    order: OrderWithDetails;
    transactionId: string;
    manualType: ManualPaymentType;
    instructions: ManualPaymentInstructions;
    expiresAt: Date;
    grossAmount: number;
    fees: { applicationFee: number; transactionFee: number; subtotal: number };
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

  private async createOrderAndItems(
    orderId: string,
    grossAmount: number,
    applicationFee: number,
    transactionFeeTotal: number,
    selectedSlotId: string | undefined,
    staffId: string | undefined,
    outletId: string,
    customerDetails: any,
    inputItems: any[],
    productMap: Map<string, Product>
  ) {
    try {
      await this.paymentRepo.createOrderWithItems({
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

      throw err;
    }
  }



  public async createPayment(data: CreatePaymentPayload) {
    const {
      guestCustomer: customerDetails,
      items: inputItems,
      paymentMethod: payment_method,
      onlinePaymentChannel,
      bookingSlotId: selectedSlotId,
      staffId,
      outletId,
    } = data;

    const {
      productMap,
      outlet,
      itemDetails: baseItemDetails,
      totalProductPrice,
    } = await this.validateItemsAndPrepareData(inputItems, outletId);

    const paymentMethodForFees =
      payment_method === "online" && onlinePaymentChannel ? onlinePaymentChannel : payment_method;

    const { transactionFeeTotal, applicationFee, grossAmount } = this.calculateFees(
      totalProductPrice,
      outlet,
      paymentMethodForFees
    );

    const itemDetails = [...baseItemDetails];
    if (transactionFeeTotal > 0) {
      itemDetails.push({
        id: `transaction-fee-\${outletId}`,
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

    const orderId: string = generateOrderCode({ name: outlet?.name ?? "Order" });

    const paymentMethodIdForLookup =
      payment_method === "online" && onlinePaymentChannel
        ? onlinePaymentChannel
        : (payment_method as PaymentMethodId);

    const methodDefinition = paymentMethod.find((method) => method.id === paymentMethodIdForLookup);
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

    if (isManualFlow && manualType) {
      const instructions = this.buildManualInstructions(outlet!, manualType);

      try {
        await this.createOrderAndItems(
          orderId,
          grossAmount,
          applicationFee,
          transactionFeeTotal,
          selectedSlotId,
          staffId,
          outletId,
          customerDetails,
          inputItems,
          productMap
        );

        const expiresAt = new Date(Date.now() + Time.PAYMENT_EXPIRY_TIME_MS);
        const transaction = await this.createManualTransactionRecord({
          orderId,
          amount: grossAmount,
          paymentMethodId: paymentMethodIdForLookup as PaymentMethodId,
          manualType,
          expiresAt,
        });

        const orderWithDetails = (await this.orderRepo.findWithDetails(orderId)) as OrderWithDetails | null;

        if (!orderWithDetails) {
          throw new AppError(Messages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        await this.orderRepo.updatePaymentStatus(
          orderId,
          OrderStatus.AWAITING_PAYMENT,
          PaymentStatus.PENDING
        );

        try {
          orderExpiryJob.add(orderId);
          orderNotificationJob.add(orderId);
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
            message: `Pesanan baru, Order ID: \${orderId}`,
            timestamp: new Date(),
          });
        } catch (socketError) {
          console.error("❌ Error emitting manual_payment_created event:", socketError);
        }

        return this.formatManualPaymentResponse({
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
          await this.paymentRepo.restockAndCancelOrder(orderId);
        } catch (cleanupError) {
          const message = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
          if (!message.toLowerCase().includes("order not found")) {
            Console.error("Failed to rollback manual payment order", cleanupError);
          }
        }
        throw error;
      }
    }

    // Online flow
    await this.createOrderAndItems(
      orderId,
      grossAmount,
      applicationFee,
      transactionFeeTotal,
      selectedSlotId,
      staffId,
      outletId,
      customerDetails,
      inputItems,
      productMap
    );

    if (!onlinePaymentChannel) {
      throw new AppError("Online payment channel wajib diisi", HttpStatus.BAD_REQUEST);
    }

    // Delegasikan ke provider. Default: midtrans.
    // Untuk pakai provider lain: kirim { gateway: "xendit" } dari FE,
    // lalu ganti "midtrans" → data.gateway di bawah ini.
    const provider = this.getProvider("midtrans");

    const chargeResult = await provider.charge({
      orderId,
      grossAmount,
      items: itemDetails,
      customer: {
        name: customerDetails.name,
        phone: customerDetails.phone,
      },
      channel: onlinePaymentChannel,
    });

    await this.orderRepo.updatePaymentStatus(
      orderId,
      OrderStatus.AWAITING_PAYMENT,
      PaymentStatus.PENDING
    );

    orderExpiryJob.add(orderId);
    orderNotificationJob.add(orderId);

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
    } catch (socketError) {
      console.error("❌ Error emitting payment_created event:", socketError);
    }

    return chargeResult.raw;
  }

  public async createQrisPayment(orderId: string) {
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

    const chargeResponse = (await coreApi.charge(parameter)) as any;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.paymentRepo.createTransaction({
      orderId: order.id,
      amount: order.totalAmount,
      status: PaymentStatus.PENDING,
      externalId: chargeResponse.transaction_id,
      paymentUrl:
        chargeResponse.actions?.find((a: any) => a.name === "deeplink-redirect")?.url ||
        chargeResponse.actions?.find((a: any) => a.name === "generate-qr-code")?.url,
      expiresAt: expiresAt,
    });

    await schedulePaymentExpiration(order.id, expiresAt);

    try {
      SocketEmitter.getInstance().emitToBusinessOutlet(order.outletId, {
        amount: order.totalAmount,
        orderId: order.id,
        customerName: order.guestCustomer.name,
        paymentMethod: "qris",
        timestamp: new Date(),
      });
    } catch (socketError) {
      console.error("❌ Error emitting payment_created event:", socketError);
    }

    return chargeResponse;
  }

  public async cancelPayment(orderId: string, gateway: string = "midtrans") {
    const transaction = await this.paymentRepo.findTransactionWithOrder(orderId);

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
        HttpStatus.BAD_REQUEST
      );
    }

    if (!transaction.isManual) {
      try {
        const provider = this.getProvider(gateway);
        await provider.cancelTransaction(orderId);
      } catch (error) {
        Console.error("Error cancelling transaction:", error);
        throw new AppError("Gagal membatalkan pembayaran", HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    try {
      await this.paymentRepo.restockAndCancelOrder(orderId);
    } catch (err) {
      Console.error("Error restocking or cancelling order:", err);
      throw new AppError("Gagal membatalkan pembayaran", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { message: "Pembayaran berhasil dibatalkan", orderId };
  }

  public async uploadManualPaymentProof(orderId: string, filePath: string) {
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
      try {
        deleteFile(filePath);
      } catch {
        // ignore
      }
      throw new AppError(
        err instanceof Error ? err.message : "File tidak valid",
        HttpStatus.BAD_REQUEST
      );
    }

    const transaction = await this.manualPaymentRepo.findManualTransactionByOrderId(orderId);

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

    if (transaction.expiresAt && new Date(transaction.expiresAt).getTime() < Date.now()) {
      throw new AppError(Messages.MANUAL_PAYMENT_EXPIRED, HttpStatus.BAD_REQUEST);
    }

    const proofUrl = this.toPublicUrl(filePath);

    const updated = await this.manualPaymentRepo.updateManualTransaction(transaction.id, {
      paymentProofUrl: proofUrl,
      proofUploadedAt: new Date(),
      status: PaymentStatus.AWAITING_VERIFICATION,
    });

    await this.orderRepo.updatePaymentStatus(
      orderId,
      OrderStatus.AWAITING_PAYMENT,
      PaymentStatus.AWAITING_VERIFICATION
    );

    await this.orderRepo.confirmBookingSlotsForOrder(orderId);

    try {
      orderExpiryJob.remove(transaction.orderId);
      orderNotificationJob.remove(orderId);
      if (transaction.order.items.some((item) => item.product.type === "SERVICE")) {
        await generateServiceOrderNotificationQueue.add({ orderId });
      }

      SocketEmitter.getInstance().emitNotificationToOutlet(transaction.order.outletId, {
        message: `Pesanan \${orderId}, telah mengirim bukti pembayarannya.`,
        timestamp: new Date(),
      });
      SocketEmitter.getInstance().emitToBusinessOutlet(transaction.order.outletId, {
        orderId,
        amount: transaction.amount,
        customerName: transaction.order.guestCustomer?.name ?? "-",
        paymentMethod: transaction.paymentMethod as string,
        timestamp: new Date(transaction.createdAt),
      });
    } catch (socketError) {
      console.error("❌ Error emitting manual_payment_proof_uploaded event:", socketError);
    }

    return updated;
  }

  public async verifyManualPayment(orderId: string, verifierId: string) {
    const transaction = await this.manualPaymentRepo.findManualTransactionByOrderId(orderId);

    if (!transaction) {
      throw new AppError(Messages.MANUAL_PAYMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (transaction.status !== PaymentStatus.AWAITING_VERIFICATION) {
      throw new AppError(Messages.MANUAL_PAYMENT_PROOF_REQUIRED, HttpStatus.BAD_REQUEST);
    }

    const updatedTransaction = await this.manualPaymentRepo.updateManualTransaction(transaction.id, {
      status: PaymentStatus.SUCCESS,
      verifiedAt: new Date(),
      verifiedById: verifierId,
      rejectionNote: null,
    });

    await this.orderRepo.updatePaymentStatus(
      orderId,
      OrderStatus.PROCESSING,
      PaymentStatus.SUCCESS
    );

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

  public async rejectManualPayment(orderId: string, verifierId: string, reason: string) {
    const transaction = await this.manualPaymentRepo.findManualTransactionByOrderId(orderId);

    if (!transaction) {
      throw new AppError(Messages.MANUAL_PAYMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (transaction.status !== PaymentStatus.AWAITING_VERIFICATION) {
      throw new AppError(Messages.MANUAL_PAYMENT_PROOF_REQUIRED, HttpStatus.BAD_REQUEST);
    }

    const updatedTransaction = await this.manualPaymentRepo.updateManualTransaction(transaction.id, {
      status: PaymentStatus.REJECTED_MANUAL,
      verifiedAt: new Date(),
      verifiedById: verifierId,
      rejectionNote: reason,
    });

    await this.orderRepo.updatePaymentStatus(
      orderId,
      OrderStatus.AWAITING_PAYMENT,
      PaymentStatus.REJECTED_MANUAL
    );

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
          message: `Pembayaran manual ditolak: \${reason}`,
          type: "payment_failed",
        });
      }
    } catch (customerSocketError) {
      console.error("❌ Error emitting customer manual payment rejected event:", customerSocketError);
    }

    return updatedTransaction;
  }

  public async getManualPayments(options?: {
    status?: PaymentStatus[];
    outletId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return this.manualPaymentRepo.listManualTransactions(options);
  }

  public async getPaymentOrder(orderId: string) {
    const data = await this.paymentRepo.getByOrderId(orderId);

    if (!data) throw new AppError("Orderid tidak ditemukan", HttpStatus.NOT_FOUND);

    const { order: rawOrder, ...transaction } = data;
    const { guestCustomer, items, outlet, ...order } = rawOrder;

    const convertMidtrans = transaction.rawMidtrans as unknown as PaymentResponse | null;

    const operatingHours = await this.operatingHoursRepo.findByOutletId(outlet.id);
    const now = new Date();
    const currentDay = now.getDay();
    const todaySchedule = operatingHours.find((oh) => oh.dayOfWeek === currentDay);

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
        method: convertMidtrans ? "MIDTRANS" : "MANUAL",
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
}

/**
 * @deprecated Gunakan PaymentService.createPayment() untuk flow baru.
 * Fungsi ini dipertahankan untuk backward-compatibility dengan order.service.ts lama.
 */
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

  if (midtransFee > 0) {
    itemDetails.push({
      id: "midtrans_fee",
      name: "Biaya Admin Midtrans (1%)",
      price: midtransFee,
      quantity: 1,
    });
  }

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

  await PaymentRepository.createTransaction({
    orderId: order.id,
    amount: calculatedGrossAmount,
    status: PaymentStatus.PENDING,
    externalId: transaction.token,
    paymentUrl: transaction.redirect_url,
    expiresAt: expiresAt,
  });

  await schedulePaymentExpiration(order.id, expiresAt);

  try {
    socketUtils.emitToBusinessOutlet(order.outletId, {
      type: "payment_created",
      orderId: order.id,
      amount: calculatedGrossAmount,
      paymentMethod,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Socket emit failed", error);
  }

  return transaction;
}
