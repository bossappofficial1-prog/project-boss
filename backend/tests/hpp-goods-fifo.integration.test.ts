import { describe, expect, it, afterAll, beforeEach } from "bun:test";
import { db } from "../src/config/prisma";
import { ProductGoodsRepository } from "../src/repositories/product-goods.repository";
import { StockMovementType, ProductType, PaymentStatus, OrderStatus } from "@prisma/client";
import { recordStockIn, recordStockOut, adjustStock, recordReturn } from "../src/service/stock.service";
import { deductStockForCompletedOrder } from "../src/service/order.service";
import { handlePaymentSuccess, handlePaymentFailure } from "../src/service/payment-update.service";
import { messagePublisher } from "../src/service/message-publisher.service";

// Mock RabbitMQ publisher to avoid channel connection failures during tests
messagePublisher.publishOrderStatusUpdate = async () => {};
messagePublisher.publishWhatsAppPaymentAndOrderUpdate = async () => {};

describe("Product Goods HPP FIFO Integration Tests", () => {
  let userId: string;
  let businessId: string;
  let outletId: string;
  let productGoodsId: string;
  let productId: string;

  // Proteksi Keamanan Database Pengujian (User Rule 3)
  const verifySafeDatabase = () => {
    const dbUrl = process.env.DATABASE_URL || "";
    // Harus mengandung kata '_test' atau 'dummy' untuk memastikan ini bukan database utama
    if (!dbUrl.includes("_test") && !dbUrl.includes("dummy") && !dbUrl.includes("test")) {
      throw new Error(
        "⚠️ [KEAMANAN] Tes integrasi dibatalkan! Harap jalankan tes dengan database khusus pengujian (DATABASE_URL diakhiri dengan '_test' atau 'dummy'). Contoh: DATABASE_URL=postgresql://.../boss_db_test bun test tests/hpp-goods-fifo.integration.test.ts"
      );
    }
  };

  beforeEach(async () => {
    verifySafeDatabase();

    // Clean up existing data in test database
    await db.goodsStockBatch.deleteMany();
    await db.stockLog.deleteMany();
    await db.orderItem.deleteMany();
    await db.transaction.deleteMany();
    await db.order.deleteMany();
    await db.guestCustomer.deleteMany();
    await db.productGoods.deleteMany();
    await db.product.deleteMany();
    await db.outlet.deleteMany();
    await db.business.deleteMany();
    await db.user.deleteMany();

    // Create a mock user
    const user = await db.user.create({
      data: {
        name: "Retail Tester",
        email: "retail-tester@example.com",
        password: "hashedpassword123",
      },
    });
    userId = user.id;

    // Create a mock business
    const business = await db.business.create({
      data: {
        name: "Retail Corporation",
        ownerId: userId,
      },
    });
    businessId = business.id;

    // Create a mock outlet
    const outlet = await db.outlet.create({
      data: {
        name: "Supermart Outlet",
        slug: "supermart-outlet",
        businessId: businessId,
        type: "RETAIL",
      },
    });
    outletId = outlet.id;

    // Create a mock product GOODS
    const product = await db.product.create({
      data: {
        name: "Coca Cola 250ml",
        type: ProductType.GOODS,
        outletId,
        goods: {
          create: {
            unit: "bottle",
            sellingPrice: 8000,
            currentStock: 0,
            averageHpp: 0,
          },
        },
      },
      include: {
        goods: true,
      },
    });

    productId = product.id;
    productGoodsId = product.goods!.id;
  });

  afterAll(async () => {
    try {
      verifySafeDatabase();
      await db.goodsStockBatch.deleteMany();
      await db.stockLog.deleteMany();
      await db.orderItem.deleteMany();
      await db.transaction.deleteMany();
      await db.order.deleteMany();
      await db.guestCustomer.deleteMany();
      await db.productGoods.deleteMany();
      await db.product.deleteMany();
      await db.outlet.deleteMany();
      await db.business.deleteMany();
      await db.user.deleteMany();
    } catch (e) {
      // Ignore if not a safe DB during afterAll teardown
    }
    await db.$disconnect();
  });

  it("should successfully add a new stock batch & calculate average HPP", async () => {
    // Restock Batch 1: Beli 10 botol seharga total Rp 40.000 (Rp 4.000 per botol)
    const result1 = await ProductGoodsRepository.addStockBatch(
      productGoodsId,
      10,
      40000,
      "PO-001",
      "Restock awal"
    );

    expect(result1.newStock).toBe(10);
    expect(result1.newAverageHpp).toBe(4000);
    expect(result1.batch.remainingQuantity).toBe(10);
    expect(result1.batch.costPerUnit).toBe(4000);

    // Restock Batch 2: Beli 10 botol seharga total Rp 60.000 (Rp 6.000 per botol)
    const result2 = await ProductGoodsRepository.addStockBatch(
      productGoodsId,
      10,
      60000,
      "PO-002",
      "Restock kedua"
    );

    // Total stok = 20. Sisa batch 1 (10 x 4000) + sisa batch 2 (10 x 6000) = 100.000 / 20 = Rp 5.000
    expect(result2.newStock).toBe(20);
    expect(result2.newAverageHpp).toBe(5000);

    // Periksa log stok yang terbentuk
    const logs = await db.stockLog.findMany({
      where: { productGoodsId },
      orderBy: { createdAt: "desc" },
    });
    expect(logs.length).toBe(2);
    expect(logs[0].type).toBe(StockMovementType.IN);
    expect(logs[0].quantity).toBe(10);
    expect(logs[0].hppPerUnit).toBe(6000);
  });

  it("should successfully deduct stock using First In First Out (FIFO) across multiple batches", async () => {
    // Batch 1: Beli 10 botol @ Rp 4.000
    await ProductGoodsRepository.addStockBatch(productGoodsId, 10, 40000);
    await new Promise((r) => setTimeout(r, 50)); // Jeda timestamp

    // Batch 2: Beli 10 botol @ Rp 6.000
    await ProductGoodsRepository.addStockBatch(productGoodsId, 10, 60000);

    // Penjualan 12 botol (FIFO: menghabiskan 10 botol Batch 1 @ Rp 4000 + 2 botol Batch 2 @ Rp 6000)
    // Total HPP yang diharapkan = (10 x 4000) + (2 x 6000) = 40.000 + 12.000 = Rp 52.000
    const deduction = await ProductGoodsRepository.deductStockFIFO(productGoodsId, 12, "ORDER-001", "POS Sale");

    expect(deduction.qtyNeeded).toBe(12);
    expect(deduction.actualHppCost).toBe(52000);
    expect(deduction.newStock).toBe(8); // 20 - 12 = 8

    // Pastikan sisa batch 1 = 0, sisa batch 2 = 8
    const updatedBatches = await db.goodsStockBatch.findMany({
      where: { productGoodsId },
      orderBy: { createdAt: "asc" },
    });

    expect(updatedBatches[0].remainingQuantity).toBe(0);
    expect(updatedBatches[1].remainingQuantity).toBe(8);

    // Cek log pengeluaran stok
    const outLog = await db.stockLog.findFirst({
      where: { productGoodsId, type: StockMovementType.OUT },
    });
    expect(outLog).toBeDefined();
    expect(outLog!.quantity).toBe(-12);
    expect(outLog!.hppPerUnit).toBe(52000 / 12);
  });

  it("should handle negative stock gracefully by consuming from the newest batch", async () => {
    // Hanya ada 5 botol @ Rp 5.000
    await ProductGoodsRepository.addStockBatch(productGoodsId, 5, 25000);

    // Penjualan melebihi stok: jual 7 botol (butuh 5 botol @ Rp 5.000 + 2 botol minus)
    // HPP 5 botol (25.000) + 2 botol minus (2 x 5.000) = Rp 35.000
    const deduction = await ProductGoodsRepository.deductStockFIFO(productGoodsId, 7, "ORDER-002");

    expect(deduction.newStock).toBe(-2);
    expect(deduction.actualHppCost).toBe(35000);

    const batch = await db.goodsStockBatch.findFirst({
      where: { productGoodsId },
    });
    expect(batch!.remainingQuantity).toBe(-2); // Sisa stok menjadi negatif
  });

  it("should adjust stock correctly for manual adjustments (positive and negative)", async () => {
    // Mulai dengan 10 botol @ Rp 4.000
    await ProductGoodsRepository.addStockBatch(productGoodsId, 10, 40000);

    // Penyesuaian manual positif: tambah 5 botol
    const adjPos = await ProductGoodsRepository.adjustStock(productGoodsId, 5, "Manual audit addition");
    expect(adjPos.newStock).toBe(15);

    // Log tipe ADJUSTMENT harus ada
    const logPos = await db.stockLog.findFirst({
      where: { productGoodsId, type: StockMovementType.ADJUSTMENT, quantity: 5 },
    });
    expect(logPos).toBeDefined();

    // Penyesuaian manual negatif: kurangi 3 botol
    const adjNeg = await ProductGoodsRepository.adjustStock(productGoodsId, -3, "Broken bottle discard");
    expect(adjNeg.newStock).toBe(12);

    const logNeg = await db.stockLog.findFirst({
      where: { productGoodsId, type: StockMovementType.ADJUSTMENT, quantity: -3 },
    });
    expect(logNeg).toBeDefined();
  });

  it("should integrate with order complete and record real-time HPP in OrderItem", async () => {
    // Batch 1: Beli 10 botol @ Rp 4.000
    await ProductGoodsRepository.addStockBatch(productGoodsId, 10, 40000);

    // Buat pesanan retail
    const order = await db.order.create({
      data: {
        outlet: { connect: { id: outletId } },
        orderStatus: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.SUCCESS,
        totalAmount: 16000, // 2 x 8000
        guestCustomer: {
          create: {
            name: "Customer Offline",
            phone: "08123456789",
          }
        },
        items: {
          create: {
            productId,
            quantity: 2,
            priceAtTimeOfOrder: 8000,
          },
        },
      },
      include: {
        items: true,
      },
    });

    // Picu pemotongan stok pesanan selesai
    await deductStockForCompletedOrder(order.id);

    // Cek OrderItem terupdate dengan HPP riil (2 botol x Rp 4.000 = Rp 8.000)
    const orderItem = await db.orderItem.findFirst({
      where: { orderId: order.id },
    });

    expect(orderItem!.hppAtTimeOfOrder).toBe(8000);

    // Cek currentStock di ProductGoods
    const updatedGoods = await db.productGoods.findUnique({
      where: { id: productGoodsId },
    });
    expect(updatedGoods!.currentStock).toBe(8); // 10 - 2 = 8
  });

  it("should integrate with payment success transaction and payment failure stock restoration", async () => {
    // Restock: 10 botol @ Rp 5.000
    await ProductGoodsRepository.addStockBatch(productGoodsId, 10, 50000);

    // Buat pesanan online PENDING
    const order = await db.order.create({
      data: {
        outlet: { connect: { id: outletId } },
        orderStatus: OrderStatus.PROCESSING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 24000, // 3 x 8000
        guestCustomer: {
          create: {
            name: "Customer Online",
            phone: "08123456789",
          }
        },
        items: {
          create: {
            productId,
            quantity: 3,
            priceAtTimeOfOrder: 8000,
          },
        },
      },
      include: {
        items: {
          include: {
            product: { include: { goods: true, ticket: true } }
          }
        },
        outlet: true,
        guestCustomer: true,
      },
    });

    // 1. Sukses Pembayaran: stok dipotong FIFO dan mencatat HPP
    await handlePaymentSuccess(order.id);

    const checkGoodsSuccess = await db.productGoods.findUnique({
      where: { id: productGoodsId },
    });
    expect(checkGoodsSuccess!.currentStock).toBe(7); // 10 - 3 = 7

    const checkItemSuccess = await db.orderItem.findFirst({
      where: { orderId: order.id },
    });
    expect(checkItemSuccess!.hppAtTimeOfOrder).toBe(15000); // 3 x 5000 = 15000

    // Kembalikan status pembayaran pesanan ke PENDING secara lokal untuk mensimulasikan kegagalan
    await db.order.update({
      where: { id: order.id },
      data: { paymentStatus: PaymentStatus.PENDING },
    });

    // 2. Gagal Pembayaran: stok dikembalikan secara presisi
    await handlePaymentFailure(order.id);

    const checkGoodsFail = await db.productGoods.findUnique({
      where: { id: productGoodsId },
    });
    expect(checkGoodsFail!.currentStock).toBe(10); // Stok kembali penuh (7 + 3 = 10)

    // Cek bahwa batch baru terbentuk untuk menampung pengembalian
    const activeBatches = await db.goodsStockBatch.findMany({
      where: { productGoodsId, remainingQuantity: { gt: 0 } },
    });
    // Harus ada 2 batch (batch restock awal sisa 7, dan batch pengembalian sebesar 3)
    expect(activeBatches.length).toBe(2);
  });
});
