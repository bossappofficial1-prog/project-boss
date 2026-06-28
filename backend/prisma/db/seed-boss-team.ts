import {
  ProductType,
  ServiceStatus,
  OrderStatus,
  PaymentStatus,
  ManualPaymentType,
  StockMovementType,
  CustomerType,
  OutletType,
  TableStatus,
  BillStatus,
  StaffStatus,
  StaffRole,
  LoyaltyPointHistoryType,
  BookingSlotStatus,
  PurchaseOrderStatus,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { subDays, addHours, setHours, startOfDay, addMinutes } from "date-fns";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

// ─── DB Connection ──────────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

// ─── Config ─────────────────────────────────────────────────────────────────

const BUSINESS_ID = "BIZ-CSUHVTNPZ5";
const OWNER_ID = "9a3f581e-75e3-4f6b-878e-3422f54aebfb";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const genId = (prefix: string) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${id}`;
};

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomDate = (daysAgo: number): Date => {
  const now = new Date();
  const past = subDays(now, daysAgo);
  return new Date(
    past.getTime() + Math.random() * (now.getTime() - past.getTime()),
  );
};

const randomHour = (date: Date, minH = 9, maxH = 21): Date => {
  const hour = rand(minH, maxH);
  const minute = rand(0, 59);
  return setHours(startOfDay(date), hour + minute / 60);
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding BOSS Team outlets...");

  // Step 1: Cleanup existing outlets for this business
  await cleanupExistingOutlets();

  // Step 2: Create outlets
  const fnbOutlet = await createFNBOutlet();
  const retailOutlet = await createRetailOutlet();
  const serviceOutlet = await createServiceOutlet();
  const eventOutlet = await createEventOutlet();

  // Step 3: Create customers (shared)
  const customers = await createCustomers();

  // Step 4: Seed orders for each outlet
  await seedFNBOrders(fnbOutlet.outlet.id, customers);
  await seedRetailOrders(retailOutlet.outlet.id, customers);
  await seedServiceOrders(serviceOutlet.outlet.id, customers);
  await seedEventOrders(eventOutlet.outlet.id, customers);

  console.log("\n🎉 Seeding completed!");
  console.log("─────────────────────────────────");
  console.log(`🏪 FNB Outlet    : Warung Makan Padang`);
  console.log(`🛒 Retail Outlet : Toko Sembako Maju`);
  console.log(`💇 Service Outlet: Salon Kecantikan`);
  console.log(`🎵 Event Outlet  : Event Konser Musik`);
  console.log("─────────────────────────────────");
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

async function cleanupExistingOutlets() {
  console.log("🧹 Cleaning existing outlets for BOSS Team...");

  const outlets = await db.outlet.findMany({
    where: { businessId: BUSINESS_ID },
    select: { id: true },
  });

  if (outlets.length === 0) {
    console.log("  No existing outlets found.");
    return;
  }

  const outletIds = outlets.map((o) => o.id);

  // Delete in order respecting FKs
  await db.loyaltyPointHistory.deleteMany({
    where: { outletId: { in: outletIds } },
  });
  await db.outletMembership.deleteMany({
    where: { outletId: { in: outletIds } },
  });
  await db.stockLog.deleteMany({
    where: { productGoods: { product: { outletId: { in: outletIds } } } },
  });
  await db.ingredientStockLog.deleteMany({
    where: { ingredient: { outletId: { in: outletIds } } },
  });
  await db.ingredientStockBatch.deleteMany({
    where: { ingredient: { outletId: { in: outletIds } } },
  });
  await db.recipeIngredient.deleteMany({
    where: { recipe: { product: { outletId: { in: outletIds } } } },
  });
  await db.recipe.deleteMany({
    where: { product: { outletId: { in: outletIds } } },
  });
  await db.transaction.deleteMany({
    where: { order: { outletId: { in: outletIds } } },
  });
  await db.orderItem.deleteMany({
    where: { order: { outletId: { in: outletIds } } },
  });
  await db.order.deleteMany({ where: { outletId: { in: outletIds } } });
  await db.bill.deleteMany({ where: { outletId: { in: outletIds } } });
  await db.bookingSlot.deleteMany({
    where: { productService: { product: { outletId: { in: outletIds } } } },
  });
  await db.productGoods.deleteMany({
    where: { product: { outletId: { in: outletIds } } },
  });
  await db.productService.deleteMany({
    where: { product: { outletId: { in: outletIds } } },
  });
  await db.productTicket.deleteMany({
    where: { product: { outletId: { in: outletIds } } },
  });
  await db.productMedia.deleteMany({
    where: { product: { outletId: { in: outletIds } } },
  });
  await db.product.deleteMany({ where: { outletId: { in: outletIds } } });
  await db.expense.deleteMany({ where: { outletId: { in: outletIds } } });
  await db.ingredient.deleteMany({ where: { outletId: { in: outletIds } } });
  await db.supplier.deleteMany({ where: { outletId: { in: outletIds } } });
  await db.staff.deleteMany({ where: { outletId: { in: outletIds } } });
  await db.outletTable.deleteMany({
    where: { outletId: { in: outletIds } },
  });
  await db.outletOperatingHours.deleteMany({
    where: { outletId: { in: outletIds } },
  });
  await db.receiptSetting.deleteMany({
    where: { outletId: { in: outletIds } },
  });
  await db.loyaltyConfig.deleteMany({
    where: { outletId: { in: outletIds } },
  });
  await db.loyaltyTier.deleteMany({ where: { outletId: { in: outletIds } } });
  await db.loyaltyReward.deleteMany({
    where: { outletId: { in: outletIds } },
  });
  await db.productCategory.deleteMany({
    where: { outletId: { in: outletIds } },
  });
  await db.outlet.deleteMany({ where: { businessId: BUSINESS_ID } });

  console.log(`  Deleted ${outlets.length} existing outlets.`);
}

// ─── FNB Outlet ───────────────────────────────────────────────────────────────

async function createFNBOutlet() {
  console.log("🍜 Creating Warung Makan Padang (FNB)...");

  const outlet = await db.outlet.create({
    data: {
      id: genId("OUT"),
      name: "Warung Makan Padang",
      slug: "warung-makan-padang",
      description: "Warung makan dengan cita rasa Padang autentik, masakan rumahan berkualitas",
      address: "Jl. Jendral Sudirman No. 128, Pekanbaru, Riau",
      phone: "0761-5551234",
      email: "warungmakanpadang@bossapp.id",
      businessId: BUSINESS_ID,
      type: OutletType.FNB,
      isOpen: true,
      latitude: 0.5071,
      longitude: 101.4478,
      manualBankName: "Bank BCA",
      manualBankAccount: "1234567890",
      manualAccountHolder: "Warung Makan Padang",
      manualPaymentNote: "Transfer BCA a/n Warung Makan Padang",
    },
  });

  // Operating Hours
  for (let day = 0; day <= 6; day++) {
    const isOpen = day !== 6; // Tutup Minggu
    const base = new Date("2000-01-01T00:00:00Z");
    await db.outletOperatingHours.create({
      data: {
        outletId: outlet.id,
        dayOfWeek: day,
        openTime: setHours(base, 9),
        closeTime: setHours(base, 21),
        isOpen,
      },
    });
  }

  // Receipt Settings
  await db.receiptSetting.create({
    data: {
      outletId: outlet.id,
      printWidth: 80,
      headerText:
        "WARUNG MAKAN PADANG\nJl. Jendral Sudirman No. 128\nPekanbaru, Riau\nTelp: 0761-5551234",
      footerText: "Terima kasih sudah makan di tempat kami!\nDatang lagi ya!",
      showCashier: true,
      showCustomer: true,
    },
  });

  // Loyalty Config
  await db.loyaltyConfig.create({
    data: {
      outletId: outlet.id,
      pointsEarned: 1,
      multiplierAmount: 10_000,
      minSpending: 15_000,
      pointValue: 100,
      isActive: true,
      autoEnroll: true,
      welcomeBonus: 50,
      maxRedeemPercent: 50,
      minRedeemPoints: 10,
    },
  });

  // Categories
  const catMakanan = await db.productCategory.create({
    data: { name: "Makanan", outletId: outlet.id },
  });
  const catMinuman = await db.productCategory.create({
    data: { name: "Minuman", outletId: outlet.id },
  });
  const catPaket = await db.productCategory.create({
    data: { name: "Paket Nasi", outletId: outlet.id },
  });

  // Ingredients
  const ingredientsData = [
    { name: "Nasi", purchaseUnit: "Kg", recipeUnit: "gram", conversionFactor: 1000, stock: 100, cost: 12_000 },
    { name: "Daging Ayam", purchaseUnit: "Kg", recipeUnit: "gram", conversionFactor: 1000, stock: 50, cost: 38_000 },
    { name: "Daging Sapi", purchaseUnit: "Kg", recipeUnit: "gram", conversionFactor: 1000, stock: 30, cost: 120_000 },
    { name: "Minyak Goreng", purchaseUnit: "Liter", recipeUnit: "ml", conversionFactor: 1000, stock: 20, cost: 18_000 },
    { name: "Bawang Merah", purchaseUnit: "Kg", recipeUnit: "gram", conversionFactor: 1000, stock: 5, cost: 35_000 },
    { name: "Bawang Putih", purchaseUnit: "Kg", recipeUnit: "gram", conversionFactor: 1000, stock: 3, cost: 40_000 },
    { name: "Cabai Merah", purchaseUnit: "Kg", recipeUnit: "gram", conversionFactor: 1000, stock: 5, cost: 45_000 },
    { name: "Telur", purchaseUnit: "Rak", recipeUnit: "butir", conversionFactor: 30, stock: 10, cost: 55_000 },
    { name: "Kecap Manis", purchaseUnit: "Liter", recipeUnit: "ml", conversionFactor: 1000, stock: 5, cost: 25_000 },
    { name: "Santan", purchaseUnit: "Liter", recipeUnit: "ml", conversionFactor: 1000, stock: 10, cost: 20_000 },
    { name: "Jeruk Nipis", purchaseUnit: "Kg", recipeUnit: "pcs", conversionFactor: 10, stock: 3, cost: 15_000 },
    { name: "Teh Celup", purchaseUnit: "Box", recipeUnit: "sachet", conversionFactor: 50, stock: 5, cost: 30_000 },
  ];

  const ingredients = await Promise.all(
    ingredientsData.map((ing) =>
      db.ingredient.create({
        data: {
          name: ing.name,
          purchaseUnit: ing.purchaseUnit,
          recipeUnit: ing.recipeUnit,
          conversionFactor: ing.conversionFactor,
          currentStock: ing.stock,
          averageCost: ing.cost,
          minStock: ing.stock * 0.2,
          outletId: outlet.id,
        },
      }),
    ),
  );

  // Products
  const fnbProductsData = [
    { name: "Nasi Padang Komplit", hpp: 18_000, price: 38_000, unit: "porsi", tax: 11, category: "paket", stock: 0 },
    { name: "Nasi Rendang", hpp: 25_000, price: 45_000, unit: "porsi", tax: 11, category: "paket", stock: 0 },
    { name: "Nasi Ayam Pop", hpp: 16_000, price: 32_000, unit: "porsi", tax: 11, category: "paket", stock: 0 },
    { name: "Ayam Goreng Kremes", hpp: 14_000, price: 30_000, unit: "porsi", tax: 11, category: "makanan", stock: 0 },
    { name: "Rendang Sapi", hpp: 30_000, price: 55_000, unit: "porsi", tax: 11, category: "makanan", stock: 0 },
    { name: "Ikan Bakar Bumbu Rujak", hpp: 22_000, price: 45_000, unit: "porsi", tax: 11, category: "makanan", stock: 0 },
    { name: "Soto Ayam Lamongan", hpp: 10_000, price: 22_000, unit: "mangkuk", tax: 11, category: "makanan", stock: 0 },
    { name: "Gulai Nangka", hpp: 8_000, price: 18_000, unit: "porsi", tax: 0, category: "makanan", stock: 0 },
    { name: "Sayur Lodeh", hpp: 5_000, price: 12_000, unit: "porsi", tax: 0, category: "makanan", stock: 0 },
    { name: "Tempe Goreng", hpp: 3_000, price: 8_000, unit: "pcs", tax: 0, category: "makanan", stock: 0 },
    { name: "Tahu Goreng", hpp: 2_500, price: 7_000, unit: "pcs", tax: 0, category: "makanan", stock: 0 },
    { name: "Es Teh Manis", hpp: 2_000, price: 8_000, unit: "gelas", tax: 0, category: "minuman", stock: 0 },
    { name: "Jus Alpukat", hpp: 8_000, price: 18_000, unit: "gelas", tax: 0, category: "minuman", stock: 0 },
    { name: "Es Jeruk Peras", hpp: 5_000, price: 12_000, unit: "gelas", tax: 0, category: "minuman", stock: 0 },
    { name: "Kopi Tubruk", hpp: 3_000, price: 10_000, unit: "gelas", tax: 0, category: "minuman", stock: 0 },
    { name: "Air Mineral", hpp: 1_500, price: 5_000, unit: "botol", tax: 0, category: "minuman", stock: 0 },
    { name: "Kerupuk", hpp: 1_000, price: 3_000, unit: "pcs", tax: 0, category: "makanan", stock: 0 },
  ];

  const categoryMap: Record<string, string> = {
    makanan: catMakanan.id,
    minuman: catMinuman.id,
    paket: catPaket.id,
  };

  const fnbProducts = await Promise.all(
    fnbProductsData.map(async (p) => {
      const product = await db.product.create({
        data: {
          name: p.name,
          type: ProductType.GOODS,
          status: ServiceStatus.ACTIVE,
          outletId: outlet.id,
          taxPercentage: p.tax,
          categoryId: categoryMap[p.category],
        },
      });

      const goods = await db.productGoods.create({
        data: {
          productId: product.id,
          sellingPrice: p.price,
          averageHpp: p.hpp,
          currentStock: p.stock,
          unit: p.unit,
        },
      });

      return { product, goods, hpp: p.hpp, price: p.price, tax: p.tax };
    }),
  );

  // Recipes (for food products that use ingredients)
  const recipeData = [
    { productIdx: 0, ingredients: [{ idx: 0, qty: 250 }, { idx: 1, qty: 150 }, { idx: 4, qty: 20 }, { idx: 5, qty: 15 }, { idx: 6, qty: 10 }, { idx: 3, qty: 15 }] }, // Nasi Padang Komplit
    { productIdx: 1, ingredients: [{ idx: 0, qty: 250 }, { idx: 2, qty: 200 }, { idx: 9, qty: 50 }, { idx: 4, qty: 30 }, { idx: 5, qty: 20 }] }, // Nasi Rendang
    { productIdx: 2, ingredients: [{ idx: 0, qty: 250 }, { idx: 1, qty: 150 }, { idx: 4, qty: 15 }, { idx: 5, qty: 10 }] }, // Nasi Ayam Pop
    { productIdx: 3, ingredients: [{ idx: 1, qty: 200 }, { idx: 3, qty: 30 }, { idx: 4, qty: 15 }, { idx: 5, qty: 10 }] }, // Ayam Goreng
    { productIdx: 4, ingredients: [{ idx: 2, qty: 250 }, { idx: 9, qty: 80 }, { idx: 4, qty: 25 }, { idx: 5, qty: 20 }, { idx: 6, qty: 15 }] }, // Rendang
    { productIdx: 6, ingredients: [{ idx: 1, qty: 100 }, { idx: 0, qty: 50 }, { idx: 4, qty: 10 }, { idx: 5, qty: 8 }, { idx: 10, qty: 1 }] }, // Soto
  ];

  for (const rd of recipeData) {
    const recipe = await db.recipe.create({
      data: {
        productId: fnbProducts[rd.productIdx].product.id,
        notes: `Resep ${fnbProducts[rd.productIdx].product.name}`,
      },
    });

    for (const ing of rd.ingredients) {
      await db.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          ingredientId: ingredients[ing.idx].id,
          quantity: ing.qty,
        },
      });
    }
  }

  // Tables
  const tables = await Promise.all(
    Array.from({ length: 6 }, (_, i) =>
      db.outletTable.create({
        data: {
          name: `Meja ${i + 1}`,
          capacity: i < 2 ? 2 : i < 5 ? 4 : 6,
          status: TableStatus.AVAILABLE,
          outletId: outlet.id,
        },
      }),
    ),
  );

  // Staff
  const staffFnb = await Promise.all([
    db.staff.create({
      data: {
        name: "Siti Rahayu",
        username: "siti.padang",
        pin: await hash("123456", 10),
        phone: "08123450001",
        role: StaffRole.CASHIER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Andi Pratama",
        username: "andi.padang",
        pin: await hash("123456", 10),
        phone: "08123450002",
        role: StaffRole.WAITER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Rina Wulandari",
        username: "rina.padang",
        pin: await hash("123456", 10),
        phone: "08123450003",
        role: StaffRole.WAITER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Budi Santoso",
        username: "budi.padang",
        pin: await hash("123456", 10),
        phone: "08123450004",
        role: StaffRole.KITCHEN,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Dedi Kurniawan",
        username: "dedi.padang",
        pin: await hash("123456", 10),
        phone: "08123450005",
        role: StaffRole.KITCHEN,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Maya Sari",
        username: "maya.padang",
        pin: await hash("123456", 10),
        phone: "08123450006",
        role: StaffRole.MANAGER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
  ]);

  // Expenses
  const fnbExpenses = [
    { description: "Sewa tempat", amount: 4_500_000 },
    { description: "Gaji karyawan", amount: 6_000_000 },
    { description: "Listrik & air", amount: 750_000 },
    { description: "Gas LPG 12kg x4", amount: 880_000 },
    { description: "Perlengkapan kebersihan", amount: 200_000 },
    { description: "Biaya pemasaran online", amount: 300_000 },
    { description: "Servis peralatan dapur", amount: 200_000 },
  ];

  for (const expense of fnbExpenses) {
    await db.expense.create({
      data: {
        ...expense,
        cashier: "Maya Sari",
        date: randomDate(rand(1, 60)),
        outletId: outlet.id,
      },
    });
  }

  // ── Suppliers ─────────────────────────────────────────────────────────────
  const supplierA = await db.supplier.create({
    data: {
      name: "PT Pangan Segar Indonesia",
      phone: "081234567100",
      email: "pangansegar@gmail.com",
      address: "Jl. Raya Pekanbaru No. 10",
      notes: "Supplier bahan baku utama",
      outletId: outlet.id,
    },
  });

  const supplierB = await db.supplier.create({
    data: {
      name: "UD Bumbu Dapur Jaya",
      phone: "081234567101",
      email: "bumbudapur@gmail.com",
      address: "Jl. Hang Tuah No. 30",
      notes: "Supplier bumbu dan rempah",
      outletId: outlet.id,
    },
  });

  // ── Stock Purchases ───────────────────────────────────────────────────────
  const stockPurchases = [
    { name: "Nasi", qty: 50000, cost: 12, supplierId: supplierA.id },
    { name: "Daging Ayam", qty: 20000, cost: 38, supplierId: supplierA.id },
    { name: "Daging Sapi", qty: 15000, cost: 120, supplierId: supplierA.id },
    { name: "Minyak Goreng", qty: 20000, cost: 18, supplierId: supplierA.id },
    { name: "Bawang Merah", qty: 5000, cost: 35, supplierId: supplierB.id },
    { name: "Bawang Putih", qty: 3000, cost: 40, supplierId: supplierB.id },
    { name: "Cabai Merah", qty: 5000, cost: 45, supplierId: supplierB.id },
    { name: "Telur", qty: 150, cost: 55, supplierId: supplierA.id },
    { name: "Kecap Manis", qty: 5000, cost: 25, supplierId: supplierB.id },
    { name: "Santan", qty: 10000, cost: 20, supplierId: supplierA.id },
    { name: "Teh Celup", qty: 500, cost: 30, supplierId: supplierB.id },
    { name: "Jeruk Nipis", qty: 50, cost: 15, supplierId: supplierA.id },
  ];

  for (const sp of stockPurchases) {
    const ingredient = ingredients.find((i) => i.name === sp.name);
    if (!ingredient) continue;

    const totalCost = sp.qty * sp.cost;
    const poDate = randomDate(30);
    const poNumber = `PO-${poDate.getFullYear()}${String(poDate.getMonth() + 1).padStart(2, "0")}${String(poDate.getDate()).padStart(2, "0")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const po = await db.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: sp.supplierId,
        outletId: outlet.id,
        status: PurchaseOrderStatus.COMPLETED,
        notes: `Pembelian stok ${sp.name}`,
        totalEstimate: totalCost,
        createdAt: poDate,
        updatedAt: poDate,
      },
    });

    await db.purchaseOrderItem.create({
      data: {
        purchaseOrderId: po.id,
        ingredientId: ingredient.id,
        quantity: sp.qty,
        priceAtOrder: sp.cost,
      },
    });

    await db.ingredientStockBatch.create({
      data: {
        ingredientId: ingredient.id,
        purchaseQuantity: sp.qty,
        remainingQuantity: sp.qty,
        costPerRecipeUnit: sp.cost,
        createdAt: poDate,
      },
    });

    await db.ingredientStockLog.create({
      data: {
        ingredientId: ingredient.id,
        type: "IN",
        quantity: sp.qty,
        costPerUnit: sp.cost,
        referenceId: po.id,
        notes: `PO ${poNumber}`,
        createdAt: poDate,
      },
    });

    await db.ingredient.update({
      where: { id: ingredient.id },
      data: { currentStock: { increment: sp.qty }, averageCost: sp.cost },
    });
  }

  console.log("  ✅ FNB outlet created with products, ingredients, recipes, staff, tables, stock purchases");

  return { outlet, fnbProducts, staffFnb, tables, ingredients };
}

