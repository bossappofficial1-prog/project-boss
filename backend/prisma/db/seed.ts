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
  LoyaltyPointHistoryType,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { subDays, addHours, setHours, startOfDay } from "date-fns";
import { db } from "../../src/config/prisma";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  console.log("🌱 Seeding database...");

  await cleanDatabase();

  // ── 1. Owner ──────────────────────────────────────────────────────────────

  const owner = await db.user.create({
    data: {
      name: "Budi Santoso",
      email: "budi@bossapp.id",
      password: await hash("password123", 10),
      role: "OWNER",
      isVerified: true,
      phone: "081234567890",
    },
  });
  console.log("✅ Owner created");

  // ── 1b. Admin ─────────────────────────────────────────────────────────────

  await db.user.create({
    data: {
      name: "Admin BOSS",
      email: "admin@bossapp.id",
      password: await hash("admin123", 10),
      role: "ADMIN",
      isVerified: true,
      phone: "089999999999",
    },
  });
  console.log("✅ Admin created");

  // ── 2. Subscription Plans ─────────────────────────────────────────────────

  await db.subscriptionPlan.create({
    data: {
      name: "Trial",
      code: "TRIAL",
      price: 0,
      durationDays: 14,
      isActive: true,
      isPopular: false,
      promo: "Coba gratis 14 hari, semua fitur Pro tersedia",
      features: {
        maxOutlets: 2,
        maxProducts: 100,
        maxStaff: 5,
        analytics: true,
        loyaltyProgram: true,
        multiOutlet: true,
        exportReport: false,
      },
    },
  });

  const planBasic = await db.subscriptionPlan.create({
    data: {
      name: "Basic",
      code: "BASIC",
      price: 0,
      durationDays: 30,
      isActive: true,
      isPopular: false,
      features: {
        maxOutlets: 1,
        maxProducts: 50,
        maxStaff: 2,
        analytics: false,
        loyaltyProgram: false,
        multiOutlet: false,
      },
    },
  });

  await db.subscriptionPlan.create({
    data: {
      name: "Pro",
      code: "PRO",
      price: 149_000,
      durationDays: 30,
      isActive: true,
      isPopular: true,
      promo: "Hemat 20% untuk 3 bulan pertama",
      features: {
        maxOutlets: 3,
        maxProducts: 500,
        maxStaff: 10,
        analytics: true,
        loyaltyProgram: true,
        multiOutlet: true,
        exportReport: true,
      },
    },
  });

  await db.subscriptionPlan.create({
    data: {
      name: "Enterprise",
      code: "ENTERPRISE",
      price: 349_000,
      durationDays: 30,
      isActive: true,
      isPopular: false,
      features: {
        maxOutlets: -1,
        maxProducts: -1,
        maxStaff: -1,
        analytics: true,
        loyaltyProgram: true,
        multiOutlet: true,
        exportReport: true,
        dedicatedSupport: true,
        customIntegration: true,
      },
    },
  });
  console.log("✅ Subscription plans created");

  // ── 3. Business ───────────────────────────────────────────────────────────

  const business = await db.business.create({
    data: {
      name: "Usaha Pak Budi",
      description: "Bisnis kuliner dan retail milik Pak Budi",
      ownerId: owner.id,
      subscriptionStatus: "ACTIVE",
      subscriptionPlan: planBasic.code,
      subscriptionStartDate: subDays(new Date(), 60),
    },
  });

  // Business subscription untuk Budi
  const businessSubscription = await db.businessSubscription.create({
    data: {
      businessId: business.id,
      planId: planBasic.id,
      status: "ACTIVE",
      startDate: subDays(new Date(), 60),
      endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      autoRenew: true,
    },
  });

  // Link ke currentSubscription
  await db.business.update({
    where: { id: business.id },
    data: { currentSubscriptionId: businessSubscription.id },
  });
  console.log("✅ Business & subscription created");

  // ── 4. Outlets ────────────────────────────────────────────────────────────

  const outletFnb = await db.outlet.create({
    data: {
      name: "Warung Makan Sederhana",
      slug: "warung-makan-sederhana",
      description: "Warung makan dengan masakan rumahan khas Padang",
      address: "Jl. Sudirman No. 12, Pekanbaru",
      phone: "0761-123456",
      email: "warung@bossapp.id",
      businessId: business.id,
      type: OutletType.FNB,
      isOpen: true,
      latitude: 0.5135,
      longitude: 101.4477,
    },
  });

  const outletRetail = await db.outlet.create({
    data: {
      name: "Toko Sembako Sejahtera",
      slug: "toko-sembako-sejahtera",
      description: "Toko kebutuhan sehari-hari lengkap dan terpercaya",
      address: "Jl. Imam Bonjol No. 45, Pekanbaru",
      phone: "0761-654321",
      email: "toko@bossapp.id",
      businessId: business.id,
      type: OutletType.RETAIL,
      isOpen: true,
      latitude: 0.5071,
      longitude: 101.4482,
    },
  });
  console.log("✅ Outlets created");

  // ── 4. Operating Hours ────────────────────────────────────────────────────

  const outlets = [outletFnb, outletRetail];
  for (const outlet of outlets) {
    for (let day = 0; day <= 6; day++) {
      const isFnb = outlet.id === outletFnb.id;
      const isClosed = !isFnb && day === 0; // retail tutup Minggu
      const openHour = isFnb ? 9 : 8;
      const closeHour = isFnb ? 21 : 18;

      const base = new Date("2000-01-01T00:00:00Z");
      await db.outletOperatingHours.create({
        data: {
          outletId: outlet.id,
          dayOfWeek: day,
          openTime: setHours(base, openHour),
          closeTime: setHours(base, closeHour),
          isOpen: !isClosed,
        },
      });
    }
  }
  console.log("✅ Operating hours created");

  // ── 5. Outlet Tables (FNB) ────────────────────────────────────────────────

  const tables = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      db.outletTable.create({
        data: {
          name: `Meja ${i + 1}`,
          capacity: i < 4 ? 2 : 4,
          status: TableStatus.AVAILABLE,
          outletId: outletFnb.id,
        },
      }),
    ),
  );
  console.log("✅ Tables created");

  // ── 6. Receipt Settings ───────────────────────────────────────────────────

  await db.receiptSetting.createMany({
    data: [
      {
        outletId: outletFnb.id,
        printWidth: 80,
        headerText:
          "Warung Makan Sederhana\nJl. Sudirman No. 12\nTerima kasih atas kunjungan Anda!",
        footerText: "Selamat makan!",
        showCashier: true,
        showCustomer: true,
      },
      {
        outletId: outletRetail.id,
        printWidth: 58,
        headerText: "Toko Sembako Sejahtera\nJl. Imam Bonjol No. 45",
        footerText: "Terima kasih, datang lagi ya!",
        showCashier: true,
        showCustomer: false,
      },
    ],
  });

  // ── 7. Staff ──────────────────────────────────────────────────────────────

  const staffFnb = await Promise.all([
    db.staff.create({
      data: {
        name: "Siti Rahayu",
        username: "siti@warung.id",
        pin: await hash("123456", 10),
        phone: "08112345001",
        outletId: outletFnb.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Andi Pratama",
        username: "andi@warung.id",
        pin: await hash("123456", 10),
        phone: "08112345002",
        outletId: outletFnb.id,
        status: StaffStatus.ACTIVE,
      },
    }),
  ]);

  const staffRetail = await Promise.all([
    db.staff.create({
      data: {
        name: "Dewi Lestari",
        username: "dewi@toko.id",
        pin: await hash("123456", 10),
        phone: "08112345003",
        outletId: outletRetail.id,
        status: StaffStatus.ACTIVE,
      },
    }),
    db.staff.create({
      data: {
        name: "Roni Susanto",
        username: "roni@toko.id",
        pin: await hash("123456", 10),
        phone: "08112345004",
        outletId: outletRetail.id,
        status: StaffStatus.ACTIVE,
      },
    }),
  ]);
  console.log("✅ Staff created");

  // ── 8. Loyalty Config ─────────────────────────────────────────────────────

  await db.loyaltyConfig.createMany({
    data: [
      {
        outletId: outletFnb.id,
        pointsEarned: 1,
        multiplierAmount: 10_000,
        minSpending: 20_000,
        pointValue: 100,
        isActive: true,
      },
      {
        outletId: outletRetail.id,
        pointsEarned: 1,
        multiplierAmount: 5_000,
        minSpending: 10_000,
        pointValue: 50,
        isActive: true,
      },
    ],
  });

  // ── 9. Products — FNB ─────────────────────────────────────────────────────

  const fnbProductsData = [
    {
      name: "Nasi Padang Komplit",
      hpp: 18_000,
      price: 38_000,
      unit: "porsi",
      stock: 0,
      tax: 11,
    },
    {
      name: "Ayam Goreng Kremes",
      hpp: 14_000,
      price: 32_000,
      unit: "porsi",
      stock: 0,
      tax: 11,
    },
    {
      name: "Ikan Bakar Bumbu Rujak",
      hpp: 22_000,
      price: 48_000,
      unit: "porsi",
      stock: 0,
      tax: 11,
    },
    {
      name: "Soto Ayam Lamongan",
      hpp: 10_000,
      price: 22_000,
      unit: "mangkuk",
      stock: 0,
      tax: 11,
    },
    {
      name: "Nasi Goreng Spesial",
      hpp: 12_000,
      price: 28_000,
      unit: "porsi",
      stock: 0,
      tax: 11,
    },
    {
      name: "Mie Goreng Jawa",
      hpp: 9_000,
      price: 22_000,
      unit: "porsi",
      stock: 0,
      tax: 11,
    },
    {
      name: "Tempe Mendoan",
      hpp: 4_000,
      price: 10_000,
      unit: "porsi",
      stock: 0,
      tax: 0,
    },
    {
      name: "Es Teh Manis",
      hpp: 2_500,
      price: 8_000,
      unit: "gelas",
      stock: 0,
      tax: 0,
    },
    {
      name: "Jus Alpukat",
      hpp: 8_000,
      price: 18_000,
      unit: "gelas",
      stock: 0,
      tax: 0,
    },
    {
      name: "Es Jeruk Peras",
      hpp: 5_000,
      price: 12_000,
      unit: "gelas",
      stock: 0,
      tax: 0,
    },
  ];

  const fnbProducts = await Promise.all(
    fnbProductsData.map(async (p) => {
      const product = await db.product.create({
        data: {
          name: p.name,
          type: ProductType.GOODS,
          status: ServiceStatus.ACTIVE,
          outletId: outletFnb.id,
          taxPercentage: p.tax,
        },
      });

      await db.productGoods.create({
        data: {
          productId: product.id,
          sellingPrice: p.price,
          averageHpp: p.hpp,
          currentStock: p.stock,
          unit: p.unit,
        },
      });

      return {
        product,
        goods: { sellingPrice: p.price, averageHpp: p.hpp, tax: p.tax },
      };
    }),
  );

  // ── 10. Products — Retail ─────────────────────────────────────────────────

  const retailProductsData = [
    {
      name: "Beras Premium 5kg",
      hpp: 62_000,
      price: 75_000,
      unit: "karung",
      stock: 50,
      tax: 0,
    },
    {
      name: "Minyak Goreng Bimoli 2L",
      hpp: 28_000,
      price: 35_000,
      unit: "botol",
      stock: 40,
      tax: 11,
    },
    {
      name: "Gula Pasir 1kg",
      hpp: 13_000,
      price: 16_000,
      unit: "kg",
      stock: 80,
      tax: 0,
    },
    {
      name: "Tepung Terigu Segitiga 1kg",
      hpp: 10_000,
      price: 13_500,
      unit: "kg",
      stock: 60,
      tax: 0,
    },
    {
      name: "Kopi Kapal Api Box",
      hpp: 22_000,
      price: 28_000,
      unit: "box",
      stock: 30,
      tax: 11,
    },
    {
      name: "Sabun Mandi Lifebuoy 4pcs",
      hpp: 16_000,
      price: 21_000,
      unit: "pack",
      stock: 45,
      tax: 11,
    },
    {
      name: "Sampo Sunsilk 170ml",
      hpp: 18_000,
      price: 24_000,
      unit: "botol",
      stock: 35,
      tax: 11,
    },
    {
      name: "Indomie Goreng Box",
      hpp: 28_000,
      price: 35_000,
      unit: "box",
      stock: 25,
      tax: 11,
    },
    {
      name: "Aqua Galon 19L",
      hpp: 18_000,
      price: 22_000,
      unit: "galon",
      stock: 15,
      tax: 0,
    },
    {
      name: "Snack Chitato 68g",
      hpp: 8_500,
      price: 12_000,
      unit: "pcs",
      stock: 70,
      tax: 11,
    },
  ];

  const retailProducts = await Promise.all(
    retailProductsData.map(async (p) => {
      const product = await db.product.create({
        data: {
          name: p.name,
          type: ProductType.GOODS,
          status: ServiceStatus.ACTIVE,
          outletId: outletRetail.id,
          taxPercentage: p.tax,
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

      return {
        product,
        goods: {
          id: goods.id,
          sellingPrice: p.price,
          averageHpp: p.hpp,
          tax: p.tax,
        },
      };
    }),
  );
  console.log("✅ Products created");

  // ── 11. Guest Customers ───────────────────────────────────────────────────

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
    customersData.map((c) => db.guestCustomer.create({ data: c })),
  );

  // Memberships per outlet
  for (const customer of customers) {
    for (const outlet of outlets) {
      await db.outletMembership.create({
        data: {
          guestCustomerId: customer.id,
          outletId: outlet.id,
          totalPoints: rand(0, 250),
          totalSpending: rand(50_000, 2_000_000),
          status: "ACTIVE",
        },
      });
    }
  }
  console.log("✅ Customers & memberships created");

  // ── 12. Expenses ──────────────────────────────────────────────────────────

  const fnbExpenses = [
    { description: "Sewa tempat", amount: 4_000_000 },
    { description: "Gaji karyawan", amount: 3_200_000 },
    { description: "Listrik & air", amount: 650_000 },
    { description: "Gas LPG 12kg x4", amount: 840_000 },
    { description: "Perlengkapan kebersihan", amount: 185_000 },
    { description: "Biaya pemasaran online", amount: 250_000 },
    { description: "Servis peralatan dapur", amount: 150_000 },
  ];

  const retailExpenses = [
    { description: "Sewa tempat", amount: 2_500_000 },
    { description: "Gaji karyawan", amount: 2_400_000 },
    { description: "Listrik", amount: 400_000 },
    { description: "Plastik & perlengkapan toko", amount: 220_000 },
    { description: "Ongkir pembelian barang", amount: 350_000 },
    { description: "Biaya aplikasi POS", amount: 99_000 },
  ];

  for (const expense of fnbExpenses) {
    await db.expense.create({
      data: {
        ...expense,
        cashier: "Owner",
        date: randomDate(rand(1, 180)),
        outletId: outletFnb.id,
      },
    });
  }

  for (const expense of retailExpenses) {
    await db.expense.create({
      data: {
        ...expense,
        cashier: "Owner",
        date: randomDate(rand(1, 180)),
        outletId: outletRetail.id,
      },
    });
  }
  console.log("✅ Expenses created");

  // ── 13. Orders — FNB ─────────────────────────────────────────────────────

  console.log("⏳ Creating FNB orders...");

  const paymentMethods: ManualPaymentType[] = [
    ManualPaymentType.CASH,
    ManualPaymentType.QRIS_OFFLINE,
    ManualPaymentType.OWNER_TRANSFER,
  ];

  const orderStatusWeights: {
    status: OrderStatus;
    payStatus: PaymentStatus;
    weight: number;
  }[] = [
    {
      status: OrderStatus.COMPLETED,
      payStatus: PaymentStatus.SUCCESS,
      weight: 75,
    },
    {
      status: OrderStatus.PROCESSING,
      payStatus: PaymentStatus.PENDING,
      weight: 8,
    },
    {
      status: OrderStatus.CONFIRMED,
      payStatus: PaymentStatus.PENDING,
      weight: 7,
    },
    {
      status: OrderStatus.CANCELLED,
      payStatus: PaymentStatus.CANCELLED,
      weight: 5,
    },
    {
      status: OrderStatus.AWAITING_PAYMENT,
      payStatus: PaymentStatus.PENDING,
      weight: 5,
    },
  ];

  function pickOrderStatus() {
    const total = orderStatusWeights.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * total;
    for (const w of orderStatusWeights) {
      r -= w.weight;
      if (r <= 0) return w;
    }
    return orderStatusWeights[0];
  }

  for (let i = 0; i < 130; i++) {
    const customer = pick(customers);
    const staff = pick(staffFnb);
    const { status, payStatus } = pickOrderStatus();
    const orderDate = randomDate(180);
    const itemCount = rand(1, 4);

    // Pick random products
    const selectedProducts = [...fnbProducts]
      .sort(() => Math.random() - 0.5)
      .slice(0, itemCount);

    let subtotal = 0;
    const orderItems = selectedProducts.map((p) => {
      const qty = rand(1, 3);
      const price = p.goods.sellingPrice;
      const hpp = p.goods.averageHpp;
      subtotal += price * qty;
      return {
        productId: p.product.id,
        quantity: qty,
        price,
        hpp,
        tax: p.goods.tax,
      };
    });

    const taxAmount = orderItems.reduce((sum, item) => {
      return sum + Math.round(item.price * item.quantity * (item.tax / 100));
    }, 0);
    const totalAmount = subtotal + taxAmount;

    // Bill & table for dine-in (60% orders)
    const isDineIn = Math.random() < 0.6 && status === OrderStatus.COMPLETED;
    let billId: string | undefined;
    let tableId: string | undefined;

    if (isDineIn) {
      const table = pick(tables);
      const bill = await db.bill.create({
        data: {
          outletId: outletFnb.id,
          tableId: table.id,
          status: BillStatus.PAID,
          total: totalAmount,
          closedAt: orderDate,
        },
      });
      billId = bill.id;
      tableId = table.id;
    }

    const order = await db.order.create({
      data: {
        outletId: outletFnb.id,
        guestCustomerId: customer.id,
        handledByStaffId: staff.id,
        totalAmount,
        taxAmount,
        orderStatus: status,
        paymentStatus: payStatus,
        customerType: CustomerType.GUEST,
        tableId: tableId ?? null,
        billId: billId ?? null,
        tableNumber: isDineIn ? `Meja ${rand(1, 8)}` : null,
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

    if (status === OrderStatus.COMPLETED) {
      await db.transaction.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          status: PaymentStatus.SUCCESS,
          isManual: true,
          manualMethod: pick(paymentMethods),
          verifiedAt: orderDate,
          verifiedById: owner.id,
        },
      });

      // Loyalty points
      const points = Math.floor(totalAmount / 10_000);
      if (points > 0) {
        await db.loyaltyPointHistory.create({
          data: {
            outletId: outletFnb.id,
            guestCustomerId: customer.id,
            orderId: order.id,
            type: LoyaltyPointHistoryType.EARN,
            points,
            note: "Poin dari transaksi",
          },
        });
      }
    }
  }
  console.log("✅ FNB orders created");

  // ── 14. Orders — Retail ───────────────────────────────────────────────────

  console.log("⏳ Creating Retail orders...");

  for (let i = 0; i < 120; i++) {
    const customer = pick(customers);
    const staff = pick(staffRetail);
    const { status, payStatus } = pickOrderStatus();
    const orderDate = randomDate(180);
    const itemCount = rand(1, 5);

    const selectedProducts = [...retailProducts]
      .sort(() => Math.random() - 0.5)
      .slice(0, itemCount);

    let subtotal = 0;
    const orderItems = selectedProducts.map((p) => {
      const qty = rand(1, 4);
      const price = p.goods.sellingPrice;
      const hpp = p.goods.averageHpp;
      subtotal += price * qty;
      return {
        productId: p.product.id,
        goodsId: p.goods.id,
        quantity: qty,
        price,
        hpp,
        tax: p.goods.tax,
      };
    });

    const taxAmount = orderItems.reduce((sum, item) => {
      return sum + Math.round(item.price * item.quantity * (item.tax / 100));
    }, 0);
    const totalAmount = subtotal + taxAmount;

    const order = await db.order.create({
      data: {
        outletId: outletRetail.id,
        guestCustomerId: customer.id,
        handledByStaffId: staff.id,
        totalAmount,
        taxAmount,
        orderStatus: status,
        paymentStatus: payStatus,
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

    if (status === OrderStatus.COMPLETED) {
      await db.transaction.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          status: PaymentStatus.SUCCESS,
          isManual: true,
          manualMethod: pick(paymentMethods),
          verifiedAt: orderDate,
          verifiedById: owner.id,
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
            outletId: outletRetail.id,
            guestCustomerId: customer.id,
            orderId: order.id,
            type: LoyaltyPointHistoryType.EARN,
            points,
            note: "Poin dari transaksi",
          },
        });
      }
    }
  }
  console.log("✅ Retail orders created");

  console.log("\n🎉 Seeding completed!");
  console.log("─────────────────────────────────");
  console.log(`📧 Owner email : budi@bossapp.id`);
  console.log(`🔑 Password    : password123`);
  console.log(`📧 Admin email : admin@bossapp.id`);
  console.log(`🔑 Password    : admin123`);
  console.log(`🏪 FNB Outlet  : /warung-makan-sederhana`);
  console.log(`🏪 Retail Outlet: /toko-sembako-sejahtera`);
  console.log("─────────────────────────────────");
}

