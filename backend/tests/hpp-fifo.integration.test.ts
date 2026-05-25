import { describe, expect, it, afterAll, beforeEach } from "bun:test";
import { db } from "../src/config/prisma";
import { IngredientRepository } from "../src/repositories/ingredient.repository";
import { getProductByIdService, getProductsByOutletIdService } from "../src/service/product.service";

describe("HPP FIFO Integration Tests", () => {
  let userId: string;
  let businessId: string;
  let outletId: string;

  // Clean and seed prerequisite data before every test run
  beforeEach(async () => {
    // Clean up existing data to prevent collisions
    await db.ingredientStockLog.deleteMany();
    await db.ingredientStockBatch.deleteMany();
    await db.recipeIngredient.deleteMany();
    await db.recipe.deleteMany();
    await db.ingredient.deleteMany();
    await db.outlet.deleteMany();
    await db.business.deleteMany();
    await db.user.deleteMany();

    // Create a mock user
    const user = await db.user.create({
      data: {
        name: "HPP Tester",
        email: "hpp-tester@example.com",
        password: "hashedpassword123",
      },
    });
    userId = user.id;

    // Create a mock business
    const business = await db.business.create({
      data: {
        name: "FnB Enterprise",
        ownerId: userId,
      },
    });
    businessId = business.id;

    // Create a mock outlet
    const outlet = await db.outlet.create({
      data: {
        name: "Steakhouse Outlet",
        slug: "steakhouse-outlet",
        businessId: businessId,
        type: "FNB",
      },
    });
    outletId = outlet.id;
  });

  afterAll(async () => {
    // Clean up
    await db.ingredientStockLog.deleteMany();
    await db.ingredientStockBatch.deleteMany();
    await db.ingredient.deleteMany();
    await db.outlet.deleteMany();
    await db.business.deleteMany();
    await db.user.deleteMany();
    await db.$disconnect();
  });

  it("should create a raw ingredient successfully", async () => {
    const ingredient = await IngredientRepository.create({
      name: "Daging Sapi Slice",
      purchaseUnit: "kg",
      recipeUnit: "gram",
      conversionFactor: 1000, // 1 kg = 1000 grams
      minStock: 500,
      outletId,
    });

    expect(ingredient.id).toBeDefined();
    expect(ingredient.name).toBe("Daging Sapi Slice");
    expect(ingredient.purchaseUnit).toBe("kg");
    expect(ingredient.recipeUnit).toBe("gram");
    expect(ingredient.conversionFactor).toBe(1000);
    expect(ingredient.currentStock).toBe(0);
    expect(ingredient.averageCost).toBe(0);
  });

  it("should successfully calculate stock batch quantity and cost based on conversionFactor", async () => {
    const ingredient = await IngredientRepository.create({
      name: "Susu Segar",
      purchaseUnit: "Liter",
      recipeUnit: "ml",
      conversionFactor: 1000, // 1 L = 1000 ml
      outletId,
    });

    // Add purchase: Buy 2 Liters for Rp 40.000 (meaning Rp 20.000 per Liter or Rp 20 per ml)
    const result = await IngredientRepository.addStockBatch(
      ingredient.id,
      2, // purchaseQuantity = 2 Liter
      40000, // totalCost = Rp 40.000
      "PO-100",
      "Pembelian susu mingguan"
    );

    expect(result.newStock).toBe(2000); // 2 * 1000 = 2000 ml
    expect(result.newAverageCost).toBe(20); // 40000 / 2000 = Rp 20 per ml
    expect(result.batch.purchaseQuantity).toBe(2000);
    expect(result.batch.remainingQuantity).toBe(2000);
    expect(result.batch.costPerRecipeUnit).toBe(20);

    // Verify stock logs are created correctly
    const logs = await db.ingredientStockLog.findMany({
      where: { ingredientId: ingredient.id },
    });
    expect(logs.length).toBe(1);
    expect(logs[0].type).toBe("IN");
    expect(logs[0].quantity).toBe(2000);
    expect(logs[0].costPerUnit).toBe(20);
    expect(logs[0].referenceId).toBe("PO-100");
  });

  it("should successfully deduct stock using First In First Out (FIFO) logic across multiple batches", async () => {
    const ingredient = await IngredientRepository.create({
      name: "Biji Kopi Arabika",
      purchaseUnit: "pack",
      recipeUnit: "gram",
      conversionFactor: 500, // 1 pack = 500 grams
      outletId,
    });

    // Batch 1: Buy 1 pack for Rp 100.000 (500g at Rp 200/g)
    await IngredientRepository.addStockBatch(ingredient.id, 1, 100000);
    
    // Sleep briefly to ensure distinct timestamps
    await new Promise((r) => setTimeout(r, 50));

    // Batch 2: Buy 2 packs for Rp 300.000 (1000g at Rp 300/g)
    await IngredientRepository.addStockBatch(ingredient.id, 2, 300000);

    // Total stock is now 1500g, weighted average cost is (500*200 + 1000*300) / 1500 = 400k/1500 = Rp 266.67/g
    const checkedIng = await IngredientRepository.findById(ingredient.id);
    expect(checkedIng?.currentStock).toBe(1500);
    expect(checkedIng?.averageCost).toBeCloseTo(266.67, 1);

    // DEDUCT 700 grams (should consume all 500g of Batch 1 and 200g of Batch 2)
    // Batch 1 cost: 500g * Rp 200 = Rp 100.000
    // Batch 2 cost: 200g * Rp 300 = Rp 60.000
    // Total HPP cost expected = Rp 160.000
    const deduction = await IngredientRepository.deductStockFIFO(ingredient.id, 700);

    expect(deduction.qtyNeeded).toBe(700);
    expect(deduction.actualHppCost).toBe(160000);
    expect(deduction.newStock).toBe(800); // 1500 - 700 = 800g remaining

    // Verify individual batches after consumption
    const updatedIng = await IngredientRepository.findById(ingredient.id);
    expect(updatedIng?.currentStock).toBe(800);

    const batches = updatedIng?.batches || [];
    expect(batches.length).toBe(2);
    // Batch 1 (oldest) should have 0 remaining quantity
    expect(batches[0].remainingQuantity).toBe(0);
    // Batch 2 should have 800g remaining (1000 - 200)
    expect(batches[1].remainingQuantity).toBe(800);

    // Verify deduction log exists
    const logs = await db.ingredientStockLog.findMany({
      where: { ingredientId: ingredient.id, type: "POS_DEDUCTION" },
    });
    expect(logs.length).toBe(1);
    expect(logs[0].quantity).toBe(-700);
  });

  it("should support negative stock allowance by consuming newest batch or creating placeholder batches", async () => {
    const ingredient = await IngredientRepository.create({
      name: "Tepung Terigu",
      purchaseUnit: "kg",
      recipeUnit: "gram",
      conversionFactor: 1000,
      outletId,
    });

    // Case A: No batches exist, should create a negative placeholder batch
    // We request 300g when stock is 0
    const deductA = await IngredientRepository.deductStockFIFO(ingredient.id, 300);
    expect(deductA.newStock).toBe(-300);
    expect(deductA.actualHppCost).toBe(0); // Rp 0 because averageCost is 0

    let checkedIng = await IngredientRepository.findById(ingredient.id);
    expect(checkedIng?.batches.length).toBe(1);
    expect(checkedIng?.batches[0].remainingQuantity).toBe(-300);

    // Case B: A batch exists but we consume more than is available
    // First, let's add stock to get out of negative (Buy 1kg for Rp 10.000 -> Rp 10/g)
    // This will increase stock by +1000g, making currentStock = -300 + 1000 = 700g
    await IngredientRepository.addStockBatch(ingredient.id, 1, 10000);

    checkedIng = await IngredientRepository.findById(ingredient.id);
    expect(checkedIng?.currentStock).toBe(700);

    // Now request 1000g. We have 1 active batch with remainingQuantity = 1000g (Wait, what about the negative batch?
    // In our implementation, the negative batch was created, but we added a new batch.
    // Let's deduct 1000g (needs to consume all available 1000g and go into negative by 300g).
    const deductB = await IngredientRepository.deductStockFIFO(ingredient.id, 1000);
    expect(deductB.newStock).toBe(-300);
    expect(deductB.actualHppCost).toBe(10000); // consumed 1000g * Rp 10/g

    checkedIng = await IngredientRepository.findById(ingredient.id);
    // The newest batch should absorb the negative value
    const newestBatch = checkedIng?.batches.find(b => b.remainingQuantity < 0);
    expect(newestBatch).toBeDefined();
    expect(newestBatch?.remainingQuantity).toBe(-300);
  });

  it("should successfully log manual adjustments (positive and negative adjustments)", async () => {
    const ingredient = await IngredientRepository.create({
      name: "Keju Mozzarella",
      purchaseUnit: "block",
      recipeUnit: "gram",
      conversionFactor: 250,
      outletId,
    });

    // 1. Positive adjustment (increases stock and creates an adjustment batch)
    await IngredientRepository.adjustStock(ingredient.id, 500, "Stok awal opname");
    
    let checkedIng = await IngredientRepository.findById(ingredient.id);
    expect(checkedIng?.currentStock).toBe(500);
    expect(checkedIng?.batches.length).toBe(1);
    expect(checkedIng?.batches[0].remainingQuantity).toBe(500);

    // 2. Negative adjustment (decreases stock through FIFO deduction)
    await IngredientRepository.adjustStock(ingredient.id, -200, "Keju kadaluarsa");

    checkedIng = await IngredientRepository.findById(ingredient.id);
    expect(checkedIng?.currentStock).toBe(300);
    expect(checkedIng?.batches[0].remainingQuantity).toBe(300);

    const logs = await db.ingredientStockLog.findMany({
      where: { ingredientId: ingredient.id },
      orderBy: { createdAt: "desc" },
    });
    // Should have 3 logs: 
    // - FIFO deduction log for the negative adjustment (POS_DEDUCTION type from deductStockFIFO)
    // - Negative adjustment manual log (ADJUSTMENT type)
    // - Positive adjustment manual log (ADJUSTMENT type)
    expect(logs.some(l => l.type === "ADJUSTMENT" && l.quantity === 500)).toBe(true);
    expect(logs.some(l => l.type === "ADJUSTMENT" && l.quantity === -200)).toBe(true);
    expect(logs.some(l => l.type === "POS_DEDUCTION" && l.quantity === -200)).toBe(true);
  });

  it("should dynamically calculate and override goods.currentStock based on recipe ingredients", async () => {
    // Create a mock product of type GOODS (food/beverage olahan)
    const product = await db.product.create({
      data: {
        name: "Nasi Goreng Cabe Ijo",
        type: "GOODS",
        outletId: outletId,
        goods: {
          create: {
            currentStock: 0, // initially 0 in DB
            unit: "porsi",
            sellingPrice: 20000,
          },
        },
      },
      include: {
        goods: true,
      },
    });

    // Create a recipe for the product
    const recipe = await db.recipe.create({
      data: {
        productId: product.id,
      },
    });

    // Create raw ingredients (Beras & Cabe)
    const beras = await IngredientRepository.create({
      name: "Beras",
      purchaseUnit: "kg",
      recipeUnit: "gram",
      conversionFactor: 1000,
      outletId,
    });

    const cabe = await IngredientRepository.create({
      name: "Cabe",
      purchaseUnit: "kg",
      recipeUnit: "gram",
      conversionFactor: 1000,
      outletId,
    });

    // Associate ingredients with recipe (250g Beras and 100g Cabe per portion)
    await db.recipeIngredient.create({
      data: {
        recipeId: recipe.id,
        ingredientId: beras.id,
        quantity: 250,
      },
    });

    await db.recipeIngredient.create({
      data: {
        recipeId: recipe.id,
        ingredientId: cabe.id,
        quantity: 100,
      },
    });

    // 1. Initial State: No stock is entered. Portions should be 0.
    let fetched = await getProductByIdService(product.id);
    expect(fetched.goods?.currentStock).toBe(0);

    // 2. Add Stock:
    // Beras: 10 kg -> 10000 grams. Sisa Beras portions = 10000 / 250 = 40.
    // Cabe: 1 kg -> 1000 grams. Sisa Cabe portions = 1000 / 100 = 10.
    // Minimum sisa portions: 10.
    await IngredientRepository.addStockBatch(beras.id, 10, 120000); // 10 kg
    await IngredientRepository.addStockBatch(cabe.id, 1, 50000); // 1 kg

    // Fetch single product, should be 10 portions
    fetched = await getProductByIdService(product.id);
    expect(fetched.goods?.currentStock).toBe(10);

    // Fetch list of products, Nasi Goreng Cabe Ijo should also be 10 portions
    const listResult = await getProductsByOutletIdService(outletId, "GOODS", { page: 1, limit: 10 });
    const listedProduct = listResult.data.find(p => p.id === product.id) as any;
    expect(listedProduct).toBeDefined();
    expect(listedProduct.goods?.currentStock).toBe(10);
  });
});
