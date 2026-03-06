import { DatabaseFactory } from './factories';
import type { Business, Outlet, SubscriptionPlan, ProductType as ProductTypeEnum } from "@prisma/client";

const {
  PrismaClient,
  ProductType,
  UserRole,
  ServiceStatus,
  SubscriptionStatus,
  PaymentStatus,
  OrderStatus,
} = require("@prisma/client");
const { hash } = require("bcryptjs");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const DAY_IN_MS = 1000 * 60 * 60 * 24;

type OutletCatalogProduct = {
  productId: string;
  price: number;
  type: ProductTypeEnum;
};

type OutletProductCatalog = Record<string, OutletCatalogProduct[]>;

const roundCurrency = (value: number): number => Math.round(value * 100) / 100;

const sanitizeForCode = (value: string): string => {
  const sanitized = value.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return (sanitized || "BIZ").toUpperCase();
};

const forceReseed = process.argv.includes("--force") || process.argv.includes("-f");

// Subscription Plan Features Definition
const SUBSCRIPTION_PLANS = [
  {
    name: "Trial",
    code: "TRIAL",
    price: 0,
    durationDays: 14,
    isPopular: false,
    features: {
      maxOutlets: 1,
      maxProducts: 10,
      maxStaff: 1,
      canExportReport: false,
      supportLevel: "EMAIL"
    }
  },
  {
    name: "Basic",
    code: "BASIC",
    price: 99000,
    durationDays: 30,
    isPopular: false,
    features: {
      maxOutlets: 3,
      maxProducts: 100,
      maxStaff: 5,
      canExportReport: true,
      supportLevel: "WHATSAPP"
    }
  },
  {
    name: "Pro",
    code: "PRO",
    price: 199000,
    durationDays: 30,
    isPopular: true,
    features: {
      maxOutlets: -1,
      maxProducts: -1,
      maxStaff: -1,
      canExportReport: true,
      supportLevel: "PRIORITY"
    }
  }
];

async function seedSubscriptionPlans() {
  console.log("💳 Creating subscription plans...");

  await Promise.all(
    SUBSCRIPTION_PLANS.map((plan) =>
      prisma.subscriptionPlan.upsert({
        where: { code: plan.code },
        update: {
          name: plan.name,
          price: plan.price,
          durationDays: plan.durationDays,
          features: plan.features,
          isPopular: plan.isPopular,
          isActive: true,
        },
        create: {
          name: plan.name,
          code: plan.code,
          price: plan.price,
          durationDays: plan.durationDays,
          features: plan.features,
          isPopular: plan.isPopular,
          isActive: true,
        },
      })
    )
  );

  console.log(`✅ ${SUBSCRIPTION_PLANS.length} subscription plans synced.`);
}

async function seedBusinessSubscriptionsAndInvoices(businesses: Business[]) {
  if (!businesses.length) return;

  console.log("🧾 Creating business subscriptions and invoices...");

  const plans: SubscriptionPlan[] = await prisma.subscriptionPlan.findMany();
  if (!plans.length) {
    throw new Error(
      "Subscription plans must be seeded before creating business subscriptions.",
    );
  }

  const planMap: Record<string, SubscriptionPlan> = {};
  plans.forEach((plan) => {
    planMap[plan.code] = plan;
  });

  for (let i = 0; i < businesses.length; i++) {
    const business = businesses[i];
    const targetPlan = planMap[business.subscriptionPlan] || planMap.BASIC || plans[0];
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + targetPlan.durationDays * DAY_IN_MS);

    const subscription = await prisma.businessSubscription.create({
      data: {
        businessId: business.id,
        planId: targetPlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
      },
    });

    await prisma.business.update({
      where: { id: business.id },
      data: {
        currentSubscriptionId: subscription.id,
        subscriptionPlan: targetPlan.code,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
      },
    });

    const invoiceNumber = `INV-${sanitizeForCode(business.name)}-${String(i + 1).padStart(3, "0")}`;

    await prisma.subscriptionInvoice.create({
      data: {
        invoiceNumber,
        amount: targetPlan.price,
        status: PaymentStatus.SUCCESS,
        paidAt: new Date(),
        businessId: business.id,
        subscriptionId: subscription.id,
      },
    });
  }

  console.log(`✅ ${businesses.length} business subscriptions and invoices created.`);
}

