import { DatabaseFactory } from './factories';
import type { Business, SubscriptionPlan } from "@prisma/client";

const {
  PrismaClient,
  ProductType,
  UserRole,
  ServiceStatus,
  SubscriptionStatus,
  PaymentStatus,
  OrderStatus,
  OutletType,
} = require("@prisma/client");
const { hash } = require("bcryptjs");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const DAY_IN_MS = 1000 * 60 * 60 * 24;

const sanitizeForCode = (value: string): string => {
  const sanitized = value.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return (sanitized || "BIZ").toUpperCase();
};

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

  console.log("🗑️  Clearing all existing data...");
  await prisma.ticketCode.deleteMany({});
  await prisma.bookingSlot.deleteMany({});
  await prisma.productMedia.deleteMany({});
  await prisma.outletTransferRequest.deleteMany({});
  await prisma.banner.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.bill.deleteMany({});
  await prisma.outletTable.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.loyaltyPointHistory.deleteMany({});
  await prisma.outletMembership.deleteMany({});
  await prisma.loyaltyConfig.deleteMany({});
  await prisma.receiptSetting.deleteMany({});
  await prisma.guestCustomer.deleteMany({});
  await prisma.pushSubscription.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.stockLog.deleteMany({});
  await prisma.productGoods.deleteMany({});
  await prisma.productService.deleteMany({});
  await prisma.productTicket.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.outletOperatingHours.deleteMany({});
  await prisma.outlet.deleteMany({});
  await prisma.subscriptionInvoice.deleteMany({});
  await prisma.businessSubscription.deleteMany({});
  await prisma.business.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("✅ Old data cleaned.");

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
    {
      name: "Jasa",
      lat: -6.2615,
      lng: 106.8105,
      address: "Jl. Panglima Polim Raya No. 12, Jakarta Selatan",
    },
  ];
  let outlets = [];

  // Default Owner → 2 outlet (FNB + SERVICE)
  const fnbLocation = jakselLocations[0];
  const fnbOutlet = await prisma.outlet.create({
    data: {
      name: `${businesses[0].name} - ${fnbLocation.name}`,
      address: fnbLocation.address,
      phone: "+6281234560001",
      isOpen: true,
      businessId: businesses[0].id,
      latitude: fnbLocation.lat,
      longitude: fnbLocation.lng,
      image: outletImages.coffee,
      slug: "kopi-nusantara-kemang",
      type: OutletType.FNB,
    },
  });
  outlets.push(fnbOutlet);

  const svcLocation = jakselLocations[5];
  const svcOutlet = await prisma.outlet.create({
    data: {
      name: `${businesses[0].name} - ${svcLocation.name}`,
      address: svcLocation.address,
      phone: "+6281234560002",
      isOpen: true,
      businessId: businesses[0].id,
      latitude: svcLocation.lat,
      longitude: svcLocation.lng,
      image: outletImages.coffee,
      slug: "kopi-nusantara-jasa",
      type: OutletType.SERVICE,
    },
  });
  outlets.push(svcOutlet);

  // Other 4 businesses → 1 outlet each
  for (let i = 1; i < businesses.length; i++) {
    const location = jakselLocations[i];
    const businessType = businessTypes[i];
    const imageUrl = outletImages[businessType as keyof typeof outletImages];
    const outletType = businessType === "food" ? OutletType.FNB
      : businessType === "electronics" ? OutletType.RETAIL
      : OutletType.SERVICE;

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
        slug: `${businesses[i].name}-${location.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        type: outletType,
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

  // --- 5. Deterministic Products + Staff per Outlet ---
  console.log("👨‍🍳 Creating deterministic products and staff...");

  const cashierPassword = await hash("111111", 10);

  // FNB Outlet (outlets[0]): 1 GOODS product + 1 cashier
  const fnbProduct = await prisma.product.create({
    data: {
      name: "Kopi Susu Spesial",
      description: "Kopi susu dengan biji pilihan Arabica, disajikan dengan steamed milk",
      type: ProductType.GOODS,
      outletId: outlets[0].id,
      taxPercentage: 11,
      status: "ACTIVE",
      image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=800",
    },
  });
  await prisma.productGoods.create({
    data: {
      productId: fnbProduct.id,
      currentStock: 100,
      minStock: 10,
      unit: "cup",
      sellingPrice: 25000,
      averageHpp: 10000,
    },
  });
  const fnbCashier = await prisma.staff.create({
    data: {
      name: "Kasir FNB",
      phone: "+6281234567001",
      email: "kasir.fnb@bossapp.id",
      password: cashierPassword,
      outletId: outlets[0].id,
    },
  });

  // SERVICE Outlet (outlets[1]): 1 SERVICE product + 1 cashier
  const svcProduct = await prisma.product.create({
    data: {
      name: "Barista Training",
      description: "Pelatihan barista profesional untuk pemula hingga mahir",
      type: ProductType.SERVICE,
      outletId: outlets[1].id,
      taxPercentage: 0,
      status: "ACTIVE",
      image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800",
    },
  });
  await prisma.productService.create({
    data: {
      productId: svcProduct.id,
      durationMinutes: 120,
      sellingPrice: 250000,
      providerName: "Bambang Barista",
      commissionType: "PERCENTAGE",
      commissionValue: 10,
    },
  });
  const svcCashier = await prisma.staff.create({
    data: {
      name: "Kasir Jasa",
      phone: "+6281234567002",
      email: "kasir.jasa@bossapp.id",
      password: cashierPassword,
      outletId: outlets[1].id,
    },
  });

  const productImages: Record<string, string> = {
    food: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800",
    beauty: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800",
    electronics: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?q=80&w=800",
    laundry: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?q=80&w=800",
  };

  // Other 4 outlets: 1 deterministic product + 1 cashier each
  const otherProducts = [
    { idx: 2, name: "Nasi Goreng Spesial", price: 35000, type: ProductType.GOODS, unit: "porsi", tax: 11, hpp: 15000, stock: 80, staffName: "Kasir Warung", imgKey: "food" },
    { idx: 3, name: "Hair Cut & Wash", price: 75000, type: ProductType.SERVICE, duration: 60, tax: 0, provider: "Rina Hair", comm: 15, staffName: "Kasir Salon", imgKey: "beauty" },
    { idx: 4, name: "Screen Repair", price: 500000, type: ProductType.SERVICE, duration: 120, tax: 0, provider: "Tono Tech", comm: 20, staffName: "Kasir Elektronik", imgKey: "electronics" },
    { idx: 5, name: "Wash & Fold", price: 10000, type: ProductType.SERVICE, duration: 180, tax: 0, provider: "Laundry Team", comm: 10, staffName: "Kasir Laundry", imgKey: "laundry" },
  ];
  for (const p of otherProducts) {
    const outlet = outlets[p.idx];
    const prod = await prisma.product.create({
      data: {
        name: p.name,
        type: p.type,
        outletId: outlet.id,
        taxPercentage: p.tax,
        status: "ACTIVE",
        image: productImages[p.imgKey],
      },
    });
    if (p.type === ProductType.GOODS) {
      await prisma.productGoods.create({
        data: {
          productId: prod.id,
          currentStock: p.stock!,
          minStock: 10,
          unit: p.unit!,
          sellingPrice: p.price,
          averageHpp: p.hpp!,
        },
      });
    } else {
      await prisma.productService.create({
        data: {
          productId: prod.id,
          durationMinutes: p.duration!,
          sellingPrice: p.price,
          providerName: p.provider!,
          commissionType: "PERCENTAGE",
          commissionValue: p.comm!,
        },
      });
    }
    await prisma.staff.create({
      data: {
        name: p.staffName,
        phone: `+6281234567${String(700 + p.idx).padStart(3, "0")}`,
        email: `${p.staffName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        password: cashierPassword,
        outletId: outlet.id,
      },
    });
  }

  console.log("✅ Deterministic products and staff created.");

  // --- 6. FNB: 100 dummy transactions with PPN 11% & cashier ---
  console.log("💰 Generating 100 FNB transactions with PPN 11%...");
  const factory = new DatabaseFactory(prisma);
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  const endDate = new Date();

  const fnbProducts = [{
    id: fnbProduct.id,
    price: 25000,
    type: ProductType.GOODS,
    hpp: 10000,
    taxPercentage: 11,
  }];
  await factory.createDummyTransactions(
    fnbOutlet.id, fnbProducts, 100, startDate, endDate, fnbCashier.id,
  );
  console.log("✅ 100 FNB transactions created.");

  // --- 7. Factory mass data for remaining outlets ---
  console.log("📦 Generating mass dummy data for reports...");
  for (let i = 1; i < outlets.length; i++) {
    const outlet = outlets[i];
    console.log(`Generating data for outlet: ${outlet.name}`);

    const products = await factory.createDummyProducts(outlet.id, 30);
    await factory.createDummyTransactions(outlet.id, products, 150, startDate, endDate);
    await factory.createDummyExpenses(outlet.id, 50, startDate, endDate);
  }
  console.log("✅ Mass dummy data generation for reports completed.");

  // --- 8. OutletTable, LoyaltyConfig, receiptSetting per outlet ---
  console.log("🪑 Creating tables, loyalty configs, and receipt settings...");
  for (const outlet of outlets) {
    await prisma.outletTable.createMany({
      data: Array.from({ length: 6 }, (_, i) => ({
        name: `Meja ${i + 1}`,
        capacity: i < 2 ? 2 : i < 4 ? 4 : 6,
        outletId: outlet.id,
      })),
    });

    await prisma.loyaltyConfig.upsert({
      where: { outletId: outlet.id },
      update: {},
      create: {
        outletId: outlet.id,
        pointsEarned: 1,
        multiplierAmount: 10000,
        pointValue: 100,
        isActive: true,
      },
    });

    await prisma.receiptSetting.upsert({
      where: { outletId: outlet.id },
      update: {},
      create: {
        outletId: outlet.id,
        headerText: `${outlet.name}`,
        footerText: "Terima kasih atas kunjungan Anda",
        showCashier: true,
        showCustomer: true,
      },
    });
  }
  console.log("✅ Tables, loyalty configs, and receipt settings created.");

  // --- 9. Summary ---
  console.log("\n📊 SEEDING SUMMARY:");
  const counts = await prisma.$transaction([
    prisma.user.count(),
    prisma.business.count(),
    prisma.outlet.count(),
    prisma.product.count(),
    prisma.staff.count(),
    prisma.businessSubscription.count(),
    prisma.subscriptionInvoice.count(),
    prisma.order.count(),
    prisma.transaction.count(),
    prisma.outletTable.count(),
    prisma.loyaltyConfig.count(),
  ]);
  console.log(`👥 Users: ${counts[0]}`);
  console.log(`🏢 Businesses: ${counts[1]}`);
  console.log(`🏪 Outlets: ${counts[2]}`);
  console.log(`📦 Products: ${counts[3]}`);
  console.log(`👨‍🍳 Staff: ${counts[4]}`);
  console.log(`📄 Business Subscriptions: ${counts[5]}`);
  console.log(`🧾 Subscription Invoices: ${counts[6]}`);
  console.log(`🛒 Orders: ${counts[7]}`);
  console.log(`💸 Transactions: ${counts[8]}`);
  console.log(`🪑 Outlet Tables: ${counts[9]}`);
  console.log(`⭐ Loyalty Configs: ${counts[10]}`);

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
