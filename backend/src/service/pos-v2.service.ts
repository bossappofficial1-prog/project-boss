import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { PosV2Repository } from "../repositories/pos-v2.repository";
import { CreatePosV2OrderInput } from "../schemas/pos-v2.schema";
import { generateOrderCode } from "../utils";
import { SocketEmitter } from "../socket/socket-emiiter";
import { generateServiceOrderNotificationQueue } from "../queues/generate-service-order-notification";
import { RedisUtils } from "../utils/redis.utils";
import { LoyaltyService } from "./loyalty.service";
import { getOutletByIdService } from "./outlet.service";
import { CashierShiftService } from "./cashier-shift.service";
import { deductStockForCompletedOrder } from "./order.service";
import { db } from "../config/prisma";

const TABLE_ENABLED_OUTLET_TYPES = new Set(["FNB", "CUSTOM"]);

export interface PosV2OrderResult {
  orderId: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  itemCount: number;
  cashReceived: number;
  change: number;
  customerName: string;
  createdAt: string;
  hasTickets: boolean;
}

export class PosV2Service {
  static async getProducts(
    outletId: string,
    search?: string,
    type?: "GOODS" | "SERVICE" | "TICKET",
    page: number = 1,
    limit: number = 50,
  ) {
    const cacheKey = `pos:products:${outletId}:t=${type || "all"}:s=${search || ""}:p=${page}:l=${limit}`;

    const cached = await RedisUtils.get<any>(cacheKey);
    if (cached) return cached;

    const { data: products, total } = await PosV2Repository.getProductsByOutlet(
      outletId,
      search,
      type,
      page,
      limit,
    );

    const mappedProducts = products.map((p) => {
      let price = 0;
      if (p.type === "GOODS") price = p.goods?.sellingPrice ?? 0;
      else if (p.type === "SERVICE") price = p.service?.sellingPrice ?? 0;
      else if (p.type === "TICKET") price = p.ticket?.sellingPrice ?? 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        image: p.image,
        type: p.type,
        status: p.status,
        category: p.category ? { id: p.category.id, name: p.category.name } : null,
        taxPercentage: p.taxPercentage ?? null,
        taxName: p.taxName ?? null,
        price,
        hasRecipe: p.type === "GOODS" ? !!p.recipe : false,
        stock: p.type === "GOODS" ? (p.goods?.currentStock ?? 0) : null,
        unit: p.type === "GOODS" ? (p.goods?.unit ?? "pcs") : null,
        barcode: p.type === "GOODS" ? (p.goods?.barcode ?? null) : null,
        sku: p.type === "GOODS" ? (p.goods?.sku ?? null) : null,
        goodsId: p.goods?.id ?? null,
        serviceId: p.service?.id ?? null,
        ticketId: p.ticket?.id ?? null,
        durationMinutes: p.service?.durationMinutes ?? null,
        providerName: p.service?.providerName ?? null,
        totalQuota: p.ticket?.totalQuota ?? null,
        soldCount: p.ticket?.soldCount ?? null,
        eventDate: p.ticket?.eventDate?.toISOString() ?? null,
        eventEndDate: p.ticket?.eventEndDate?.toISOString() ?? null,
        venue: p.ticket?.venue ?? null,
      };
    });

    const result = {
      data: mappedProducts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache for 1 hour
    await RedisUtils.set(cacheKey, result, 3600);
    return result;
  }