async function seedOutletTransactions(outlets: Outlet[], productsByOutlet: OutletProductCatalog) {
  if (!outlets.length) return;

  console.log("💰 Creating sample orders and transactions...");

  let transactionCount = 0;

  for (let i = 0; i < outlets.length; i++) {
    const outlet = outlets[i];
    const outletProducts = productsByOutlet[outlet.id] || [];

    if (!outletProducts.length) {
      console.warn(
        `⚠️  Skipping transactions for outlet ${outlet.name} because no products were found.`,
      );
      continue;
    }

    const preferredProduct =
      outletProducts.find((product) => product.type === ProductType.GOODS) || outletProducts[0];

    const quantity = (i % 3) + 1;
    const subtotal = preferredProduct.price * quantity;
    const midtransFee = roundCurrency(subtotal * 0.007);
    const appFee = roundCurrency(subtotal * 0.02);
    const totalAmount = roundCurrency(subtotal + midtransFee + appFee);

    const guestCustomer = await prisma.guestCustomer.create({
      data: {
        name: `Guest ${outlet.name}`,
        phone: `+6281300${String(5000 + i).padStart(4, "0")}`,
        email: `guest${i + 1}@example.com`,
      },
    });

    const midtransToken = `MID-${outlet.id.slice(0, 8)}-${i + 1}`;

    const order = await prisma.order.create({
      data: {
        totalAmount,
        paymentStatus: PaymentStatus.SUCCESS,
        orderStatus: OrderStatus.COMPLETED,
        paymentReminderSent: true,
        midtransTransactionToken: midtransToken,
        midtransRedirectUrl: `https://payments.example.com/${midtransToken}`,
        guestCustomerId: guestCustomer.id,
        outletId: outlet.id,
        midtransFee,
        appFee,
        items: {
          create: [
            {
              quantity,
              priceAtTimeOfOrder: preferredProduct.price,
              productId: preferredProduct.productId,
            },
          ],
        },
      },
    });

    await prisma.transaction.create({
      data: {
        amount: totalAmount,
        paymentMethod: "midtrans",
        status: PaymentStatus.SUCCESS,
        paymentUrl: order.midtransRedirectUrl,
        externalId: `TRX-${midtransToken}`,
        orderId: order.id,
      },
    });

    transactionCount += 1;
  }

  console.log(`✅ ${transactionCount} sample transactions created (one per outlet).`);
}

function validateEnvironment() {
  const requiredEnvVars = ["DATABASE_URL"];
  const missing = requiredEnvVars.filter((env) => !process.env[env]);
  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:", missing.join(", "));
    process.exit(1);
  }
}