// ─── Retail Outlet ────────────────────────────────────────────────────────────

async function createRetailOutlet() {
  console.log("🛒 Creating Toko Sembako Maju (RETAIL)...");

  const outlet = await db.outlet.create({
    data: {
      id: genId("OUT"),
      name: "Toko Sembako Maju",
      slug: "toko-sembako-maju",
      description: "Toko kebutuhan sehari-hari lengkap dengan harga terjangkau",
      address: "Jl. Diponegoro No. 45, Pekanbaru, Riau",
      phone: "0761-5555678",
      email: "tokosembakomaju@bossapp.id",
      businessId: BUSINESS_ID,
      type: OutletType.RETAIL,
      isOpen: true,
      latitude: 0.5135,
      longitude: 101.4420,
      manualBankName: "Bank BRI",
      manualBankAccount: "0987654321",
      manualAccountHolder: "Toko Sembako Maju",
      manualPaymentNote: "Transfer BRI a/n Toko Sembako Maju",
    },
  });

  // Operating Hours
  for (let day = 0; day <= 6; day++) {
    const isOpen = day !== 6;
    const base = new Date("2000-01-01T00:00:00Z");
    await db.outletOperatingHours.create({
      data: {
        outletId: outlet.id,
        dayOfWeek: day,
        openTime: setHours(base, 8),
        closeTime: setHours(base, 20),
        isOpen,
      },
    });
  }

  // Receipt Settings
  await db.receiptSetting.create({
    data: {
      outletId: outlet.id,
      printWidth: 58,
      headerText: "TOKO SEMBAKO MAJU\nJl. Diponegoro No. 45\nPekanbaru",
      footerText: "Terima kasih, datang lagi ya!",
      showCashier: true,
      showCustomer: false,
    },
  });

  // Loyalty Config
  await db.loyaltyConfig.create({
    data: {
      outletId: outlet.id,
      pointsEarned: 1,
      multiplierAmount: 5_000,
      minSpending: 10_000,
      pointValue: 50,
      isActive: true,
      autoEnroll: true,
      welcomeBonus: 25,
      maxRedeemPercent: 30,
      minRedeemPoints: 20,
    },
  });

  // Categories
  const catSembako = await db.productCategory.create({
    data: { name: "Sembako", outletId: outlet.id },
  });
  const catMinuman = await db.productCategory.create({
    data: { name: "Minuman", outletId: outlet.id },
  });
  const catKebersihan = await db.productCategory.create({
    data: { name: "Kebersihan", outletId: outlet.id },
  });
  const catSnack = await db.productCategory.create({
    data: { name: "Snack", outletId: outlet.id },
  });

  // Suppliers
  const suppliers = await Promise.all([
    db.supplier.create({
      data: {
        name: "PT Sumber Pangan Sejahtera",
        phone: "081234567001",
        email: "sumberpangan@gmail.com",
        address: "Jl. Riau No. 100, Pekanbaru",
        notes: "Supplier utama sembako",
        outletId: outlet.id,
      },
    }),
    db.supplier.create({
      data: {
        name: "CV Minuman Nusantara",
        phone: "081234567002",
        email: "minumannusantara@gmail.com",
        address: "Jl. Hang Tuah No. 55, Pekanbaru",
        notes: "Supplier minuman",
        outletId: outlet.id,
      },
    }),
    db.supplier.create({
      data: {
        name: "Toko Grosir Kebersihan",
        phone: "081234567003",
        email: "grosirkebersihan@gmail.com",
        address: "Jl. Ahmad Yani No. 22, Pekanbaru",
        notes: "Supplier produk kebersihan",
        outletId: outlet.id,
      },
    }),
  ]);

  // Products
  const retailProductsData = [
    { name: "Beras Premium 5kg", hpp: 62_000, price: 75_000, unit: "karung", stock: 50, tax: 0, category: "sembako", supplierIdx: 0 },
    { name: "Minyak Goreng Bimoli 2L", hpp: 28_000, price: 35_000, unit: "botol", stock: 40, tax: 11, category: "sembako", supplierIdx: 0 },
    { name: "Gula Pasir 1kg", hpp: 13_000, price: 16_000, unit: "kg", stock: 80, tax: 0, category: "sembako", supplierIdx: 0 },
    { name: "Tepung Terigu Segitiga 1kg", hpp: 10_000, price: 13_500, unit: "kg", stock: 60, tax: 0, category: "sembako", supplierIdx: 0 },
    { name: "Telur Ayam 1kg", hpp: 25_000, price: 30_000, unit: "kg", stock: 30, tax: 0, category: "sembako", supplierIdx: 0 },
    { name: "Ayam Frozen 1kg", hpp: 32_000, price: 40_000, unit: "kg", stock: 25, tax: 11, category: "sembako", supplierIdx: 0 },
    { name: "Kopi Kapal Api Box", hpp: 22_000, price: 28_000, unit: "box", stock: 30, tax: 11, category: "minuman", supplierIdx: 1 },
    { name: "Teh Pucuk 350ml (12pcs)", hpp: 28_000, price: 36_000, unit: "pack", stock: 20, tax: 11, category: "minuman", supplierIdx: 1 },
    { name: "Aqua 600ml (12pcs)", hpp: 38_000, price: 48_000, unit: "pack", stock: 15, tax: 11, category: "minuman", supplierIdx: 1 },
    { name: "Indomie Goreng Box (40pcs)", hpp: 42_000, price: 55_000, unit: "box", stock: 20, tax: 11, category: "sembako", supplierIdx: 0 },
    { name: "Sabun Mandi Lifebuoy 4pcs", hpp: 16_000, price: 21_000, unit: "pack", stock: 45, tax: 11, category: "kebersihan", supplierIdx: 2 },
    { name: "Sampo Sunsilk 170ml", hpp: 18_000, price: 24_000, unit: "botol", stock: 35, tax: 11, category: "kebersihan", supplierIdx: 2 },
    { name: "Rinso Anti Noda 800g", hpp: 15_000, price: 20_000, unit: "pack", stock: 40, tax: 11, category: "kebersihan", supplierIdx: 2 },
    { name: "Pembersih Lantai Wipol 800ml", hpp: 12_000, price: 16_000, unit: "botol", stock: 30, tax: 11, category: "kebersihan", supplierIdx: 2 },
    { name: "Tisu Paseo 250 sheets", hpp: 8_000, price: 12_000, unit: "pack", stock: 50, tax: 11, category: "kebersihan", supplierIdx: 2 },
    { name: "Chitato 68g", hpp: 8_500, price: 12_000, unit: "pcs", stock: 70, tax: 11, category: "snack", supplierIdx: 0 },
    { name: "Lays 68g", hpp: 8_500, price: 12_000, unit: "pcs", stock: 65, tax: 11, category: "snack", supplierIdx: 0 },
    { name: "Oreo 137g", hpp: 6_000, price: 9_000, unit: "pcs", stock: 55, tax: 11, category: "snack", supplierIdx: 0 },
    { name: "Aqua Galon 19L", hpp: 18_000, price: 22_000, unit: "galon", stock: 15, tax: 0, category: "minuman", supplierIdx: 1 },
  ];

  const catMap: Record<string, string> = {
    sembako: catSembako.id,
    minuman: catMinuman.id,
    kebersihan: catKebersihan.id,
    snack: catSnack.id,
  };

  const retailProducts = await Promise.all(
    retailProductsData.map(async (p) => {
      const product = await db.product.create({
        data: {
          name: p.name,
          type: ProductType.GOODS,
          status: ServiceStatus.ACTIVE,
          outletId: outlet.id,
          taxPercentage: p.tax,
          categoryId: catMap[p.category],
        },
      });

      const goods = await db.productGoods.create({
        data: {
          productId: product.id,
          sellingPrice: p.price,
          averageHpp: p.hpp,
          currentStock: p.stock,
          minStock: 5,
          unit: p.unit,
          sku: `RTL-${product.id.slice(0, 8).toUpperCase()}`,
        },
      });

      // SupplierProduct link
      await db.supplierProduct.create({
        data: {
          supplierId: suppliers[p.supplierIdx].id,
          productGoodsId: goods.id,
          lastPrice: p.hpp,
          lastOrderDate: randomDate(30),
        },
      });

      // Stock IN log
      await db.stockLog.create({
        data: {
          productGoodsId: goods.id,
          type: StockMovementType.IN,
          quantity: p.stock,
          hppPerUnit: p.hpp,
          notes: "Stok awal",
          referenceType: "SEED",
        },
      });

      return { product, goods, hpp: p.hpp, price: p.price, tax: p.tax };
    }),
  );

  // Staff
  const staffRetail = await Promise.all([
    db.staff.create({
      data: {
        name: "Dewi Lestari",
        username: "dewi.sembako",
        pin: await hash("123456", 10),
        phone: "08123450010",
        role: StaffRole.CASHIER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Roni Susanto",
        username: "roni.sembako",
        pin: await hash("123456", 10),
        phone: "08123450011",
        role: StaffRole.CASHIER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Fitri Handayani",
        username: "fitri.sembako",
        pin: await hash("123456", 10),
        phone: "08123450012",
        role: StaffRole.MANAGER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Ahmad Fauzi",
        username: "ahmad.sembako",
        pin: await hash("123456", 10),
        phone: "08123450013",
        role: StaffRole.OTHER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Lina Octavia",
        username: "lina.sembako",
        pin: await hash("123456", 10),
        phone: "08123450014",
        role: StaffRole.OTHER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
  ]);

  // Expenses
  const retailExpenses = [
    { description: "Sewa tempat", amount: 3_000_000 },
    { description: "Gaji karyawan", amount: 5_000_000 },
    { description: "Listrik", amount: 450_000 },
    { description: "Plastik & kantong", amount: 250_000 },
    { description: "Ongkir pembelian barang", amount: 400_000 },
    { description: "Biaya aplikasi POS", amount: 99_000 },
  ];

  for (const expense of retailExpenses) {
    await db.expense.create({
      data: {
        ...expense,
        cashier: "Fitri Handayani",
        date: randomDate(rand(1, 60)),
        outletId: outlet.id,
      },
    });
  }

  console.log("  ✅ Retail outlet created with products, suppliers, staff");

  return { outlet, retailProducts, staffRetail };
}

// ─── Service Outlet ───────────────────────────────────────────────────────────

async function createServiceOutlet() {
  console.log("💇 Creating Salon Kecantikan (SERVICE)...");

  const outlet = await db.outlet.create({
    data: {
      id: genId("OUT"),
      name: "Salon Kecantikan",
      slug: "salon-kecantikan",
      description: "Salon kecantikan profesional dengan layanan terbaik",
      address: "Jl. Pandeglang No. 19, Pekanbaru, Riau",
      phone: "0761-5559012",
      email: "salonkecantikan@bossapp.id",
      businessId: BUSINESS_ID,
      type: OutletType.SERVICE,
      isOpen: true,
      latitude: 0.5020,
      longitude: 101.4530,
      manualBankName: "Bank Mandiri",
      manualBankAccount: "1122334455",
      manualAccountHolder: "Salon Kecantikan",
      manualPaymentNote: "Transfer Mandiri a/n Salon Kecantikan",
    },
  });

  // Operating Hours
  for (let day = 0; day <= 6; day++) {
    const isOpen = day !== 6;
    const base = new Date("2000-01-01T00:00:00Z");
    await db.outletOperatingHours.create({
      data: {
        outletId: outlet.id,
        dayOfWeek: day,
        openTime: setHours(base, 10),
        closeTime: setHours(base, 20),
        isOpen,
      },
    });
  }

  // Receipt Settings
  await db.receiptSetting.create({
    data: {
      outletId: outlet.id,
      printWidth: 80,
      headerText: "SALON KECANTIKAN\nJl. Pandeglang No. 19\nPekanbaru, Riau\nTelp: 0761-5559012",
      footerText: "Terima kasih, semoga puas dengan layanan kami!",
      showCashier: true,
      showCustomer: true,
    },
  });

  // Loyalty Config
  await db.loyaltyConfig.create({
    data: {
      outletId: outlet.id,
      pointsEarned: 1,
      multiplierAmount: 20_000,
      minSpending: 50_000,
      pointValue: 200,
      isActive: true,
      autoEnroll: true,
      welcomeBonus: 100,
      maxRedeemPercent: 40,
      minRedeemPoints: 5,
    },
  });

  // Categories
  const catHair = await db.productCategory.create({
    data: { name: "Hair", outletId: outlet.id },
  });
  const catFace = await db.productCategory.create({
    data: { name: "Face", outletId: outlet.id },
  });
  const catBody = await db.productCategory.create({
    data: { name: "Body", outletId: outlet.id },
  });
  const catNails = await db.productCategory.create({
    data: { name: "Nails", outletId: outlet.id },
  });

  // Products (Service type)
  const serviceProductsData = [
    { name: "Potong Rambut Pria", price: 45_000, duration: 30, commission: 10, category: "hair", provider: "Rina Stylist" },
    { name: "Potong Rambut Wanita", price: 65_000, duration: 45, commission: 10, category: "hair", provider: "Rina Stylist" },
    { name: "Hair Coloring", price: 250_000, duration: 120, commission: 15, category: "hair", provider: "Rina Stylist" },
    { name: "Hair Styling", price: 80_000, duration: 60, commission: 10, category: "hair", provider: "Rina Stylist" },
    { name: "Facial Treatment", price: 120_000, duration: 60, commission: 12, category: "face", provider: "Diana Facial" },
    { name: "Facial Whitening", price: 180_000, duration: 75, commission: 15, category: "face", provider: "Diana Facial" },
    { name: "Body Massage", price: 150_000, duration: 60, commission: 12, category: "body", provider: "Sari Massage" },
    { name: "Body Scrub", price: 130_000, duration: 45, commission: 10, category: "body", provider: "Sari Massage" },
    { name: "Manicure", price: 50_000, duration: 30, commission: 10, category: "nails", provider: "Lina Nails" },
    { name: "Pedicure", price: 60_000, duration: 35, commission: 10, category: "nails", provider: "Lina Nails" },
    { name: "Manicure + Pedicure", price: 95_000, duration: 60, commission: 12, category: "nails", provider: "Lina Nails" },
    { name: "Gel Nails", price: 120_000, duration: 45, commission: 15, category: "nails", provider: "Lina Nails" },
  ];

  const catServiceMap: Record<string, string> = {
    hair: catHair.id,
    face: catFace.id,
    body: catBody.id,
    nails: catNails.id,
  };

  const serviceProducts = await Promise.all(
    serviceProductsData.map(async (p) => {
      const product = await db.product.create({
        data: {
          name: p.name,
          type: ProductType.SERVICE,
          status: ServiceStatus.ACTIVE,
          outletId: outlet.id,
          categoryId: catServiceMap[p.category],
        },
      });

      const base = new Date("2000-01-01T00:00:00Z");

      const svc = await db.productService.create({
        data: {
          productId: product.id,
          durationMinutes: p.duration,
          sellingPrice: p.price,
          providerName: p.provider,
          providerPhone: "08123450020",
          commissionType: "PERCENTAGE",
          commissionValue: p.commission,
          maxParallel: 1,
          bookingInWorkHours: true,
          mondayOpen: setHours(base, 10),
          mondayClose: setHours(base, 20),
          tuesdayOpen: setHours(base, 10),
          tuesdayClose: setHours(base, 20),
          wednesdayOpen: setHours(base, 10),
          wednesdayClose: setHours(base, 20),
          thursdayOpen: setHours(base, 10),
          thursdayClose: setHours(base, 20),
          fridayOpen: setHours(base, 10),
          fridayClose: setHours(base, 20),
          saturdayOpen: setHours(base, 10),
          saturdayClose: setHours(base, 20),
        },
      });

      return { product, service: svc, price: p.price };
    }),
  );

  // Staff
  const staffService = await Promise.all([
    db.staff.create({
      data: {
        name: "Rina Marlina",
        username: "rina.salon",
        pin: await hash("123456", 10),
        phone: "08123450020",
        role: StaffRole.MANAGER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Diana Putri",
        username: "diana.salon",
        pin: await hash("123456", 10),
        phone: "08123450021",
        role: StaffRole.OTHER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Sari Dewi",
        username: "sari.salon",
        pin: await hash("123456", 10),
        phone: "08123450022",
        role: StaffRole.OTHER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Lina Amelia",
        username: "lina.salon",
        pin: await hash("123456", 10),
        phone: "08123450023",
        role: StaffRole.OTHER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Nurul Huda",
        username: "nurul.salon",
        pin: await hash("123456", 10),
        phone: "08123450024",
        role: StaffRole.CASHIER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
  ]);

  // Expenses
  const serviceExpenses = [
    { description: "Sewa tempat", amount: 3_500_000 },
    { description: "Gaji karyawan + komisi", amount: 7_000_000 },
    { description: "Listrik & AC", amount: 600_000 },
    { description: "Peralatan salon", amount: 500_000 },
    { description: "Produk kecantikan", amount: 800_000 },
    { description: "Biaya pemasaran", amount: 250_000 },
  ];

  for (const expense of serviceExpenses) {
    await db.expense.create({
      data: {
        ...expense,
        cashier: "Nurul Huda",
        date: randomDate(rand(1, 60)),
        outletId: outlet.id,
      },
    });
  }

  console.log("  ✅ Service outlet created with services, staff");

  return { outlet, serviceProducts, staffService };
}

// ─── Event Outlet ─────────────────────────────────────────────────────────────

async function createEventOutlet() {
  console.log("🎵 Creating Event Konser Musik (EVENT)...");

  const outlet = await db.outlet.create({
    data: {
      id: genId("OUT"),
      name: "Event Konser Musik",
      slug: "event-konser-musik",
      description: "Penjualan tiket konser dan event musik di Pekanbaru",
      address: "Jl. Sudirman Center No. 88, Pekanbaru, Riau",
      phone: "0761-5553456",
      email: "eventkonser@bossapp.id",
      businessId: BUSINESS_ID,
      type: OutletType.EVENT,
      isOpen: true,
      latitude: 0.5100,
      longitude: 101.4450,
      manualBankName: "Bank BNI",
      manualBankAccount: "5566778899",
      manualAccountHolder: "Event Konser Musik",
      manualPaymentNote: "Transfer BNI a/n Event Konser Musik",
    },
  });

  // Operating Hours
  for (let day = 0; day <= 6; day++) {
    const base = new Date("2000-01-01T00:00:00Z");
    await db.outletOperatingHours.create({
      data: {
        outletId: outlet.id,
        dayOfWeek: day,
        openTime: setHours(base, 9),
        closeTime: setHours(base, 21),
        isOpen: true,
      },
    });
  }

  // Receipt Settings
  await db.receiptSetting.create({
    data: {
      outletId: outlet.id,
      printWidth: 80,
      headerText: "EVENT KONSER MUSIK\nJl. Sudirman Center No. 88\nPekanbaru, Riau",
      footerText: "Selamat menikmati acara! See you at the show!",
      showCashier: true,
      showCustomer: true,
    },
  });

  // Loyalty Config
  await db.loyaltyConfig.create({
    data: {
      outletId: outlet.id,
      pointsEarned: 1,
      multiplierAmount: 15_000,
      minSpending: 50_000,
      pointValue: 150,
      isActive: true,
      autoEnroll: true,
      welcomeBonus: 75,
      maxRedeemPercent: 25,
      minRedeemPoints: 10,
    },
  });

  // Categories
  const catKonser = await db.productCategory.create({
    data: { name: "Konser", outletId: outlet.id },
  });
  const catWorkshop = await db.productCategory.create({
    data: { name: "Workshop", outletId: outlet.id },
  });
  const catKomunitas = await db.productCategory.create({
    data: { name: "Komunitas", outletId: outlet.id },
  });

  // Products (Ticket type)
  const now = new Date();
  const eventProductsData = [
    { name: "Konser Rock Night - VIP", price: 350_000, quota: 50, sold: 35, maxPerOrder: 4, venue: "Lap. GOR Pekanbaru", eventDate: addDays(now, 30), category: "konser" },
    { name: "Konser Rock Night - Regular", price: 150_000, quota: 200, sold: 120, maxPerOrder: 6, venue: "Lap. GOR Pekanbaru", eventDate: addDays(now, 30), category: "konser" },
    { name: "Konser Rock Night - Festival", price: 75_000, quota: 500, sold: 280, maxPerOrder: 8, venue: "Lap. GOR Pekanbaru", eventDate: addDays(now, 30), category: "konser" },
    { name: "Workshop Musik - Gitar", price: 100_000, quota: 20, sold: 12, maxPerOrder: 2, venue: "Studio Musik Harmoni", eventDate: addDays(now, 14), category: "workshop" },
    { name: "Workshop Musik - Vokal", price: 120_000, quota: 15, sold: 8, maxPerOrder: 2, venue: "Studio Musik Harmoni", eventDate: addDays(now, 21), category: "workshop" },
    { name: "Jam Session Komunitas", price: 25_000, quota: 30, sold: 18, maxPerOrder: 4, venue: "Cafe Amplifier", eventDate: addDays(now, 7), category: "komunitas" },
  ];

  const catEventMap: Record<string, string> = {
    konser: catKonser.id,
    workshop: catWorkshop.id,
    komunitas: catKomunitas.id,
  };

  const eventProducts = await Promise.all(
    eventProductsData.map(async (p) => {
      const product = await db.product.create({
        data: {
          name: p.name,
          type: ProductType.TICKET,
          status: ServiceStatus.ACTIVE,
          outletId: outlet.id,
          categoryId: catEventMap[p.category],
        },
      });

      const ticket = await db.productTicket.create({
        data: {
          productId: product.id,
          sellingPrice: p.price,
          eventDate: p.eventDate,
          venue: p.venue,
          totalQuota: p.quota,
          soldCount: p.sold,
          maxPerOrder: p.maxPerOrder,
          saleStartDate: subDays(now, 14),
          saleEndDate: subDays(p.eventDate, 1),
          terms: "Tiket tidak dapat dikembalikan. Wajib datang 30 menit sebelum acara.",
        },
      });

      return { product, ticket, price: p.price };
    }),
  );

  // Staff
  const staffEvent = await Promise.all([
    db.staff.create({
      data: {
        name: "Bayu Nugroho",
        username: "bayu.event",
        pin: await hash("123456", 10),
        phone: "08123450030",
        role: StaffRole.MANAGER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Putri Rahayu",
        username: "putri.event",
        pin: await hash("123456", 10),
        phone: "08123450031",
        role: StaffRole.CASHIER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Wahyu Saputra",
        username: "wahyu.event",
        pin: await hash("123456", 10),
        phone: "08123450032",
        role: StaffRole.CASHIER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Citra Lestari",
        username: "citra.event",
        pin: await hash("123456", 10),
        phone: "08123450033",
        role: StaffRole.OTHER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Fajar Setiawan",
        username: "fajar.event",
        pin: await hash("123456", 10),
        phone: "08123450034",
        role: StaffRole.OTHER,
        outletId: outlet.id,
        status: StaffStatus.ACTIVE,
      },
    }),
  ]);

  // Expenses
  const eventExpenses = [
    { description: "Sewa venue GOR", amount: 5_000_000 },
    { description: "Sound system & lighting", amount: 3_500_000 },
    { description: "Sewa studio workshop", amount: 1_000_000 },
    { description: "Biaya promosi & iklan", amount: 2_000_000 },
    { description: "Cetak tiket & wristband", amount: 500_000 },
    { description: "Biaya admin", amount: 150_000 },
  ];

  for (const expense of eventExpenses) {
    await db.expense.create({
      data: {
        ...expense,
        cashier: "Bayu Nugroho",
        date: randomDate(rand(1, 30)),
        outletId: outlet.id,
      },
    });
  }

  console.log("  ✅ Event outlet created with tickets, staff");

  return { outlet, eventProducts, staffEvent };
}

// ─── Customers ────────────────────────────────────────────────────────────────

async function createCustomers() {
  console.log("👥 Creating customers...");

  const customersData = [
    { name: "Ahmad Fauzi", phone: "08211000001", email: "ahmad@gmail.com" },
    { name: "Rina Marlina", phone: "08211000002", email: "rina@gmail.com" },
    { name: "Doni Kusuma", phone: "08211000003", email: null },
    { name: "Fitri Handayani", phone: "08211000004", email: "fitri@gmail.com" },
    { name: "Bambang Wijaya", phone: "08211000005", email: null },
    { name: "Sari Dewi", phone: "08211000006", email: "sari@gmail.com" },
    { name: "Hendra Gunawan", phone: "08211000007", email: null },
    { name: "Nurul Aini", phone: "08211000008", email: "nurul@gmail.com" },
    { name: "Rudi Hartono", phone: "08211000009", email: null },
    { name: "Maya Sari", phone: "08211000010", email: "maya@gmail.com" },
    { name: "Agus Prasetyo", phone: "08211000011", email: null },
    { name: "Lina Octavia", phone: "08211000012", email: "lina@gmail.com" },
    { name: "Fajar Setiawan", phone: "08211000013", email: null },
    { name: "Indah Permata", phone: "08211000014", email: "indah@gmail.com" },
    { name: "Bayu Nugroho", phone: "08211000015", email: null },
    { name: "Putri Rahayu", phone: "08211000016", email: "putri@gmail.com" },
    { name: "Wahyu Saputra", phone: "08211000017", email: null },
    { name: "Citra Lestari", phone: "08211000018", email: "citra@gmail.com" },
    { name: "Iwan Setiadi", phone: "08211000019", email: null },
    { name: "Yuni Astuti", phone: "08211000020", email: "yuni@gmail.com" },
  ];

  const customers = await Promise.all(
    customersData.map((c) =>
      db.guestCustomer.upsert({
        where: { phone: c.phone },
        create: c,
        update: {},
      }),
    ),
  );

  console.log(`  ✅ ${customers.length} customers ready`);
  return customers;
}

// ─── FNB Orders ───────────────────────────────────────────────────────────────

async function seedFNBOrders(
  outletId: string,
  customers: Awaited<ReturnType<typeof createCustomers>>,
) {
  console.log("🍜 Creating FNB orders...");

  // Fetch products and staff for this outlet
  const products = await db.product.findMany({
    where: { outletId },
    include: { goods: true },
  });

  const staff = await db.staff.findMany({ where: { outletId } });
  const tables = await db.outletTable.findMany({ where: { outletId } });

  const paymentMethods: ManualPaymentType[] = [
    ManualPaymentType.CASH,
    ManualPaymentType.QRIS_OFFLINE,
    ManualPaymentType.OWNER_TRANSFER,
  ];

  for (let i = 0; i < 35; i++) {
    const customer = pick(customers);
    const staffMember = pick(staff);
    const orderDate = randomDate(60);
    const itemCount = rand(1, 4);
    const isDineIn = Math.random() < 0.6;

    const selectedProducts = [...products]
      .sort(() => Math.random() - 0.5)
      .slice(0, itemCount);

    let subtotal = 0;
    const orderItems = selectedProducts.map((p) => {
      const qty = rand(1, 3);
      const price = p.goods!.sellingPrice;
      const hpp = p.goods!.averageHpp;
      subtotal += price * qty;
      return { productId: p.id, quantity: qty, price, hpp, tax: p.taxPercentage ?? 0 };
    });

    const taxAmount = orderItems.reduce(
      (sum, item) => sum + Math.round(item.price * item.quantity * (item.tax / 100)),
      0,
    );
    const totalAmount = subtotal + taxAmount;

    let tableId: string | undefined;
    let tableNumber: string | undefined;
    let billId: string | undefined;

    if (isDineIn) {
      const table = pick(tables);
      tableId = table.id;
      tableNumber = table.name;

      const bill = await db.bill.create({
        data: {
          outletId,
          tableId: table.id,
          status: BillStatus.PAID,
          total: totalAmount,
          closedAt: orderDate,
        },
      });
      billId = bill.id;
    }

    const order = await db.order.create({
      data: {
        id: genId("ORD"),
        outletId,
        guestCustomerId: customer.id,
        handledByStaffId: staffMember.id,
        totalAmount,
        taxAmount,
        orderStatus: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.SUCCESS,
        customerType: CustomerType.GUEST,
        tableId: tableId ?? null,
        billId: billId ?? null,
        tableNumber: tableNumber ?? null,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtTimeOfOrder: item.price,
            hppAtTimeOfOrder: item.hpp,
          })),
        },
      },
    });

    // Transaction (always SUCCESS)
    await db.transaction.create({
      data: {
        orderId: order.id,
        amount: totalAmount,
        status: PaymentStatus.SUCCESS,
        isManual: true,
        manualMethod: pick(paymentMethods),
        verifiedAt: orderDate,
        verifiedById: OWNER_ID,
        cashReceived: totalAmount + rand(0, 5) * 10_000,
        cashChange: 0,
      },
    });

    // Loyalty points
    const points = Math.floor(totalAmount / 10_000);
    if (points > 0) {
      await db.loyaltyPointHistory.create({
        data: {
          outletId,
          guestCustomerId: customer.id,
          orderId: order.id,
          type: LoyaltyPointHistoryType.EARN,
          points,
          note: "Poin dari transaksi",
        },
      });
    }

    // Expenses (occasional)
    if (i % 10 === 0) {
      await db.expense.create({
        data: {
          description: `Biaya operasional hari ${i + 1}`,
          amount: rand(50_000, 500_000),
          cashier: staffMember.name,
          date: orderDate,
          outletId,
        },
      });
    }
  }

  console.log("  ✅ 35 FNB orders created (all COMPLETED)");
}

// ─── Retail Orders ────────────────────────────────────────────────────────────

async function seedRetailOrders(
  outletId: string,
  customers: Awaited<ReturnType<typeof createCustomers>>,
) {
  console.log("🛒 Creating Retail orders...");

  const products = await db.product.findMany({
    where: { outletId },
    include: { goods: true },
  });

  const staff = await db.staff.findMany({ where: { outletId } });

  const paymentMethods: ManualPaymentType[] = [
    ManualPaymentType.CASH,
    ManualPaymentType.QRIS_OFFLINE,
    ManualPaymentType.OWNER_TRANSFER,
  ];

  for (let i = 0; i < 30; i++) {
    const customer = pick(customers);
    const staffMember = pick(staff);
    const orderDate = randomDate(60);
    const itemCount = rand(1, 5);

    const selectedProducts = [...products]
      .sort(() => Math.random() - 0.5)
      .slice(0, itemCount);

    let subtotal = 0;
    const orderItems = selectedProducts.map((p) => {
      const qty = rand(1, 4);
      const price = p.goods!.sellingPrice;
      const hpp = p.goods!.averageHpp;
      subtotal += price * qty;
      return { productId: p.id, goodsId: p.goods!.id, quantity: qty, price, hpp, tax: p.taxPercentage ?? 0 };
    });

    const taxAmount = orderItems.reduce(
      (sum, item) => sum + Math.round(item.price * item.quantity * (item.tax / 100)),
      0,
    );
    const totalAmount = subtotal + taxAmount;

    const order = await db.order.create({
      data: {
        id: genId("ORD"),
        outletId,
        guestCustomerId: customer.id,
        handledByStaffId: staffMember.id,
        totalAmount,
        taxAmount,
        orderStatus: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.SUCCESS,
        customerType: CustomerType.GUEST,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtTimeOfOrder: item.price,
            hppAtTimeOfOrder: item.hpp,
          })),
        },
      },
    });

    // Transaction
    await db.transaction.create({
      data: {
        orderId: order.id,
        amount: totalAmount,
        status: PaymentStatus.SUCCESS,
        isManual: true,
        manualMethod: pick(paymentMethods),
        verifiedAt: orderDate,
        verifiedById: OWNER_ID,
        cashReceived: totalAmount + rand(0, 10) * 10_000,
        cashChange: 0,
      },
    });

    // Stock OUT logs
    for (const item of orderItems) {
      await db.stockLog.create({
        data: {
          productGoodsId: item.goodsId,
          type: StockMovementType.OUT,
          quantity: item.quantity,
          hppPerUnit: item.hpp,
          referenceType: "ORDER",
          referenceId: order.id,
        },
      });
    }

    // Loyalty points
    const points = Math.floor(totalAmount / 5_000);
    if (points > 0) {
      await db.loyaltyPointHistory.create({
        data: {
          outletId,
          guestCustomerId: customer.id,
          orderId: order.id,
          type: LoyaltyPointHistoryType.EARN,
          points,
          note: "Poin dari transaksi",
        },
      });
    }
  }

  console.log("  ✅ 30 Retail orders created (all COMPLETED)");
}

