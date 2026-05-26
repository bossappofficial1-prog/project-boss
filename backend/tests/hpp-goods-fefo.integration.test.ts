import { describe, expect, it, afterAll, beforeEach } from "bun:test";
import { db } from "../src/config/prisma";
import { ProductGoodsRepository } from "../src/repositories/product-goods.repository";
import { IngredientRepository } from "../src/repositories/ingredient.repository";
import { StockMovementType, ProductType } from "@prisma/client";
import { recordStockIn } from "../src/service/stock.service";
import { IngredientService } from "../src/service/ingredient.service";
import { messagePublisher } from "../src/service/message-publisher.service";

// Mock RabbitMQ publisher to avoid channel connection failures during tests
messagePublisher.publishOrderStatusUpdate = async () => {};
messagePublisher.publishWhatsAppPaymentAndOrderUpdate = async () => {};

describe("Smart FEFO Integration Tests", () => {
  let userId: string;
  let businessId: string;
  let outletId: string;
  let productGoodsId: string;
  let productId: string;
  let ingredientId: string;

  // Proteksi Keamanan Database Pengujian (User Rule 3)
  const verifySafeDatabase = () => {
    const dbUrl = process.env.DATABASE_URL || "";
    // Harus mengandung kata '_test' atau 'dummy' untuk memastikan ini bukan database utama
    if (!dbUrl.includes("_test") && !dbUrl.includes("dummy") && !dbUrl.includes("test")) {
      throw new Error(
        "⚠️ [KEAMANAN] Tes integrasi dibatalkan! Harap jalankan tes dengan database khusus pengujian (DATABASE_URL diakhiri dengan '_test' atau 'dummy')."
      );
    }
  };

  beforeEach(async () => {
    verifySafeDatabase();

    // Clean up existing data in test database safely
    await db.goodsStockBatch.deleteMany();
    await db.ingredientStockBatch.deleteMany();
    await db.stockLog.deleteMany();
    await db.ingredientStockLog.deleteMany();
    await db.orderItem.deleteMany();
    await db.transaction.deleteMany();
    await db.order.deleteMany();
    await db.guestCustomer.deleteMany();
    await db.recipeIngredient.deleteMany();
    await db.recipe.deleteMany();
    await db.ingredient.deleteMany();
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
        name: "Susu UHT Premium 1L",
        type: ProductType.GOODS,
        outletId,
        goods: {
          create: {
            unit: "carton",
            sellingPrice: 18000,
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

    // Create a mock ingredient for FnB FEFO testing
    const ingredient = await db.ingredient.create({
      data: {
        name: "Keju Mozzarella",
        purchaseUnit: "pack",
        recipeUnit: "gram",
        conversionFactor: 1000, // 1 pack = 1000g
        currentStock: 0,
        averageCost: 0,
        outletId,
      },
    });
    ingredientId = ingredient.id;
  });

  afterAll(async () => {
    try {
      verifySafeDatabase();
      await db.goodsStockBatch.deleteMany();
      await db.ingredientStockBatch.deleteMany();
      await db.stockLog.deleteMany();
      await db.ingredientStockLog.deleteMany();
      await db.orderItem.deleteMany();
      await db.transaction.deleteMany();
      await db.order.deleteMany();
      await db.guestCustomer.deleteMany();
      await db.recipeIngredient.deleteMany();
      await db.recipe.deleteMany();
      await db.ingredient.deleteMany();
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

  it("should prioritize batch that expires earlier (FEFO) regardless of creation order", async () => {
    // Hari ini
    const today = new Date();

    // Batch A: Dibuat pertama, kedaluwarsa 10 hari lagi
    const expiryA = new Date(today);
    expiryA.setDate(today.getDate() + 10);
    await ProductGoodsRepository.addStockBatch(
      productGoodsId,
      10, // Qty 10
      150000, // HPP Rp 15.000 per unit
      "PO-A",
      "Batch A - Kedaluwarsa lambat",
      undefined,
      undefined,
      StockMovementType.IN,
      expiryA
    );

    // Jeda timestamp untuk memastikan perbedaan createdAt teratur jika FIFO
    await new Promise((r) => setTimeout(r, 50));

    // Batch B: Dibuat kedua, kedaluwarsa 2 hari lagi (EXPIRES SOONER!)
    const expiryB = new Date(today);
    expiryB.setDate(today.getDate() + 2);
    await ProductGoodsRepository.addStockBatch(
      productGoodsId,
      10, // Qty 10
      200000, // HPP Rp 20.000 per unit
      "PO-B",
      "Batch B - Kedaluwarsa cepat",
      undefined,
      undefined,
      StockMovementType.IN,
      expiryB
    );

    // Lakukan penjualan/deduksi stok sebesar 12 unit
    // FEFO: Harus menghabiskan 10 unit Batch B (kedaluwarsa 2 hari lagi) terlebih dahulu,
    // lalu mengambil 2 unit dari Batch A (kedaluwarsa 10 hari lagi).
    // Total HPP cost = (10 * 20000) + (2 * 15000) = 200.000 + 30.000 = Rp 230.000
    const deduction = await ProductGoodsRepository.deductStockFIFO(
      productGoodsId,
      12,
      "SALE-FEFO-01",
      "Uji Coba FEFO"
    );

    expect(deduction.qtyNeeded).toBe(12);
    expect(deduction.actualHppCost).toBe(230000);
    expect(deduction.newStock).toBe(8); // Total 20 - 12 = 8

    // Ambil sisa batch dari database untuk verifikasi
    const batches = await db.goodsStockBatch.findMany({
      where: { productGoodsId },
      orderBy: { expiryDate: "asc" },
    });

    expect(batches.length).toBe(2);

    // Batch B (expiryB) harus habis terjual (remainingQuantity = 0)
    const batchB = batches.find((b) => b.expiryDate?.getTime() === expiryB.getTime());
    expect(batchB).toBeDefined();
    expect(batchB!.remainingQuantity).toBe(0);

    // Batch A (expiryA) harus bersisa 8 unit (remainingQuantity = 8)
    const batchA = batches.find((b) => b.expiryDate?.getTime() === expiryA.getTime());
    expect(batchA).toBeDefined();
    expect(batchA!.remainingQuantity).toBe(8);
  });

  it("should prioritize batches with expiry dates over null expiry dates, then fallback to FIFO for nulls", async () => {
    const today = new Date();

    // Batch A (Tanpa Expiry Date) - Dibuat pertama
    await ProductGoodsRepository.addStockBatch(
      productGoodsId,
      5,
      50000, // Rp 10.000 per unit
      "PO-A",
      "Batch A - Tanpa Expiry",
      undefined,
      undefined,
      StockMovementType.IN,
      undefined
    );

    await new Promise((r) => setTimeout(r, 50));

    // Batch B (Expiry Date: 5 hari lagi) - Dibuat kedua (Lebih baru tapi punya expiry)
    const expiryB = new Date(today);
    expiryB.setDate(today.getDate() + 5);
    await ProductGoodsRepository.addStockBatch(
      productGoodsId,
      5,
      60000, // Rp 12.000 per unit
      "PO-B",
      "Batch B - Expiry 5 hari",
      undefined,
      undefined,
      StockMovementType.IN,
      expiryB
    );

    await new Promise((r) => setTimeout(r, 50));

    // Batch C (Tanpa Expiry Date) - Dibuat ketiga
    await ProductGoodsRepository.addStockBatch(
      productGoodsId,
      5,
      75000, // Rp 15.000 per unit
      "PO-C",
      "Batch C - Tanpa Expiry baru",
      undefined,
      undefined,
      StockMovementType.IN,
      undefined
    );

    // Deduct 8 unit.
    // Urutan prioritas FEFO:
    // 1. Batch B (Expiry 5 hari) -> Ambil 5 unit @ 12.000 = Rp 60.000
    // 2. Batch A (Tanpa Expiry, tertua) -> Ambil 3 unit @ 10.000 = Rp 30.000
    // Total HPP Cost = 60.000 + 30.000 = Rp 90.000
    const deduction = await ProductGoodsRepository.deductStockFIFO(
      productGoodsId,
      8,
      "SALE-FEFO-02"
    );

    expect(deduction.qtyNeeded).toBe(8);
    expect(deduction.actualHppCost).toBe(90000);
    expect(deduction.newStock).toBe(7); // Total 15 - 8 = 7

    // Verifikasi sisa kuantitas batch di database
    const batchRecords = await db.goodsStockBatch.findMany({
      where: { productGoodsId },
      orderBy: [
        { expiryDate: { sort: "asc", nulls: "last" } },
        { createdAt: "asc" }
      ]
    });

    // Batch B (Index 0 dalam pengurutan) -> Harus sisa 0
    expect(batchRecords[0].expiryDate).not.toBeNull();
    expect(batchRecords[0].remainingQuantity).toBe(0);

    // Batch A (Index 1: tanpa expiry, tertua) -> Harus sisa 2 (dari 5 diambil 3)
    expect(batchRecords[1].expiryDate).toBeNull();
    expect(batchRecords[1].remainingQuantity).toBe(2);

    // Batch C (Index 2: tanpa expiry, terbaru) -> Harus sisa 5 (belum terjamah)
    expect(batchRecords[2].expiryDate).toBeNull();
    expect(batchRecords[2].remainingQuantity).toBe(5);
  });

  it("should successfully record stock in with expiry date via Service schema integration", async () => {
    const today = new Date();
    const expiry = new Date(today);
    expiry.setDate(today.getDate() + 15);

    // Format ISO string untuk disimulasikan sebagai input payload API
    const expiryISOString = expiry.toISOString();

    const result = await recordStockIn({
      productGoodsId,
      quantity: 12,
      hppPerUnit: 14000,
      notes: "Stock in via service with expiry",
      expiryDate: expiryISOString as any, // Zod schema transform converts string to Date
    });

    expect(result.newStock).toBe(12);
    expect(result.batch.remainingQuantity).toBe(12);
    expect(result.batch.expiryDate).not.toBeNull();
    expect(new Date(result.batch.expiryDate!).getDate()).toBe(expiry.getDate());
  });

  it("should apply FEFO sorting to FnB Ingredient Stock Batches correctly", async () => {
    const today = new Date();

    // Batch A (Bahan Baku Keju): expires in 8 days (created first)
    const expiryA = new Date(today);
    expiryA.setDate(today.getDate() + 8);
    await IngredientRepository.addStockBatch(
      ingredientId,
      2, // 2 packs = 2000 grams
      80000, // Rp 40.000 per pack / Rp 40 per gram
      "PO-ING-A",
      "Keju Batch A",
      expiryA
    );

    await new Promise((r) => setTimeout(r, 50));

    // Batch B (Bahan Baku Keju): expires in 3 days (EXPIRES SOONER, created second)
    const expiryB = new Date(today);
    expiryB.setDate(today.getDate() + 3);
    await IngredientRepository.addStockBatch(
      ingredientId,
      3, // 3 packs = 3000 grams
      150000, // Rp 50.000 per pack / Rp 50 per gram
      "PO-ING-B",
      "Keju Batch B",
      expiryB
    );

    // Kurangi stok bahan baku sebesar 3500 gram (unit resep)
    // FEFO: Harus mengonsumsi habis Batch B (3000g @ Rp 50/g) = Rp 150.000
    // Dan mengambil 500g dari Batch A (500g @ Rp 40/g) = Rp 20.000
    // Total HPP Cost diharapkan = 150.000 + 20.000 = Rp 170.000
    const deduction = await IngredientRepository.deductStockFIFO(
      ingredientId,
      3500,
      "SALE-ING-01"
    );

    expect(deduction.qtyNeeded).toBe(3500);
    expect(deduction.actualHppCost).toBe(170000);
    expect(deduction.newStock).toBe(1500); // 5000g - 3500g = 1500g

    // Periksa sisa batch di database
    const batches = await db.ingredientStockBatch.findMany({
      where: { ingredientId },
      orderBy: { expiryDate: "asc" },
    });

    expect(batches.length).toBe(2);

    // Batch B (expiryB) harus habis terjual
    const batchB = batches.find((b) => b.expiryDate?.getTime() === expiryB.getTime());
    expect(batchB).toBeDefined();
    expect(batchB!.remainingQuantity).toBe(0);

    // Batch A (expiryA) harus sisa 1500 gram (2000 - 500)
    const batchA = batches.find((b) => b.expiryDate?.getTime() === expiryA.getTime());
    expect(batchA).toBeDefined();
    expect(batchA!.remainingQuantity).toBe(1500);
  });
});
