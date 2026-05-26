import { describe, expect, it, afterAll, beforeEach } from "bun:test";
import { db } from "../src/config/prisma";
import { ProductGoodsRepository } from "../src/repositories/product-goods.repository";
import { IngredientRepository } from "../src/repositories/ingredient.repository";
import { PurchaseOrderRepository } from "../src/repositories/purchase-order.repository";
import { PurchaseOrderService } from "../src/service/purchase-order.service";
import { StockMovementType, ProductType, PurchaseOrderStatus } from "@prisma/client";
import { messagePublisher } from "../src/service/message-publisher.service";

// Mock RabbitMQ publisher to avoid channel connection failures during tests
messagePublisher.publishOrderStatusUpdate = async () => {};
messagePublisher.publishWhatsAppPaymentAndOrderUpdate = async () => {};

describe("SCM Auto-PO & Supplier Alert Integration Tests", () => {
  let userId: string;
  let businessId: string;
  let outletId: string;
  let supplierId: string;
  let productGoodsId: string;
  let productId: string;
  let ingredientId: string;

  // Proteksi Keamanan Database Pengujian (User Rule 3)
  const verifySafeDatabase = () => {
    const dbUrl = process.env.DATABASE_URL || "";
    if (!dbUrl.includes("_test") && !dbUrl.includes("dummy") && !dbUrl.includes("test")) {
      throw new Error(
        "⚠️ [KEAMANAN] Tes integrasi dibatalkan! Harap jalankan tes dengan database khusus pengujian (DATABASE_URL diakhiri dengan '_test' atau 'dummy')."
      );
    }
  };

  beforeEach(async () => {
    verifySafeDatabase();

    // Clean up existing data safely
    await db.purchaseOrderItem.deleteMany();
    await db.purchaseOrder.deleteMany();
    await db.goodsStockBatch.deleteMany();
    await db.ingredientStockBatch.deleteMany();
    await db.stockLog.deleteMany();
    await db.ingredientStockLog.deleteMany();
    await db.recipeIngredient.deleteMany();
    await db.recipe.deleteMany();
    await db.ingredient.deleteMany();
    await db.supplierProduct.deleteMany();
    await db.supplier.deleteMany();
    await db.productGoods.deleteMany();
    await db.product.deleteMany();
    await db.outlet.deleteMany();
    await db.business.deleteMany();
    await db.user.deleteMany();

    // Seed basic data
    const user = await db.user.create({
      data: {
        name: "Test SCM Owner",
        email: `owner-${Math.random()}@test.com`,
        password: "password123",
        role: "OWNER",
      },
    });
    userId = user.id;

    const business = await db.business.create({
      data: {
        name: "Test SCM Business",
        ownerId: userId,
      },
    });
    businessId = business.id;

    const outlet = await db.outlet.create({
      data: {
        name: "Test SCM Outlet",
        slug: `scm-outlet-${Math.random()}`,
        businessId: businessId,
        type: "RETAIL",
      },
    });
    outletId = outlet.id;

    // Create a supplier
    const supplier = await db.supplier.create({
      data: {
        name: "PT Coca Cola Indonesia",
        phone: "081298765432",
        email: "coke@supplier.com",
        address: "Jakarta Timur",
        notes: "Primary beverage distributor",
        outletId: outletId,
      },
    });
    supplierId = supplier.id;

    // Create a Product (Retail)
    const product = await db.product.create({
      data: {
        name: "Coca Cola 330ml",
        type: "GOODS",
        outletId: outletId,
      },
    });
    productId = product.id;

    const productGoods = await db.productGoods.create({
      data: {
        productId: productId,
        currentStock: 10,
        minStock: 12,
        maxStock: 50,
        unit: "BOTOL",
        sellingPrice: 8000,
        averageHpp: 5000,
      },
    });
    productGoodsId = productGoods.id;

    // Link product to supplier
    await db.supplierProduct.create({
      data: {
        supplierId: supplierId,
        productGoodsId: productGoodsId,
      },
    });

    // Create an Ingredient (FnB)
    const ingredient = await db.ingredient.create({
      data: {
        name: "Keju Mozzarella",
        purchaseUnit: "BOX",
        recipeUnit: "GRAM",
        conversionFactor: 1000, // 1 box = 1000 grams
        currentStock: 800, // 800 grams
        minStock: 1000, // 1000 grams
        averageCost: 50, // 50 rupiah per gram
        outletId: outletId,
      },
    });
    ingredientId = ingredient.id;
  });

  afterAll(async () => {
    // Clean up to be nice
    await db.purchaseOrderItem.deleteMany();
    await db.purchaseOrder.deleteMany();
    await db.goodsStockBatch.deleteMany();
    await db.ingredientStockBatch.deleteMany();
    await db.stockLog.deleteMany();
    await db.ingredientStockLog.deleteMany();
    await db.supplierProduct.deleteMany();
    await db.supplier.deleteMany();
    await db.ingredient.deleteMany();
    await db.productGoods.deleteMany();
    await db.product.deleteMany();
    await db.outlet.deleteMany();
    await db.business.deleteMany();
    await db.user.deleteMany();
  });

  it("should auto-create a DRAFT Purchase Order for Retail when stock goes below minStock", async () => {
    // Stok saat ini adalah 10, minStock adalah 12. Pemicu Auto-PO harus aktif!
    await PurchaseOrderService.triggerLowStockAutoPO(outletId, "GOODS", productGoodsId);

    // Verifikasi bahwa draf PO telah dibuat secara otomatis
    const po = await db.purchaseOrder.findFirst({
      where: { outletId, supplierId, status: "DRAFT" },
      include: { items: true },
    });

    expect(po).not.toBeNull();
    expect(po!.poNumber).toStartWith("PO-");
    expect(po!.items.length).toBe(1);
    expect(po!.items[0].productGoodsId).toBe(productGoodsId);
    
    // Formula Max Stock: maxStock (50) - currentStock (10) = 40
    expect(po!.items[0].quantity).toBe(40);
    expect(po!.items[0].priceAtOrder).toBe(5000); // averageHpp dari productGoods
    expect(po!.totalEstimate).toBe(40 * 5000);
  });

  it("should auto-create a DRAFT Purchase Order for Ingredients when stock goes below minStock using conversion factor", async () => {
    // Stok saat ini adalah 800 grams, minStock adalah 1000 grams. Pemicu Auto-PO harus aktif!
    await PurchaseOrderService.triggerLowStockAutoPO(outletId, "INGREDIENT", ingredientId);

    // Supplier fallback pertama outlet adalah PT Coca Cola
    const po = await db.purchaseOrder.findFirst({
      where: { outletId, supplierId, status: "DRAFT" },
      include: { items: true },
    });

    expect(po).not.toBeNull();
    expect(po!.items.length).toBe(1);
    expect(po!.items[0].ingredientId).toBe(ingredientId);

    // recipeQtyNeeded = minStock (1000) * 2 = 2000 grams
    // orderQty in purchaseUnit = Math.ceil(2000 / conversionFactor (1000)) = 2 boxes
    expect(po!.items[0].quantity).toBe(2);
    expect(po!.items[0].priceAtOrder).toBe(50 * 1000); // averageCost * conversionFactor = 50000 per box
    expect(po!.totalEstimate).toBe(2 * 50000);
  });

  it("should update draft items, transition status to SENT, and complete PO with automatic FIFO/FEFO stock-in", async () => {
    // 1. Buat Draf PO secara manual
    const po = await PurchaseOrderRepository.create(
      {
        poNumber: "PO-TEST-MANUAL",
        supplierId,
        outletId,
        notes: "Manual draft for integration flow test",
      },
      [
        {
          productGoodsId: productGoodsId,
          quantity: 20,
          priceAtOrder: 4500,
        },
        {
          ingredientId: ingredientId,
          quantity: 3,
          priceAtOrder: 48000,
        },
      ]
    );

    expect(po.status).toBe(PurchaseOrderStatus.DRAFT);
    expect(po.totalEstimate).toBe(20 * 4500 + 3 * 48000);

    // 2. Transisi PO ke SENT (Kirim ke Supplier)
    const sentPo = await PurchaseOrderService.sendPOToSupplier(po.id);
    expect(sentPo.status).toBe(PurchaseOrderStatus.SENT);

    // 3. Konfirmasi Penerimaan PO (Complete & Auto-Stock-In)
    const completedPo = await PurchaseOrderService.completePurchaseOrder(po.id);
    expect(completedPo.status).toBe(PurchaseOrderStatus.COMPLETED);

    // 4. Verifikasi stok bertambah otomatis di database batch FIFO/FEFO!
    // A. Retail Product: stok awal 10 + masuk 20 = 30
    const updatedGoods = await db.productGoods.findUnique({
      where: { id: productGoodsId },
      include: { batches: true },
    });
    expect(updatedGoods!.currentStock).toBe(30);
    expect(updatedGoods!.batches.length).toBe(1);
    expect(updatedGoods!.batches[0].purchaseQuantity).toBe(20);
    expect(updatedGoods!.batches[0].costPerUnit).toBe(4500);

    // B. Ingredient: stok awal 800 grams + masuk (3 boxes * 1000 conversion) = 3800 grams
    const updatedIngredient = await db.ingredient.findUnique({
      where: { id: ingredientId },
      include: { batches: true },
    });
    expect(updatedIngredient!.currentStock).toBe(3800);
    expect(updatedIngredient!.batches.length).toBe(1);
    expect(updatedIngredient!.batches[0].purchaseQuantity).toBe(3000); // 3 * 1000
    expect(updatedIngredient!.batches[0].costPerRecipeUnit).toBe(48); // 48000 / 1000
  });
});