// ─── Service Orders ───────────────────────────────────────────────────────────

async function seedServiceOrders(
  outletId: string,
  customers: Awaited<ReturnType<typeof createCustomers>>,
) {
  console.log("💇 Creating Service orders...");

  const products = await db.product.findMany({
    where: { outletId },
    include: { service: true },
  });

  const staff = await db.staff.findMany({ where: { outletId } });

  const paymentMethods: ManualPaymentType[] = [
    ManualPaymentType.CASH,
    ManualPaymentType.QRIS_OFFLINE,
    ManualPaymentType.OWNER_TRANSFER,
  ];

  for (let i = 0; i < 20; i++) {
    const customer = pick(customers);
    const staffMember = pick(staff);
    const orderDate = randomDate(60);
    const product = pick(products);

    const totalAmount = product.service!.sellingPrice;

    // Create booking slot
    const bookingStart = randomHour(orderDate, 10, 18);
    const bookingEnd = addMinutes(bookingStart, product.service!.durationMinutes);

    const bookingSlot = await db.bookingSlot.create({
      data: {
        date: orderDate,
        startTime: bookingStart,
        endTime: bookingEnd,
        status: BookingSlotStatus.BOOKED,
        productServiceId: product.service!.id,
      },
    });

    const order = await db.order.create({
      data: {
        id: genId("ORD"),
        outletId,
        guestCustomerId: customer.id,
        handledByStaffId: staffMember.id,
        totalAmount,
        taxAmount: 0,
        orderStatus: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.SUCCESS,
        customerType: CustomerType.GUEST,
        bookingDate: orderDate,
        bookingDurationMinutes: product.service!.durationMinutes,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: [
            {
              productId: product.id,
              quantity: 1,
              priceAtTimeOfOrder: totalAmount,
              hppAtTimeOfOrder: 0,
            },
          ],
        },
      },
    });

    // Link booking slot to order item
    const orderItem = await db.orderItem.findFirst({
      where: { orderId: order.id },
    });
    if (orderItem) {
      await db.bookingSlot.update({
        where: { id: bookingSlot.id },
        data: { orderItemId: orderItem.id },
      });
    }

    // Transaction
    await db.transaction.create({
      data: {
        orderId: order.id,
        amount: totalAmount,
        status: PaymentStatus.SUCCESS,
        isManual: true,
        manualMethod: pick(paymentMethods),
        verifiedAt: orderDate,
        verifiedById: OWNER_ID,
        cashReceived: totalAmount,
        cashChange: 0,
      },
    });

    // Loyalty points
    const points = Math.floor(totalAmount / 20_000);
    if (points > 0) {
      await db.loyaltyPointHistory.create({
        data: {
          outletId,
          guestCustomerId: customer.id,
          orderId: order.id,
          type: LoyaltyPointHistoryType.EARN,
          points,
          note: "Poin dari transaksi",
        },
      });
    }
  }

  console.log("  ✅ 20 Service orders created (all COMPLETED)");
}

