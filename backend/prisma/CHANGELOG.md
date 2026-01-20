# Prisma Schema Changelog

## [2026-01-20] - Major Schema Refactoring

### 🎯 Tujuan Refactoring

Refactoring ini bertujuan untuk:

1. **Menambahkan sistem subscription** untuk business owners
2. **Implementasi subtable pattern** untuk produk (GOODS vs SERVICE) dengan tracking stok yang lebih detail
3. **Simplifikasi model Staff** - hanya untuk kasir
4. **Penghapusan model yang tidak digunakan** untuk mempermudah maintenance

---

## 📊 Perubahan Struktur Data

### ✅ Model Baru

#### 1. **ProductGoods** (Subtable untuk Produk Barang)

```prisma
model ProductGoods {
  id           String
  productId    String @unique
  currentStock Int
  minStock     Int?
  unit         String
  averageHpp   Float
  sellingPrice Float
  stockLogs    StockLog[]
}
```

**Fungsi:**

- Menyimpan informasi khusus untuk produk tipe GOODS
- Tracking stok real-time dengan `currentStock`
- Alert low stock dengan `minStock`
- Perhitungan HPP (Harga Pokok Penjualan) otomatis via `averageHpp`
- Unit satuan (Pcs, Kg, Box, Liter, dll)

**Relasi:**

- One-to-one dengan `Product` (parent)
- One-to-many dengan `StockLog`

---

#### 2. **ProductService** (Subtable untuk Produk Jasa)

```prisma
model ProductService {
  id              String
  productId       String @unique
  durationMinutes Int
  sellingPrice    Float
  providerName    String
  providerPhone   String?
  providerEmail   String?
  commissionType  String
  commissionValue Float
  maxParallel     Int
  bookingSlots    BookingSlot[]
}
```

**Fungsi:**

- Menyimpan informasi khusus untuk produk tipe SERVICE
- Durasi layanan dalam menit
- Informasi penyedia jasa (provider)
- Sistem komisi untuk provider (PERCENTAGE atau FIXED)
- Kapasitas paralel service

**Relasi:**

- One-to-one dengan `Product` (parent)
- One-to-many dengan `BookingSlot`

---

#### 3. **StockLog** (Logging Pergerakan Stok)

```prisma
model StockLog {
  id             String
  type           StockMovementType  // IN, OUT, ADJUSTMENT, RETURN
  quantity       Int
  hppPerUnit     Float?
  referenceType  String?  // "ORDER", "PURCHASE", "MANUAL", etc.
  referenceId    String?
  notes          String?
  productGoodsId String
}
```

**Fungsi:**

- Mencatat setiap pergerakan stok (masuk/keluar)
- Menyimpan HPP per unit saat barang masuk
- Reference ke transaksi yang trigger movement (order, purchase, dll)
- Audit trail untuk inventory

**Jenis Movement:**

- `IN`: Barang masuk (pembelian/restok)
- `OUT`: Barang keluar (via order)
- `ADJUSTMENT`: Koreksi stok manual
- `RETURN`: Retur barang

**Perhitungan HPP:**
HPP rata-rata dihitung dengan weighted average dari semua stock movement tipe IN:

```
averageHpp = Σ(hppPerUnit × quantity) / Σ(quantity)
```

---

### 🔄 Model yang Dimodifikasi

#### 1. **Business** - Penambahan Subscription

**Perubahan:**

```diff
model Business {
  id          String
  name        String
  description String?
+
+ // === SUBSCRIPTION ===
+ subscriptionStatus    SubscriptionStatus
+ subscriptionStartDate DateTime
+ subscriptionEndDate   DateTime?
+ subscriptionPlan      String
}
```

**Field Baru:**

- `subscriptionStatus`: Status langganan (ACTIVE, EXPIRED, SUSPENDED, CANCELLED)
- `subscriptionStartDate`: Tanggal mulai subscription
- `subscriptionEndDate`: Tanggal akhir (null = unlimited/lifetime)
- `subscriptionPlan`: Nama paket (contoh: "BASIC", "PRO", "ENTERPRISE")

**Logika Bisnis:**

- Default status: `ACTIVE`
- Default plan: `"BASIC"`
- Jika `subscriptionEndDate` null = unlimited access
- Jika `subscriptionStatus != ACTIVE`, owner tidak bisa akses fitur premium

---

