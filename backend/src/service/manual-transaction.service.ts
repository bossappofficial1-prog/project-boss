import { BaseService } from "./base.service";
import { ManualTransactionRepository } from "../repositories/manual-transaction.repository";
import {
  PaymentStatus,
  OrderStatus,
  ProductType,
  ManualPaymentType,
} from "@prisma/client";

export interface CreateManualTransactionInput {
  outletId: string;
  transactionDate: Date;
  customerName?: string;
  customerPhone?: string;
  amount?: number;
  items: Array<{
    productId: string;
    quantity: number;
    bookingDate?: Date;
  }>;
}

export interface ManualTransactionResult {
  transaction: any;
  order: any;
  calculatedAmount: number;
  taxAmount: number;
}

export class ManualTransactionService extends BaseService {
  static async createManualTransaction(
    input: CreateManualTransactionInput,
  ): Promise<ManualTransactionResult> {
    const productIds = input.items.map((i) => i.productId);
    const products =
      await ManualTransactionRepository.findProductsByIds(productIds);

    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      this.badRequest(
        `Produk tidak ditemukan atau tidak aktif: ${missingIds.join(", ")}`,
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    let totalTax = 0;

    for (const item of input.items) {
      const product = productMap.get(item.productId)!;
      let price = 0;

      if (product.type === ProductType.GOODS && product.goods) {
        price = product.goods.sellingPrice;
      } else if (product.type === ProductType.SERVICE && product.service) {
        price = product.service.sellingPrice;
      } else if (product.type === ProductType.TICKET && product.ticket) {
        price = product.ticket.sellingPrice;
      }

      if (price <= 0) {
        this.badRequest(
          `Produk ${product.name} tidak memiliki harga jual yang valid`,
        );
      }

      subtotal += price * item.quantity;

      if (product.taxPercentage && product.taxPercentage > 0) {
        totalTax += Math.round(
          price * item.quantity * (product.taxPercentage / 100),
        );
      }
    }

    const calculatedAmount = subtotal + totalTax;
    const finalAmount =
      input.amount !== undefined && input.amount > 0
        ? input.amount
        : calculatedAmount;

    const customer =
      await ManualTransactionRepository.findOrCreateGuestCustomer(
        input.customerPhone,
        input.customerName,
      );

    const order = await ManualTransactionRepository.createOrder({
      outlet: { connect: { id: input.outletId } },
      guestCustomer: { connect: { id: customer.id } },
      totalAmount: finalAmount,
      taxAmount: totalTax,
      discountAmount: 0,
      pointsRedeemed: 0,
      bookingDate:
        input.items.find((i) => i.bookingDate)?.bookingDate ??
        input.transactionDate,
      customerType: "GUEST",
      paymentStatus: PaymentStatus.SUCCESS,
      orderStatus: OrderStatus.COMPLETED,
      createdAt: input.transactionDate,
      items: {
        create: input.items.map((item) => {
          const product = productMap.get(item.productId)!;
          let price = 0;
          let hpp = 0;
          let commission = 0;

          if (product.type === ProductType.GOODS && product.goods) {
            price = product.goods.sellingPrice;
            hpp = product.goods.averageHpp;
          } else if (product.type === ProductType.SERVICE && product.service) {
            price = product.service.sellingPrice;
            if (product.service.commissionType === "FIXED") {
              commission = product.service.commissionValue;
            } else if (product.service.commissionValue) {
              commission = Math.round(
                price * (product.service.commissionValue / 100),
              );
            }
          } else if (product.type === ProductType.TICKET && product.ticket) {
            price = product.ticket.sellingPrice;
          }

          return {
            productId: product.id,
            quantity: item.quantity,
            priceAtTimeOfOrder: price,
            hppAtTimeOfOrder: hpp,
            commissionAtTimeOfOrder: commission,
          };
        }),
      },
    });

    await ManualTransactionRepository.deductStockForGoods(order.id);

    const transaction = await ManualTransactionRepository.createTransaction({
      amount: finalAmount,
      paymentMethod: "owner_transfer",
      status: PaymentStatus.SUCCESS,
      isManual: true,
      manualMethod: ManualPaymentType.OWNER_TRANSFER,
      order: {
        connect: { id: order.id },
      },
      createdAt: input.transactionDate,
    });

    return {
      transaction,
      order,
      calculatedAmount,
      taxAmount: totalTax,
    };
  }

  static async updateManualTransaction(
    transactionId: string,
    input: {
      transactionDate?: Date;
      customerName?: string;
      customerPhone?: string;
      amount?: number;
      items?: Array<{
        productId: string;
        quantity: number;
        bookingDate?: Date;
      }>;
    },
  ) {
    const existing =
      await ManualTransactionRepository.findTransactionWithOrderDetails(
        transactionId,
      );
    if (!existing) this.notFound("Transaksi tidak ditemukan");
    if (!existing.isManual)
      this.badRequest("Hanya transaksi manual yang dapat diedit");

    const order = existing.order!;
    const oldItems = order.items;

    // If items changed, recalculate stock and amounts
    if (input.items) {
      const productIds = input.items.map((i) => i.productId);
      const products =
        await ManualTransactionRepository.findProductsByIds(productIds);

      if (products.length !== productIds.length) {
        const foundIds = products.map((p) => p.id);
        const missingIds = productIds.filter((id) => !foundIds.includes(id));
        this.badRequest(
          `Produk tidak ditemukan atau tidak aktif: ${missingIds.join(", ")}`,
        );
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      let subtotal = 0;
      let totalTax = 0;
      for (const item of input.items) {
        const product = productMap.get(item.productId)!;
        let price = 0;
        if (product.type === ProductType.GOODS && product.goods) {
          price = product.goods.sellingPrice;
        } else if (product.type === ProductType.SERVICE && product.service) {
          price = product.service.sellingPrice;
        } else if (product.type === ProductType.TICKET && product.ticket) {
          price = product.ticket.sellingPrice;
        }
        subtotal += price * item.quantity;

        if (product.taxPercentage && product.taxPercentage > 0) {
          totalTax += Math.round(
            price * item.quantity * (product.taxPercentage / 100),
          );
        }
      }

      const calculatedAmount = subtotal + totalTax;

      // Restore old stock
      await ManualTransactionRepository.restoreStockForGoods(order.id);

      // Delete old items
      await ManualTransactionRepository.deleteOrderItems(order.id);

      // Create new items
      const newItems = input.items.map((item) => {
        const product = productMap.get(item.productId)!;
        let price = 0;
        let hpp = 0;
        let commission = 0;

        if (product.type === ProductType.GOODS && product.goods) {
          price = product.goods.sellingPrice;
          hpp = product.goods.averageHpp;
        } else if (product.type === ProductType.SERVICE && product.service) {
          price = product.service.sellingPrice;
          if (product.service.commissionType === "FIXED") {
            commission = product.service.commissionValue;
          } else if (product.service.commissionValue) {
            commission = Math.round(
              price * (product.service.commissionValue / 100),
            );
          }
        } else if (product.type === ProductType.TICKET && product.ticket) {
          price = product.ticket.sellingPrice;
        }

        return {
          productId: product.id,
          quantity: item.quantity,
          priceAtTimeOfOrder: price,
          hppAtTimeOfOrder: hpp,
          commissionAtTimeOfOrder: commission,
        };
      });

      await ManualTransactionRepository.createOrderItems(order.id, newItems);

      // Deduct new stock
      await ManualTransactionRepository.deductStockForGoods(order.id);

      // Update order total & transaction amount
      const finalAmount =
        input.amount !== undefined && input.amount > 0
          ? input.amount
          : calculatedAmount;
      await ManualTransactionRepository.updateOrderAmounts(order.id, {
        totalAmount: finalAmount,
        taxAmount: totalTax,
      });
      await ManualTransactionRepository.updateTransaction(transactionId, {
        amount: finalAmount,
      });
    } else if (input.amount) {
      // Only amount changed, no items change
      await ManualTransactionRepository.updateOrderAmounts(order.id, {
        totalAmount: input.amount,
      });
      await ManualTransactionRepository.updateTransaction(transactionId, {
        amount: input.amount,
      });
    }

    // Update transaction date (both Transaction and Order)
    if (input.transactionDate) {
      await ManualTransactionRepository.updateTransaction(transactionId, {
        createdAt: input.transactionDate,
      });
      await ManualTransactionRepository.updateOrderAmounts(order.id, {
        totalAmount: order.totalAmount,
        createdAt: input.transactionDate,
      });
    }

    // Update guest customer info
    if (input.customerName !== undefined || input.customerPhone !== undefined) {
      const updateData: any = {};
      if (input.customerName !== undefined)
        updateData.name = input.customerName || "Customer Manual";
      if (input.customerPhone !== undefined) {
        if (input.customerPhone) {
          updateData.phone = input.customerPhone.replace(/[^\d+]/g, "");
        }
      }
      await ManualTransactionRepository.updateGuestCustomer(
        order.guestCustomerId,
        updateData,
      );
    }

    // Return updated transaction
    return ManualTransactionRepository.findTransactionWithOrderDetails(
      transactionId,
    );
  }

  static async deleteManualTransaction(transactionId: string) {
    const existing =
      await ManualTransactionRepository.findTransactionWithOrderDetails(
        transactionId,
      );
    if (!existing) this.notFound("Transaksi tidak ditemukan");
    if (!existing.isManual)
      this.badRequest("Hanya transaksi manual yang dapat dihapus");

    // Restore stock for goods
    if (existing.order) {
      await ManualTransactionRepository.restoreStockForGoods(existing.order.id);
    }

    // Delete transaction and order (cascade deletes orderItems)
    await ManualTransactionRepository.deleteTransactionAndOrder(
      transactionId,
      existing.order!.id,
    );
  }
}