  static async createOrder(
    input: CreatePosV2OrderInput,
    cashierId: string | null,
  ): Promise<PosV2OrderResult> {
    const {
      customer,
      outletId,
      items,
      cashReceived = 0,
      bookingSlotId,
      bookingDate,
      paymentMethod,
      pointsRedeemed = 0,
      loyaltyRewardId,
      staffId: payloadStaffId,
      tableId,
      tableNumber,
      isOpenBill = false,
      existingOrderId,
    } = input;

    // Prioritize staffId from payload (selected in UI) over cashierId from session
    const finalCashierId = payloadStaffId || cashierId;

    const outlet = await getOutletByIdService(outletId);
    const tableFeatureEnabled = TABLE_ENABLED_OUTLET_TYPES.has(outlet.type);

    let cashierShiftId: string | null = null;
    if (cashierId && outlet.type === "RETAIL") {
      const activeShift = await CashierShiftService.getActiveShift({
        outletId,
        staffId: cashierId,
      });
      if (!activeShift) {
        throw new AppError("Shift wajib dibuka sebelum melakukan transaksi.", HttpStatus.BAD_REQUEST);
      }
      cashierShiftId = activeShift.id;
    }

    if (!tableFeatureEnabled && (tableId || tableNumber || isOpenBill)) {
      throw new AppError(
        "Open bill dan penggunaan meja hanya tersedia untuk outlet tipe F&B atau Custom.",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (tableFeatureEnabled && tableId) {
      const table = await PosV2Repository.findTableByIdAndOutlet(tableId, outletId);
      if (!table) {
        throw new AppError("Meja tidak ditemukan pada outlet aktif.", HttpStatus.BAD_REQUEST);
      }
      // If table is BILLED, we still allow adding new orders to it (it will be linked to the same bill)

    }

    // Validate products exist and belong to outlet
    const productIds = items.map((i) => i.productId);
    const products = await PosV2Repository.getProductsByIds(productIds, outletId);

    if (products.length !== productIds.length) {
      const found = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !found.has(id));
      throw new AppError(
        `Produk tidak ditemukan atau tidak aktif: ${missing.join(", ")}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate: max 1 service per order
    const serviceProducts = products.filter((p) => p.type === "SERVICE");
    if (serviceProducts.length > 1) {
      throw new AppError("Maksimal 1 layanan per transaksi POS", HttpStatus.BAD_REQUEST);
    }

    // Validate stock and calculate total
    let subtotal = 0;
    let totalTax = 0;
    let hasService = false;
    let hasTickets = false;
    const orderItems: Array<{
      productId: string;
      quantity: number;
      priceAtTimeOfOrder: number;
    }> = [];
    const stockUpdates: Array<{
      productGoodsId: string;
      quantity: number;
      orderId: string;
    }> = [];
    const ticketUpdates: Array<{
      productTicketId: string;
      productId: string;
      quantity: number;
    }> = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;

      if (product.type === "GOODS") {
        if (!product.goods) {
          throw new AppError(`Data barang "${product.name}" tidak lengkap`, HttpStatus.BAD_REQUEST);
        }
        // Skip stock validation for recipe-based products (FnB — stock tracked via ingredients)
        if (!product.recipe && product.goods.currentStock < item.quantity) {
          throw new AppError(
            `Stok "${product.name}" tidak cukup. Tersedia: ${product.goods.currentStock}`,
            HttpStatus.BAD_REQUEST,
          );
        }
        const price = product.goods.sellingPrice;
        subtotal += price * item.quantity;
        if (product.taxPercentage && product.taxPercentage > 0) {
          totalTax += Math.round(price * item.quantity * (product.taxPercentage / 100));
        }
        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          priceAtTimeOfOrder: price,
        });
        stockUpdates.push({
          productGoodsId: product.goods.id,
          quantity: item.quantity,
          orderId: "",
        });
      } else if (product.type === "SERVICE") {
        if (!product.service) {
          throw new AppError(
            `Data layanan "${product.name}" tidak lengkap`,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (!bookingSlotId) {
          throw new AppError(
            `Pilih jadwal untuk layanan "${product.name}"`,
            HttpStatus.BAD_REQUEST,
          );
        }
        hasService = true;
        const price = product.service.sellingPrice;
        subtotal += price * 1; // Service always qty 1
        if (product.taxPercentage && product.taxPercentage > 0) {
          totalTax += Math.round(price * 1 * (product.taxPercentage / 100));
        }
        orderItems.push({
          productId: product.id,
          quantity: 1,
          priceAtTimeOfOrder: price,
        });
      } else if (product.type === "TICKET") {
        hasTickets = true;
        if (!product.ticket) {
          throw new AppError(`Data tiket "${product.name}" tidak lengkap`, HttpStatus.BAD_REQUEST);
        }
        const availableQuota = product.ticket.totalQuota - product.ticket.soldCount;
        if (availableQuota < item.quantity) {
          throw new AppError(
            `Kuota tiket "${product.name}" tidak cukup. Tersedia: ${availableQuota}`,
            HttpStatus.BAD_REQUEST,
          );
        }
        const price = product.ticket.sellingPrice;
        subtotal += price * item.quantity;
        if (product.taxPercentage && product.taxPercentage > 0) {
          totalTax += Math.round(price * item.quantity * (product.taxPercentage / 100));
        }
        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          priceAtTimeOfOrder: price,
        });
        ticketUpdates.push({
          productTicketId: product.ticket.id,
          productId: product.id,
          quantity: item.quantity,
        });
      }
    }

    if (subtotal < 1000) {
      throw new AppError("Minimum order Rp 1.000", HttpStatus.BAD_REQUEST);
    }

    if (subtotal > 50_000_000) {
      throw new AppError("Maksimum order Rp 50.000.000", HttpStatus.BAD_REQUEST);
    }

    // Create or find customer (MUST be before loyalty check)
    const guestCustomer = await PosV2Repository.findOrCreateCustomer(customer.name, customer.phone);

    // Calculate Loyalty Discount
    let discountAmount = 0;
    let finalPointsRedeemed = pointsRedeemed;
    let loyaltyReward = null;

    if (loyaltyRewardId) {
      loyaltyReward = await db.loyaltyReward.findUnique({
        where: { id: loyaltyRewardId },
      });
      if (!loyaltyReward || loyaltyReward.outletId !== outletId) {
        throw new AppError("Reward tidak ditemukan.", HttpStatus.NOT_FOUND);
      }
      if (!loyaltyReward.isActive) {
        throw new AppError("Reward tidak aktif.", HttpStatus.BAD_REQUEST);
      }
      // Check points
      const membership = await LoyaltyService.getMembership(guestCustomer.id, outletId);
      if (!membership || membership.totalPoints < loyaltyReward.pointsCost) {
        throw new AppError(
          `Poin member tidak mencukupi untuk reward ini. Dibutuhkan: ${loyaltyReward.pointsCost}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Compute discount
      finalPointsRedeemed = loyaltyReward.pointsCost;
      const rewardType = loyaltyReward.type;
      switch (rewardType) {
        case "DISCOUNT_FLAT":
          discountAmount = loyaltyReward.discountAmount ?? 0;
          break;
        case "DISCOUNT_PERCENT":
          discountAmount = (subtotal * (loyaltyReward.discountPercent ?? 0)) / 100;
          if (loyaltyReward.maxDiscount && discountAmount > loyaltyReward.maxDiscount) {
            discountAmount = loyaltyReward.maxDiscount;
          }
          break;
        case "VOUCHER":
          discountAmount = loyaltyReward.voucherValue ?? 0;
          break;
        case "CASHBACK":
          discountAmount = loyaltyReward.cashbackAmount ?? 0;
          break;
        case "FREE_ITEM":
          discountAmount = 0; // Handled by free item inside cart
          break;
      }
    } else if (pointsRedeemed > 0) {
      const loyaltyConfig = await LoyaltyService.getConfig(outletId);
      // @ts-ignore
      if (loyaltyConfig && loyaltyConfig.isActive && loyaltyConfig.pointValue > 0) {
        // @ts-ignore
        discountAmount = pointsRedeemed * loyaltyConfig.pointValue;

        // Validate if customer has enough points
        const membership = await LoyaltyService.getMembership(guestCustomer.id, outletId);
        if (!membership || membership.totalPoints < pointsRedeemed) {
          throw new AppError(
            "Poin member tidak mencukupi untuk penukaran ini.",
            HttpStatus.BAD_REQUEST,
          );
        }
      } else if (pointsRedeemed > 0) {
        throw new AppError(
          "Program loyalty tidak aktif atau nilai poin belum diatur.",
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const grandTotal = Math.max(0, subtotal - discountAmount + totalTax);

    // Validate cash
    if (!isOpenBill && cashReceived < grandTotal && paymentMethod === "cash") {
      throw new AppError(
        `Cash kurang. Total: Rp ${grandTotal.toLocaleString("id-ID")}, Diterima: Rp ${cashReceived.toLocaleString("id-ID")}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Generate or reuse order ID
    const orderId =
      existingOrderId || generateOrderCode({ name: "POS", maxLength: 12 }, { randomLength: 6 });

    // Set orderId for stock updates
    stockUpdates.forEach((su) => (su.orderId = orderId));

    // Create order atomically
    const { order } = await PosV2Repository.createCashOrder({
      orderId,
      customerId: guestCustomer.id,
      outletId,
      totalAmount: grandTotal,
      discountAmount,
      pointsRedeemed: finalPointsRedeemed,
      taxAmount: totalTax,
      cashierId: finalCashierId,
      cashierShiftId,
      items: orderItems,
      stockUpdates,
      ticketUpdates,
      hasService,
      paymentMethod: paymentMethod || "none",
      cashReceived: isOpenBill || paymentMethod === "qris" ? 0 : Math.max(0, cashReceived),
      cashChange: isOpenBill || paymentMethod === "qris" ? 0 : Math.max(0, cashReceived - grandTotal),
      bookingSlotId,
      bookingDate: bookingDate ? new Date(bookingDate) : null,
      tableId,
      tableNumber,
      isOpenBill,
    });

    // Create Reward Redemption & Update Stock if a catalog reward is selected
    if (loyaltyReward) {
      try {
        await db.rewardRedemption.create({
          data: {
            outletId,
            guestCustomerId: guestCustomer.id,
            loyaltyRewardId: loyaltyReward.id,
            orderId: order.id,
            pointsUsed: loyaltyReward.pointsCost,
            status: "USED",
            note: `Reward ditukar saat checkout POS: ${loyaltyReward.name}`,
          },
        });

        // Update Stock of the reward
        if (loyaltyReward.stock !== -1) {
          await db.loyaltyReward.update({
            where: { id: loyaltyReward.id },
            data: { stock: { decrement: 1 } },
          });
        }
      } catch (redemptionErr) {
        console.error("[LOYALTY] Error creating reward redemption in POS checkout:", redemptionErr);
      }
    }

    // Deduct stock for completed FnB orders (HPP FIFO)
    if (order.orderStatus === "COMPLETED") {
      try {
        await deductStockForCompletedOrder(order.id);
      } catch (stockDeductErr) {
        console.error("[HPP] Error triggering stock deduction in POS v2:", stockDeductErr);
      }
    }

    // Trigger Loyalty (Non-blocking)
    LoyaltyService.processOrderLoyalty(order.id).catch((err) => {
      console.error("[LOYALTY] Error processing points in POS v2:", err);
    });

    // Emit real-time event (non-blocking)
    try {
      if (serviceProducts.length > 0) {
        generateServiceOrderNotificationQueue.add({ orderId: order.id });
      }

      SocketEmitter.getInstance().emitToBusinessOutlet(outletId, {
        orderId: order.id,
        amount: grandTotal,
        customerName: guestCustomer.name,
        paymentMethod: paymentMethod === "cash" ? "cash" : "qris",
        timestamp: new Date(),
      });
    } catch {
      // Silent fail - socket is non-critical
    }

    // Invalidate cache for products in this outlet so updated stock is fetched
    await RedisUtils.deleteByPattern(`pos:products:${outletId}:*`);

    return {
      orderId: order.id,
      totalAmount: grandTotal,
      subtotal: subtotal,
      discountAmount: discountAmount,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      cashReceived: isOpenBill ? 0 : paymentMethod === "qris" ? grandTotal : cashReceived,
      change: isOpenBill ? 0 : paymentMethod === "qris" ? 0 : cashReceived - grandTotal,
      customerName: guestCustomer.name,
      createdAt: order.createdAt.toISOString(),
      hasTickets,
    };
  }

  static async getCashSummary(outletId: string) {
    return PosV2Repository.getCashSummaryToday(outletId);
  }

  static async getOpenOrders(outletId: string) {
    const orders = await PosV2Repository.getOpenOrders(outletId, 20);

    return orders.map((o) => ({
      id: o.id,
      totalAmount: o.totalAmount,
      customerName: o.guestCustomer.name,
      customerPhone: o.guestCustomer.phone,
      tableNumber: o.tableNumber,
      tableId: o.tableId,
      itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
      itemsSummary: o.items
        .slice(0, 3)
        .map((i) => i.product.name)
        .join(", "),
      items: o.items.map((i) => {
        const p = i.product as any;
        let price = 0;
        if (p.type === "GOODS") price = p.goods?.sellingPrice ?? 0;
        else if (p.type === "SERVICE") price = p.service?.sellingPrice ?? 0;
        else if (p.type === "TICKET") price = p.ticket?.sellingPrice ?? 0;

        return {
          id: i.id,
          productId: i.productId,
          quantity: i.quantity,
          price: i.priceAtTimeOfOrder,
          product: {
            ...p,
            price,
            taxName: p.taxName ?? null,
          },
        };
      }),
      cashier: o.handledByStaff?.name ?? "-",
      createdAt: o.createdAt.toISOString(),
    }));
  }

  static async getRecentOrders(outletId: string) {
    const orders = await PosV2Repository.getRecentOrders(outletId, 20);

    return orders.map((o) => ({
      id: o.id,
      totalAmount: o.totalAmount,
      customerName: o.guestCustomer.name,
      itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
      itemsSummary: o.items
        .slice(0, 3)
        .map((i) => i.product.name)
        .join(", "),
      cashier: o.handledByStaff?.name ?? "-",
      createdAt: o.createdAt.toISOString(),
      transactionId: o.transaction?.id ?? null,
    }));
  }
}