#### 2. **Product** - Refactoring ke Polymorphic Pattern

**Sebelum:**

```prisma
model Product {
  id          String
  name        String
  price       Float
  stock       Int?
  category    String
  // ... mixed fields untuk goods dan service
}
```

**Sesudah:**

```prisma
model Product {
  id          String
  name        String
  description String?
  type        ProductType  // GOODS atau SERVICE
  status      ServiceStatus

  // Subtables (one-to-one polymorphic)
  goods       ProductGoods?
  service     ProductService?

  // Shared relations
  productImages ProductImage[]
  orderItems    OrderItem[]
}
```

**Keuntungan:**

1. **Separation of Concerns**: Field khusus GOODS vs SERVICE terpisah
2. **Type Safety**: Lebih mudah validasi di application layer
3. **Scalability**: Mudah extend field per tipe tanpa affect tipe lain
4. **Query Performance**: Tidak perlu fetch field yang tidak relevan

**Migration Logic:**
Untuk setiap produk existing:

1. Jika produk adalah barang → create `ProductGoods` entry
2. Jika produk adalah jasa → create `ProductService` entry
3. Migrate field `price` sesuai context
4. Migrate field `stock` (jika ada) ke `ProductGoods.currentStock`

---

#### 3. **Staff** - Simplifikasi ke Kasir Saja

**Sebelum:**

```prisma
model Staff {
  id       String
  name     String
  role     StaffRole  // KASIR, ADMIN, MANAGER, WORKER
  // ... banyak field untuk berbagai role
}
```

**Sesudah:**

```prisma
model Staff {
  id       String
  name     String
  phone    String?
  email    String? @unique
  password String  // Hash untuk login POS kasir
  status   StaffStatus

  ordersHandled Order[]
}
```

**Perubahan:**

- Hapus field `role` - hanya untuk kasir
- Tambah `password` - untuk login ke POS system
- Tambah `status` - ACTIVE, INACTIVE, ON_LEAVE
- Relasi `ordersHandled` - pesanan yang di-handle kasir ini

**Rasionale:**

- Sistem tidak memerlukan worker tracking lagi
- Admin/Manager sudah handled by model `User`
- Fokus ke POS cashier functionality

---

### ❌ Model yang Dihapus

#### 1. **Wallet**

**Alasan:**

- Tidak digunakan dalam flow bisnis saat ini
- Payment langsung via Midtrans → Business Bank Account
- Tidak ada kebutuhan internal wallet system

#### 2. **Withdrawal**

**Alasan:**

- Terkait dengan Wallet yang sudah dihapus
- Payout dilakukan manual oleh admin, tidak through system

#### 3. **Membership**

**Alasan:**

- Customer model disederhanakan menjadi `GuestCustomer` only
- Tidak ada registered user/membership program

#### 4. **Promo**

**Alasan:**

- Feature promo/discount belum menjadi prioritas
- Bisa ditambahkan kembali di future iteration

---

## 🔑 Enum Baru

### SubscriptionStatus

```prisma
enum SubscriptionStatus {
  ACTIVE      // Subscription aktif
  EXPIRED     // Sudah melewati subscriptionEndDate
  SUSPENDED   // Ditangguhkan sementara (misal: payment issue)
  CANCELLED   // Dibatalkan oleh owner/admin
}
```

### StockMovementType

```prisma
enum StockMovementType {
  IN          // Barang masuk (pembelian/restok)
  OUT         // Barang keluar (via order)
  ADJUSTMENT  // Koreksi stok manual
  RETURN      // Retur barang
}
```

---

## 🔄 Perubahan Relasi Database

### Product → ProductGoods/ProductService (1:1)

**Sebelum:**

```
Product (mixed fields)
```

**Sesudah:**

```
Product (parent - minimal fields)
  ├─ ProductGoods (1:1, optional)
  │    └─ StockLog[] (1:N)
  └─ ProductService (1:1, optional)
       └─ BookingSlot[] (1:N)
```

**Constraint:**

- Setiap `Product` HARUS punya SALAH SATU: `ProductGoods` ATAU `ProductService`
- Ditentukan oleh field `Product.type`

---

### Business → Subscription Fields (Embedded)

**Sebelum:**

```
Business (tanpa subscription tracking)
```

**Sesudah:**

```
Business
  ├─ subscriptionStatus
  ├─ subscriptionStartDate
  ├─ subscriptionEndDate
  └─ subscriptionPlan
```

