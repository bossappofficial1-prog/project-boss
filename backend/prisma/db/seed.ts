const {
  PrismaClient,
  ProductType,
  UserRole,
  ServiceStatus,
  SubscriptionStatus,
} = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

const forceReseed = process.argv.includes("--force") || process.argv.includes("-f");

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

  if (forceReseed) {
    console.log("⚡ FORCE RESEED MODE: Clearing all existing data!");
    console.log("🗑️  Cleaning existing data...");
    await prisma.productImage.deleteMany({});
    await prisma.stockLog.deleteMany({}); // Added cleanup for StockLog
    await prisma.productGoods.deleteMany({}); // Added cleanup
    await prisma.productService.deleteMany({}); // Added cleanup
    await prisma.product.deleteMany({});
    await prisma.outletOperatingHours.deleteMany({});
    await prisma.outlet.deleteMany({});
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

  // --- 5. Create Products ---
  console.log("📦 Creating products with guaranteed images...");

  const productTemplates = {
    coffee: [
      {
        name: "Iced Americano",
        desc: "Espresso shot dengan air dingin dan es batu.",
        cost: 5000,
        price: 15000,
        type: ProductType.GOODS,
        unit: "cup",
        images: [
          "https://picsum.photos/seed/americano1/800",
          "https://picsum.photos/seed/americano2/800",
          "https://picsum.photos/seed/americano3/800",
        ],
      },
      {
        name: "Hot Cappuccino",
        desc: "Perpaduan espresso, susu panas, dan busa susu tebal.",
        cost: 7000,
        price: 20000,
        type: ProductType.GOODS,
        unit: "cup",
        images: [
          "https://picsum.photos/seed/cappuccino1/800",
          "https://picsum.photos/seed/cappuccino2/800",
          "https://picsum.photos/seed/cappuccino3/800",
        ],
      },
      {
        name: "Barista Training",
        desc: "Kelas intensif 2 jam untuk mempelajari dasar kopi.",
        cost: 50000,
        price: 250000,
        type: ProductType.SERVICE,
        duration: 120,
        images: [
          "https://picsum.photos/seed/barista1/800",
          "https://picsum.photos/seed/barista2/800",
        ],
      },
    ],
    food: [
      {
        name: "Nasi Goreng Spesial",
        desc: "Nasi goreng dengan campuran ayam, udang, dan telur.",
        cost: 10000,
        price: 35000,
        type: ProductType.GOODS,
        unit: "porsi",
        images: [
          "https://picsum.photos/seed/nasgor1/800",
          "https://picsum.photos/seed/nasgor2/800",
          "https://picsum.photos/seed/nasgor3/800",
        ],
      },
      {
        name: "Sate Ayam Madura",
        desc: "10 tusuk sate ayam dengan bumbu kacang.",
        cost: 15000,
        price: 40000,
        type: ProductType.GOODS,
        unit: "porsi",
        images: ["https://picsum.photos/seed/sate1/800", "https://picsum.photos/seed/sate2/800"],
      },
      {
        name: "Event Catering Package",
        desc: "Paket katering lengkap untuk acara Anda.",
        cost: 100000,
        price: 500000,
        type: ProductType.SERVICE,
        duration: 300,
        images: [
          "https://picsum.photos/seed/catering1/800",
          "https://picsum.photos/seed/catering2/800",
        ],
      },
    ],
    beauty: [
      {
        name: "Hair Cut & Wash",
        desc: "Layanan potong rambut, termasuk cuci dan pengeringan.",
        cost: 20000,
        price: 75000,
        type: ProductType.SERVICE,
        duration: 60,
        images: [
          "https://picsum.photos/seed/haircut1/800",
          "https://picsum.photos/seed/haircut2/800",
          "https://picsum.photos/seed/haircut3/800",
        ],
      },
      {
        name: "Manicure & Pedicure Gel",
        desc: "Perawatan kuku tangan dan kaki dengan kutek gel.",
        cost: 50000,
        price: 180000,
        type: ProductType.SERVICE,
        duration: 90,
        images: ["https://picsum.photos/seed/mani1/800", "https://picsum.photos/seed/mani2/800"],
      },
      {
        name: "Hydrating Face Serum",
        desc: "Serum wajah yang melembabkan kulit.",
        cost: 40000,
        price: 150000,
        type: ProductType.GOODS,
        unit: "botol",
        images: ["https://picsum.photos/seed/serum1/800", "https://picsum.photos/seed/serum2/800"],
      },
    ],
    electronics: [
      {
        name: "Smartphone Screen Repair",
        desc: "Layanan penggantian layar retak smartphone.",
        cost: 150000,
        price: 500000,
        type: ProductType.SERVICE,
        duration: 120,
        images: [
          "https://picsum.photos/seed/repair1/800",
          "https://picsum.photos/seed/repair2/800",
        ],
      },
      {
        name: "Wireless Headphones",
        desc: "Headphone nirkabel dengan noise-cancellation.",
        cost: 250000,
        price: 600000,
        type: ProductType.GOODS,
        unit: "pcs",
        images: [
          "https://picsum.photos/seed/headphone1/800",
          "https://picsum.photos/seed/headphone2/800",
          "https://picsum.photos/seed/headphone3/800",
        ],
      },
    ],
    laundry: [
      {
        name: "Wash & Fold (per kg)",
        desc: "Layanan cuci dan lipat pakaian harian.",
        cost: 4000,
        price: 10000,
        type: ProductType.SERVICE,
        duration: 180,
        unit: "kg",
        images: [
          "https://picsum.photos/seed/laundry1/800",
          "https://picsum.photos/seed/laundry2/800",
        ],
      },
      {
        name: "Premium Suit Dry Cleaning",
        desc: "Layanan cuci kering khusus untuk setelan jas.",
        cost: 20000,
        price: 50000,
        type: ProductType.SERVICE,
        duration: 240,
        unit: "pcs",
        images: [
          "https://picsum.photos/seed/dryclean1/800",
          "https://picsum.photos/seed/dryclean2/800",
        ],
      },
      {
        name: "Gentle Fabric Softener",
        desc: "Pelembut pakaian premium untuk kulit sensitif.",
        cost: 15000,
        price: 45000,
        type: ProductType.GOODS,
        unit: "botol",
        images: [
          "https://picsum.photos/seed/softener1/800",
          "https://picsum.photos/seed/softener2/800",
        ],
      },
    ],
  };

  for (let i = 0; i < outlets.length; i++) {
    const outlet = outlets[i];
    const business = businesses.find((b) => b.id === outlet.businessId);
    if (!business) continue;

    const businessType = businessTypes[i % businessTypes.length];
    const templates = productTemplates[businessType as keyof typeof productTemplates];

    for (const template of templates) {
      const productData: any = {
        name: template.name,
        description: template.desc,
        type: template.type,
        status: ServiceStatus.ACTIVE,
        outletId: outlet.id,
      };

      if (template.type === ProductType.GOODS) {
        productData.goods = {
          create: {
            currentStock: Math.floor(Math.random() * 50) + 10,
            unit: template.unit || "pcs",
            sellingPrice: template.price,
            averageHpp: template.cost || template.price * 0.7,
            minStock: 5,
          },
        };
      } else if (template.type === ProductType.SERVICE) {
        productData.service = {
          create: {
            durationMinutes: template.duration || 60,
            sellingPrice: template.price,
            providerName: "Staff " + outlet.name,
            commissionType: "PERCENTAGE",
            commissionValue: 10,
            maxParallel: 2,
          },
        };
      }

      const createdProduct = await prisma.product.create({
        data: productData,
      });

      const imagesToCreate = template.images.map((imageUrl, index) => ({
        productId: createdProduct.id,
        url: imageUrl,
        alt: `${template.name} image ${index + 1}`,
        order: index,
      }));

      if (imagesToCreate.length) {
        await prisma.productImage.createMany({ data: imagesToCreate });
      }
    }
  }
  console.log("✅ Products with guaranteed images created.");

  // --- 6. Summary ---
  console.log("\n📊 SEEDING SUMMARY:");
  const counts = await prisma.$transaction([
    prisma.user.count(),
    prisma.business.count(),
    prisma.outlet.count(),
    prisma.product.count(),
    prisma.productImage.count(),
  ]);
  console.log(`👥 Users: ${counts[0]}`);
  console.log(`🏢 Businesses: ${counts[1]}`);
  console.log(`🏪 Outlets: ${counts[2]}`);
  console.log(`📦 Products: ${counts[3]}`);
  console.log(`🖼️  Product Images: ${counts[4]}`);
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