async function main() {
  console.log("🌱 Starting database seeding with VERIFIED images for both Outlets and Products...");
  validateEnvironment();

  await seedSubscriptionPlans();

  if (forceReseed) {
    console.log("⚡ FORCE RESEED MODE: Clearing all existing data!");
    console.log("🗑️  Cleaning existing data...");

    await prisma.expense.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.guestCustomer.deleteMany({});
    await prisma.stockLog.deleteMany({}); // Added cleanup for StockLog
    await prisma.productGoods.deleteMany({}); // Added cleanup
    await prisma.productService.deleteMany({}); // Added cleanup
    await prisma.product.deleteMany({});
    await prisma.outletOperatingHours.deleteMany({});
    await prisma.outlet.deleteMany({});
    await prisma.subscriptionInvoice.deleteMany({});
    await prisma.businessSubscription.deleteMany({});
    // await prisma.wallet.deleteMany({}); // Removed Wallet
    await prisma.business.deleteMany({});
    await prisma.user.deleteMany({});
    console.log("✅ Old data cleaned.");
  } else {
    const existingProducts = await prisma.product.count();
    if (existingProducts > 0) {
      console.log(`⚠️  Database already contains ${existingProducts} products. Skipping seeding.`);
      console.log("   Use --force or -f flag to force reseed.");
      return;
    }
  }

  // --- 1. Create Users ---
  console.log("👥 Creating users...");
  const hashedPassword = await hash("password123", 10);
  const usersData = [
    { name: "Default Owner", email: "owner@example.com" },
    { name: "John Coffee", email: "john@coffee.com" },
    { name: "Sarah Food", email: "sarah@food.com" },
    { name: "Lisa Beauty", email: "lisa@beauty.com" },
    { name: "Mike Tech", email: "mike@tech.com" },
    { name: "admin", email: "admin@gmail.com", role: UserRole.ADMIN },
  ];
  const users = await Promise.all(
    usersData.map(async (user, i) => {
      // Gunakan upsert untuk handle duplicate
      return prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          ...user,
          phone: `+628123456789${i}`,
          password: hashedPassword,
          ...(user.role ? { role: user.role } : { role: UserRole.OWNER }),
          isVerified: true,
        },
      });
    }),
  );
  console.log("✅ Users created.");

  // --- 2. Create Businesses ---
  console.log("🏢 Creating 5 businesses...");
  const businessesData = [
    { name: "Kopi Nusantara", ownerId: users[0].id },
    { name: "Warung Makan Sederhana", ownerId: users[1].id },
    { name: "Salon Cantik", ownerId: users[2].id },
    { name: "Toko Elektronik Maju", ownerId: users[3].id },
    { name: "Laundry Express", ownerId: users[4].id },
  ];
  const businesses = await Promise.all(
    businessesData.map((biz) =>
      prisma.business.create({
        data: {
          ...biz,
          description: `${biz.name} description`,
          bankName: "Bank BCA",
          bankAccount: "1234567890",
          accountHolder: biz.name,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionPlan: "BASIC",
        },
      }),
    ),
  );
  console.log("✅ 5 Businesses with wallets created.");

  await seedBusinessSubscriptionsAndInvoices(businesses);

  const businessTypes = ["coffee", "food", "beauty", "electronics", "laundry"];
  const outletImages = {
    coffee: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200",
    food: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200",
    beauty: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=1200",
    electronics: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?q=80&w=1200",
    laundry: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?q=80&w=1200",
  };

  // --- 3. Create Outlets ---
  console.log("🏪 Creating outlets with relevant images...");
  const jakselLocations = [
    {
      name: "Kemang",
      lat: -6.2665,
      lng: 106.8167,
      address: "Jl. Kemang Raya No. 25, Jakarta Selatan",
    },
    {
      name: "Senopati",
      lat: -6.2297,
      lng: 106.8197,
      address: "Jl. Senopati No. 15, Jakarta Selatan",
    },
    { name: "Blok M", lat: -6.2443, lng: 106.7993, address: "Jl. Blok M No. 10, Jakarta Selatan" },
    {
      name: "Cipete",
      lat: -6.2704,
      lng: 106.8058,
      address: "Jl. Cipete Raya No. 35, Jakarta Selatan",
    },
    {
      name: "Pondok Indah",
      lat: -6.2655,
      lng: 106.7808,
      address: "Jl. Metro Pondok Indah No. 5, Jakarta Selatan",
    },
  ];
  let outlets = [];
  for (let i = 0; i < businesses.length; i++) {
    const location = jakselLocations[i % jakselLocations.length];
    const businessType = businessTypes[i]; // Ambil tipe bisnis
    const imageUrl = outletImages[businessType as keyof typeof outletImages]; // Pilih URL gambar yang sesuai

    const outlet = await prisma.outlet.create({
      data: {
        name: `${businesses[i].name} - ${location.name}`,
        address: location.address,
        phone: `+62812345${String(60000 + i).padStart(5, "0")}`,
        isOpen: Math.random() > 0.2,
        businessId: businesses[i].id,
        latitude: location.lat,
        longitude: location.lng,
        image: imageUrl,
      },
    });
    outlets.push(outlet);
  }
  console.log(`✅ ${outlets.length} outlets created.`);

  // --- 4. Create Operating Hours ---
  console.log("⏰ Creating operating hours...");
  for (const outlet of outlets) {
    await prisma.outletOperatingHours.createMany({
      data: Array.from({ length: 7 }, (_, day) => ({
        dayOfWeek: day,
        openTime: new Date("1970-01-01T02:00:00Z"),
        closeTime: new Date("1970-01-01T14:00:00Z"),
        isOpen: day !== 0,
        outletId: outlet.id,
      })),
    });
  }
  console.log("✅ Operating hours created.");

  // --- 5. Create Products, Transactions, and Expenses using Factory ---
  console.log("📦 Generating mass dummy data for reports using Laravel-style Factories...");
  
  const factory = new DatabaseFactory(prisma);
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6); // Data dummy untuk 6 bulan terakhir
  const endDate = new Date();

  for (let i = 0; i < outlets.length; i++) {
    const outlet = outlets[i];
    console.log(`Generating data for outlet: ${outlet.name}`);
    
    // Generate 30 produk per outlet
    const products = await factory.createDummyProducts(outlet.id, 30);
    
    // Generate 150 transaksi per outlet selama 6 bulan terakhir
    await factory.createDummyTransactions(outlet.id, products, 150, startDate, endDate);
    
    // Generate 50 pengeluaran per outlet selama 6 bulan terakhir
    await factory.createDummyExpenses(outlet.id, 50, startDate, endDate);
  }
  
  console.log("✅ Mass dummy data generation for reports completed.");

  // --- 6. Summary ---
  console.log("\n📊 SEEDING SUMMARY:");
  const counts = await prisma.$transaction([
    prisma.user.count(),
    prisma.business.count(),
    prisma.outlet.count(),
    prisma.product.count(),
    prisma.businessSubscription.count(),
    prisma.subscriptionInvoice.count(),
    prisma.order.count(),
    prisma.transaction.count(),
  ]);
  console.log(`👥 Users: ${counts[0]}`);
  console.log(`🏢 Businesses: ${counts[1]}`);
  console.log(`🏪 Outlets: ${counts[2]}`);
  console.log(`📦 Products: ${counts[3]}`);
  console.log(`📄 Business Subscriptions: ${counts[4]}`);
  console.log(`🧾 Subscription Invoices: ${counts[5]}`);
  console.log(`🛒 Orders: ${counts[6]}`);
  console.log(`💸 Transactions: ${counts[7]}`);

  console.log("\n✨ Database seeding completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🔌 Database connection closed.");
  });