**Query Pattern:**

```typescript
// Check if business has active subscription
const business = await prisma.business.findUnique({
  where: { id: businessId },
  select: {
    subscriptionStatus: true,
    subscriptionEndDate: true,
  },
});

const isActive =
  business.subscriptionStatus === "ACTIVE" &&
  (business.subscriptionEndDate === null || business.subscriptionEndDate > new Date());
```

---

## 📋 Migration Checklist

### Pre-Migration

- [ ] Backup database lengkap
- [ ] Export data dari model yang akan dihapus (Wallet, Withdrawal, Membership, Promo)
- [ ] Identifikasi produk existing: mana yang GOODS vs SERVICE

### Migration Steps

#### Step 1: Create New Tables

```bash
# Generate migration untuk ProductGoods, ProductService, StockLog
npx prisma migrate dev --name add_product_subtables
```

#### Step 2: Data Migration - Product Split

```sql
-- Untuk setiap product existing, tentukan tipe dan migrate
-- Contoh: Jika product adalah GOODS
INSERT INTO "ProductGoods" (id, productId, currentStock, unit, sellingPrice, averageHpp)
SELECT
  gen_random_uuid(),
  p.id,
  COALESCE(p.stock, 0),  -- dari old field
  COALESCE(p.unit, 'Pcs'),
  p.price,
  p.price * 0.7  -- estimasi HPP
FROM "Product" p
WHERE p.category IN ('Barang', 'Goods');  -- sesuaikan logic

-- Untuk SERVICE
INSERT INTO "ProductService" (id, productId, durationMinutes, sellingPrice, providerName, commissionType, commissionValue, maxParallel)
SELECT
  gen_random_uuid(),
  p.id,
  60,  -- default 60 menit
  p.price,
  'Default Provider',
  'PERCENTAGE',
  0,
  1
FROM "Product" p
WHERE p.category IN ('Service', 'Jasa');  -- sesuaikan logic
```

#### Step 3: Add Subscription to Business

```sql
-- Set default subscription untuk semua business existing
UPDATE "Business"
SET
  subscriptionStatus = 'ACTIVE',
  subscriptionStartDate = NOW(),
  subscriptionEndDate = NULL,  -- unlimited
  subscriptionPlan = 'BASIC';
```

#### Step 4: Clean Up Old Models

```bash
# Drop Wallet, Withdrawal, Membership, Promo tables
npx prisma migrate dev --name remove_unused_models
```

#### Step 5: Staff Simplification

```sql
-- Keep only KASIR staff, remove others
DELETE FROM "Staff" WHERE role != 'KASIR';

-- Add default password for existing cashiers
UPDATE "Staff"
SET
  password = '$2a$10$...',  -- bcrypt hash untuk default password
  status = 'ACTIVE';
```

### Post-Migration

- [ ] Verify data integrity
- [ ] Test product queries (GOODS vs SERVICE)
- [ ] Test subscription status checks
- [ ] Update application code untuk new schema
- [ ] Run integration tests

---

## 🚀 Application Code Changes Required

### 1. Product Creation

**Sebelum:**

```typescript
await prisma.product.create({
  data: {
    name: "Product A",
    price: 10000,
    stock: 100,
    category: "Goods",
  },
});
```

**Sesudah:**

```typescript
// Untuk GOODS
await prisma.product.create({
  data: {
    name: "Product A",
    type: "GOODS",
    outletId: "...",
    goods: {
      create: {
        currentStock: 100,
        unit: "Pcs",
        sellingPrice: 10000,
        averageHpp: 7000,
        minStock: 10,
      },
    },
  },
});

// Untuk SERVICE
await prisma.product.create({
  data: {
    name: "Service A",
    type: "SERVICE",
    outletId: "...",
    service: {
      create: {
        durationMinutes: 60,
        sellingPrice: 50000,
        providerName: "John Doe",
        commissionType: "PERCENTAGE",
        commissionValue: 20,
        maxParallel: 1,
      },
    },
  },
});
```

---

### 2. Stock Movement (Barang Masuk)