// ─── Event Orders ─────────────────────────────────────────────────────────────

async function seedEventOrders(
  outletId: string,
  customers: Awaited<ReturnType<typeof createCustomers>>,
) {
  console.log("🎵 Creating Event orders...");

  const products = await db.product.findMany({
    where: { outletId },
    include: { ticket: true },
  });

  const staff = await db.staff.findMany({ where: { outletId } });

  const paymentMethods: ManualPaymentType[] = [
    ManualPaymentType.CASH,
    ManualPaymentType.QRIS_OFFLINE,
    ManualPaymentType.OWNER_TRANSFER,
  ];

  for (let i = 0; i < 15; i++) {
    const customer = pick(customers);
    const staffMember = pick(staff);
    const orderDate = randomDate(30);
    const product = pick(products);

    const qty = rand(1, 3);
    const totalAmount = product.ticket!.sellingPrice * qty;

    const order = await db.order.create({
      data: {
        id: genId("ORD"),
        outletId,
        guestCustomerId: customer.id,
        handledByStaffId: staffMember.id,
        totalAmount,
        taxAmount: 0,
        orderStatus: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.SUCCESS,
        customerType: CustomerType.GUEST,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: [
            {
              productId: product.id,
              quantity: qty,
              priceAtTimeOfOrder: product.ticket!.sellingPrice,
              hppAtTimeOfOrder: 0,
            },
          ],
        },
      },
    });

    // Transaction
    await db.transaction.create({
      data: {
        orderId: order.id,
        amount: totalAmount,
        status: PaymentStatus.SUCCESS,
        isManual: true,
        manualMethod: pick(paymentMethods),
        verifiedAt: orderDate,
        verifiedById: OWNER_ID,
        cashReceived: totalAmount,
        cashChange: 0,
      },
    });

    // Update sold count
    await db.productTicket.update({
      where: { id: product.ticket!.id },
      data: { soldCount: { increment: qty } },
    });

    // Loyalty points
    const points = Math.floor(totalAmount / 15_000);
    if (points > 0) {
      await db.loyaltyPointHistory.create({
        data: {
          outletId,
          guestCustomerId: customer.id,
          orderId: order.id,
          type: LoyaltyPointHistoryType.EARN,
          points,
          note: "Poin dari transaksi",
        },
      });
    }
  }

  console.log("  ✅ 15 Event orders created (all COMPLETED)");
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
