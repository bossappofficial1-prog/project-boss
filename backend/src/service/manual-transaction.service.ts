import { BaseService } from "./base.service";
import { ManualTransactionRepository } from "../repositories/manual-transaction.repository";
import { PaymentStatus, OrderStatus, ProductType, ManualPaymentType } from "@prisma/client";

export interface CreateManualTransactionInput {
  outletId: string;
  transactionDate: Date;
  customerName?: string;
  customerPhone?: string;
  amount: number;
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
}

export class ManualTransactionService extends BaseService {
  static async createManualTransaction(input: CreateManualTransactionInput): Promise<ManualTransactionResult> {
    const productIds = input.items.map((i) => i.productId);
    const products = await ManualTransactionRepository.findProductsByIds(productIds);

    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      this.badRequest(`Produk tidak ditemukan atau tidak aktif: ${missingIds.join(", ")}`);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let calculatedAmount = 0;

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
        this.badRequest(`Produk ${product.name} tidak memiliki harga jual yang valid`);
      }

      calculatedAmount += price * item.quantity;
    }

    const finalAmount = input.amount > 0 ? input.amount : calculatedAmount;

    const customer = await ManualTransactionRepository.findOrCreateGuestCustomer(
      input.customerPhone,
      input.customerName
    );

    const order = await ManualTransactionRepository.createOrder({
      outlet: { connect: { id: input.outletId } },
      guestCustomer: { connect: { id: customer.id } },
      totalAmount: finalAmount,
      taxAmount: 0,
      discountAmount: 0,
      pointsRedeemed: 0,
      bookingDate: input.items.find((i) => i.bookingDate)?.bookingDate ?? input.transactionDate,
      customerType: "GUEST",
      paymentStatus: PaymentStatus.SUCCESS,
      orderStatus: OrderStatus.COMPLETED,
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
              commission = Math.round(price * (product.service.commissionValue / 100));
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
    };
  }
}