```typescript
// Saat restok barang
await prisma.$transaction([
  // 1. Tambah stock log
  prisma.stockLog.create({
    data: {
      productGoodsId: goodsId,
      type: "IN",
      quantity: 50,
      hppPerUnit: 7500, // HPP dari supplier
      referenceType: "PURCHASE",
      referenceId: purchaseOrderId,
      notes: "Restok dari supplier X",
    },
  }),

  // 2. Update current stock
  prisma.productGoods.update({
    where: { id: goodsId },
    data: {
      currentStock: {
        increment: 50,
      },
    },
  }),

  // 3. Recalculate average HPP
  // Query all IN logs, calculate weighted average
]);
```

---

### 3. Subscription Check Middleware

```typescript
export const checkActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  const businessId = req.user.businessId;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      subscriptionStatus: true,
      subscriptionEndDate: true,
    },
  });

  // Check if expired
  if (business.subscriptionEndDate && business.subscriptionEndDate < new Date()) {
    return res.status(403).json({
      error: "Subscription expired",
    });
  }

  // Check if active
  if (business.subscriptionStatus !== "ACTIVE") {
    return res.status(403).json({
      error: "Subscription not active",
    });
  }

  next();
};
```

---

### 4. Query Products with Type

```typescript
// Get all GOODS products
const goodsProducts = await prisma.product.findMany({
  where: {
    type: "GOODS",
    outletId: outletId,
  },
  include: {
    goods: true, // Include goods-specific fields
    productImages: true,
  },
});

// Get all SERVICE products
const serviceProducts = await prisma.product.findMany({
  where: {
    type: "SERVICE",
    outletId: outletId,
  },
  include: {
    service: true, // Include service-specific fields
    productImages: true,
  },
});
```

---

## 📊 Query Performance Considerations

### Indexes Added

```prisma
// ProductGoods
@@index([productId])
@@index([currentStock])  // For low stock queries

// StockLog
@@index([productGoodsId])
@@index([type])
@@index([createdAt])
@@index([referenceType, referenceId])

// Business
@@index([subscriptionStatus])
```

### Optimized Queries

**Bad (N+1 Query):**

```typescript
const products = await prisma.product.findMany();
for (const product of products) {
  if (product.type === "GOODS") {
    const goods = await prisma.productGoods.findUnique({
      where: { productId: product.id },
    });
  }
}
```

**Good (Single Query with Include):**

```typescript
const products = await prisma.product.findMany({
  include: {
    goods: true,
    service: true,
  },
});
```

---

## 🔐 Data Integrity Rules

### 1. Product Type Consistency

```typescript
// Enforce: GOODS product MUST have ProductGoods
// Enforce: SERVICE product MUST have ProductService
// Implement in application layer or database triggers
```

### 2. Stock Log Validation

```typescript
// Enforce: type=OUT quantity should be negative or handled properly
// Enforce: type=IN must have hppPerUnit
// Enforce: productGoodsId must exist
```

### 3. Subscription Validation

```typescript
// Enforce: subscriptionEndDate >= subscriptionStartDate
// Enforce: If status=EXPIRED, endDate must be in past
```

---

## 📝 Breaking Changes Summary

| Area               | Breaking Change                       | Impact                                    |
| ------------------ | ------------------------------------- | ----------------------------------------- |
| **Product Model**  | Split ke ProductGoods/ProductService  | HIGH - Perlu update semua product queries |
| **Staff Model**    | Remove role field                     | MEDIUM - Update staff creation/management |
| **Removed Models** | Wallet, Withdrawal, Membership, Promo | LOW - Features belum aktif                |
| **Business Model** | Add subscription fields               | MEDIUM - Add middleware check             |

---

## 🎯 Next Steps

1. **Backend API Updates**
   - Update product endpoints (create, update, query)
   - Add subscription check middleware
   - Implement stock movement endpoints
   - Add HPP calculation service

2. **Frontend Updates**
   - Update product form (split GOODS vs SERVICE)
   - Add subscription status display
   - Add stock management UI
   - Add low stock alerts

3. **Testing**
   - Unit tests for new models
   - Integration tests for product split
   - E2E tests untuk subscription flow
   - Performance testing untuk stock queries

4. **Documentation**
   - API documentation update
   - User guide untuk stock management
   - Admin guide untuk subscription management

---

## 📞 Support

Jika ada pertanyaan terkait migration ini:

- Check existing data sebelum migrate
- Test di development environment dulu
- Siapkan rollback plan
- Backup data sebelum production migration

---

**Last Updated:** 2026-01-20  
**Schema Version:** 2.0  
**Prisma Version:** 7.x