// ─── Clean ────────────────────────────────────────────────────────────────────

async function cleanDatabase() {
  console.log("🧹 Cleaning database...");

  // Hapus dalam urutan yang aman (respek foreign key)
  await db.loyaltyPointHistory.deleteMany();
  await db.membership.deleteMany();
  await db.stockLog.deleteMany();
  await db.transaction.deleteMany();
  await db.bookingSlot.deleteMany();
  await db.ticketCode.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.bill.deleteMany();
  await db.outletMembership.deleteMany();
  await db.productGoods.deleteMany();
  await db.productService.deleteMany();
  await db.productTicket.deleteMany();
  await db.productMedia.deleteMany();
  await db.product.deleteMany();
  await db.expense.deleteMany();
  await db.loyaltyConfig.deleteMany();
  await db.receiptSetting.deleteMany();
  await db.outletOperatingHours.deleteMany();
  await db.outletTable.deleteMany();
  await db.outletTransferRequest.deleteMany();
  await db.staff.deleteMany();
  await db.guestCustomer.deleteMany();
  await db.outlet.deleteMany();
  await db.pushSubscription.deleteMany();
  await db.businessSubscription.deleteMany();
  await db.subscriptionInvoice.deleteMany();
  await db.banner.deleteMany();
  await db.business.deleteMany();
  await db.subscriptionPlan.deleteMany();
  await db.user.deleteMany();
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
