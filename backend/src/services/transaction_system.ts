// ==========================================
// TRANSACTION SYSTEM - Booking & Purchase
// ==========================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// TYPES & INTERFACES
// ==========================================

interface OrderItemInput {
  productId: string;
  quantity: number;
}

interface CreateOrderInput {
  customerId: string;
  outletId: string;
  items: OrderItemInput[];
  bookingDate?: Date; // Optional, untuk service booking
  paymentMethod: string;
  feePaidBy?: 'CUSTOMER' | 'OWNER';
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  externalId?: string;
  message: string;
  paymentUrl?: string; // Untuk redirect ke payment gateway
}

// ==========================================
// TRANSACTION SERVICE CLASS
// ==========================================

export class TransactionService {
  
  // 1. CREATE ORDER - Membuat pesanan baru
  async createOrder(input: CreateOrderInput) {
    return await prisma.$transaction(async (tx) => {
      // Validasi customer exists
      const customer = await tx.user.findUnique({
        where: { id: input.customerId }
      });
      
      if (!customer) {
        throw new Error('Customer tidak ditemukan');
      }

      // Validasi outlet exists
      const outlet = await tx.outlet.findUnique({
        where: { id: input.outletId },
        include: { business: true }
      });
      
      if (!outlet) {
        throw new Error('Outlet tidak ditemukan');
      }

      // Validasi dan hitung total amount
      let totalAmount = 0;
      const validatedItems = [];

      for (const item of input.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            stockEntries: {
              where: { outletId: input.outletId }
            }
          }
        });

        if (!product) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);
        }

        // Cek stok untuk produk GOODS
        if (product.type === 'GOODS') {
          const stock = product.stockEntries[0];
          if (!stock || stock.quantity < item.quantity) {
            throw new Error(`Stok tidak mencukupi untuk produk ${product.name}`);
          }
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        validatedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          priceAtTimeOfOrder: product.price,
          product: product
        });
      }

      // Buat order
      const order = await tx.order.create({
        data: {
          customerId: input.customerId,
          outletId: input.outletId,
          totalAmount: Math.round(totalAmount),
          bookingDate: input.bookingDate,
          status: 'PENDING',
          items: {
            create: validatedItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtTimeOfOrder: item.priceAtTimeOfOrder
            }))
          }
        },
        include: {
          items: {
            include: { product: true }
          },
          customer: true,
          outlet: {
            include: { business: true }
          }
        }
      });

      // Update stok untuk produk GOODS
      for (const item of validatedItems) {
        if (item.product.type === 'GOODS') {
          await tx.stock.update({
            where: {
              productId_outletId: {
                productId: item.productId,
                outletId: input.outletId
              }
            },
            data: {
              quantity: {
                decrement: item.quantity
              }
            }
          });
        }
      }

      return order;
    });
  }

  // 2. INITIATE PAYMENT - Memulai proses pembayaran
  async initiatePayment(orderId: string, paymentMethod: string, feePaidBy: 'CUSTOMER' | 'OWNER' = 'CUSTOMER') {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        outlet: {
          include: { business: true }
        },
        items: {
          include: { product: true }
        }
      }
    });

    if (!order) {
      throw new Error('Order tidak ditemukan');
    }

    if (order.status !== 'PENDING') {
      throw new Error('Order tidak dalam status PENDING');
    }

    // Hitung fee (2% dari total amount)
    const feePercentage = 0.02;
    const fee = Math.round(order.totalAmount * feePercentage);
    const adminFee = 4000; // Rp 4.000 admin fee

    // Total yang harus dibayar customer (jika fee ditanggung customer)
    const totalPayment = feePaidBy === 'CUSTOMER' 
      ? order.totalAmount + fee + adminFee 
      : order.totalAmount;

    // Simulasi integrasi dengan payment gateway (Midtrans)
    const paymentResult = await this.processPaymentGateway({
      amount: totalPayment,
      orderId: orderId,
      paymentMethod: paymentMethod,
      customerEmail: order.customer.email,
      customerName: order.customer.name
    });

    if (paymentResult.success) {
      // Buat transaction record
      const transaction = await prisma.transaction.create({
        data: {
          orderId: orderId,
          amount: totalPayment,
          paymentMethod: paymentMethod,
          status: 'PENDING',
          externalId: paymentResult.externalId,
          fee: fee,
          adminFee: adminFee,
          feePaidBy: feePaidBy
        }
      });

      return {
        success: true,
        transactionId: transaction.id,
        paymentUrl: paymentResult.paymentUrl,
        totalAmount: totalPayment,
        message: 'Pembayaran berhasil diinisiasi'
      };
    }

    return paymentResult;
  }

  // 3. HANDLE PAYMENT CALLBACK - Menangani callback dari payment gateway
  async handlePaymentCallback(externalId: string, status: 'SUCCESS' | 'FAILED') {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { externalId: externalId },
        include: {
          order: {
            include: {
              outlet: {
                include: {
                  business: {
                    include: { wallet: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!transaction) {
        throw new Error('Transaksi tidak ditemukan');
      }

      if (status === 'SUCCESS') {
        // Update transaction status
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: 'SUCCESS' }
        });

        // Update order status
        await tx.order.update({
          where: { id: transaction.orderId },
          data: { status: 'PAID' }
        });

        // Hitung amount yang masuk ke wallet (dikurangi fee jika ditanggung owner)
        let walletAmount = transaction.amount;
        if (transaction.feePaidBy === 'OWNER') {
          walletAmount = transaction.amount - transaction.fee - transaction.adminFee;
        } else {
          walletAmount = transaction.amount - transaction.fee - transaction.adminFee;
        }

        // Update business wallet
        const business = transaction.order.outlet.business;
        if (business.wallet) {
          await tx.wallet.update({
            where: { id: business.wallet.id },
            data: {
              balance: {
                increment: walletAmount
              }
            }
          });
        } else {
          // Buat wallet baru jika belum ada
          await tx.wallet.create({
            data: {
              businessId: business.id,
              balance: walletAmount
            }
          });
        }

        return {
          success: true,
          message: 'Pembayaran berhasil dikonfirmasi',
          walletAmount: walletAmount
        };

      } else {
        // Payment failed - rollback stock
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: 'FAILED' }
        });

        await tx.order.update({
          where: { id: transaction.orderId },
          data: { status: 'CANCELLED' }
        });

        // Rollback stock untuk produk GOODS
        const order = await tx.order.findUnique({
          where: { id: transaction.orderId },
          include: {
            items: {
              include: { product: true }
            }
          }
        });

        if (order) {
          for (const item of order.items) {
            if (item.product.type === 'GOODS') {
              await tx.stock.update({
                where: {
                  productId_outletId: {
                    productId: item.productId,
                    outletId: order.outletId
                  }
                },
                data: {
                  quantity: {
                    increment: item.quantity
                  }
                }
              });
            }
          }
        }

        return {
          success: false,
          message: 'Pembayaran gagal, stok telah dikembalikan'
        };
      }
    });
  }

  // 4. COMPLETE ORDER - Menyelesaikan pesanan (untuk pickup/delivery)
  async completeOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error('Order tidak ditemukan');
    }

    if (order.status !== 'PAID') {
      throw new Error('Order belum dibayar');
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' }
    });

    return {
      success: true,
      message: 'Pesanan telah diselesaikan'
    };
  }

  // 5. CANCEL ORDER - Membatalkan pesanan
  async cancelOrder(orderId: string, reason?: string) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: { product: true }
          },
          transaction: true
        }
      });

      if (!order) {
        throw new Error('Order tidak ditemukan');
      }

      if (order.status === 'COMPLETED') {
        throw new Error('Order yang sudah selesai tidak bisa dibatalkan');
      }

      // Rollback stock untuk produk GOODS
      for (const item of order.items) {
        if (item.product.type === 'GOODS') {
          await tx.stock.update({
            where: {
              productId_outletId: {
                productId: item.productId,
                outletId: order.outletId
              }
            },
            data: {
              quantity: {
                increment: item.quantity
              }
            }
          });
        }
      }

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' }
      });

      // Jika ada transaksi, update status transaksi
      if (order.transaction) {
        await tx.transaction.update({
          where: { id: order.transaction.id },
          data: { status: 'FAILED' }
        });
      }

      return {
        success: true,
        message: 'Pesanan berhasil dibatalkan dan stok telah dikembalikan'
      };
    });
  }

  // 6. GET ORDER DETAILS - Mendapatkan detail pesanan
  async getOrderDetails(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        outlet: {
          include: {
            business: {
              select: { id: true, name: true, description: true }
            }
          }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, type: true }
            }
          }
        },
        transaction: true
      }
    });

    return order;
  }

  // HELPER: Simulasi integrasi payment gateway
  private async processPaymentGateway(params: {
    amount: number;
    orderId: string;
    paymentMethod: string;
    customerEmail: string;
    customerName: string;
  }): Promise<PaymentResult> {
    // Simulasi call ke Midtrans API
    // Dalam implementasi nyata, ini akan memanggil Midtrans Snap API
    
    try {
      const externalId = `TXN_${Date.now()}_${params.orderId}`;
      const paymentUrl = `https://app.sandbox.midtrans.com/snap/v1/transactions/${externalId}`;
      
      // Simulasi response sukses dari Midtrans
      return {
        success: true,
        externalId: externalId,
        paymentUrl: paymentUrl,
        message: 'Payment gateway berhasil diinisiasi'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal menginisiasi payment gateway'
      };
    }
  }
}

// ==========================================
// USAGE EXAMPLES
// ==========================================

// Contoh penggunaan:
/*
const transactionService = new TransactionService();

// 1. Customer membuat order
const order = await transactionService.createOrder({
  customerId: "customer_123",
  outletId: "outlet_456", 
  items: [
    { productId: "product_789", quantity: 2 },
    { productId: "product_101", quantity: 1 }
  ],
  paymentMethod: "midtrans_qris",
  feePaidBy: "CUSTOMER"
});

// 2. Inisiasi pembayaran
const payment = await transactionService.initiatePayment(
  order.id, 
  "midtrans_qris", 
  "CUSTOMER"
);

// 3. Handle callback dari payment gateway
const callbackResult = await transactionService.handlePaymentCallback(
  "TXN_1234567890_order_123", 
  "SUCCESS"
);

// 4. Complete order (setelah barang diambil/jasa selesai)
const completion = await transactionService.completeOrder(order.id);
*/