# Feature Spec: Outlet Type System — Semua Type
> Berdasarkan audit branch `develop`. Dokumen ini hanya mencakup yang **belum ada atau perlu diperbaiki**.

---

## 1. Feature Matrix per Type

| Fitur | RETAIL | SERVICE | FNB | EVENT | CUSTOM |
|---|:---:|:---:|:---:|:---:|:---:|
| POS Kasir | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pesanan Barang | ✅ | ❌ | ✅ | ❌ | ✅ |
| Antrian / Queue | ❌ | ✅ | ✅ | ❌ | ✅ |
| Stok Produk | ✅ | ❌ | ✅ | ❌ | ✅ |
| Manajemen Meja | ❌ | ❌ | ✅ | ❌ | ✅ |
| Kitchen Display | ❌ | ❌ | ✅ | ❌ | ❌ |
| Bill System | ❌ | ❌ | ✅ | ❌ | ❌ |
| Self-Order QR | ❌ | ❌ | ✅ | ❌ | ❌ |
| Booking Jadwal | ❌ | ✅ | ❌ | ❌ | ✅ |
| Scan Tiket | ❌ | ❌ | ❌ | ✅ | ✅ |
| Loyalty & Poin | ✅ | ✅ | ✅ | ❌ | ✅ |
| Data Pelanggan | ✅ | ✅ | ✅ | ❌ | ✅ |
| Barcode Scan POS | ✅ | ❌ | ✅ | ❌ | ✅ |
| Booking Reminder | ❌ | ✅ | ❌ | ❌ | ✅ |
| Resend Tiket | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 2. Perbaikan Gating yang Sudah Ada

### Owner Sidebar (`sidebar.ts`)

Beberapa item sekarang muncul untuk semua type padahal seharusnya tidak.
Perlu tambah `requiredTypes` ke item-item berikut:

```ts
// Manajemen Pelanggan
{ id: "customers", name: "Data Pelanggan", ...
  requiredTypes: [OutletType.RETAIL, OutletType.SERVICE, OutletType.FNB, OutletType.CUSTOM]
  // EVENT dihapus — transaksi event one-time, tidak butuh CRM
},
{ id: "loyalty", name: "Loyalty & Poin", ...
  requiredTypes: [OutletType.RETAIL, OutletType.SERVICE, OutletType.FNB, OutletType.CUSTOM]
  // EVENT dihapus — loyalty tidak relevan untuk tiket event
},
```

> Booking/jadwal tidak muncul di owner sidebar saat ini karena memang belum ada halamannya.
> Kalau nanti dibuat, gating-nya: `[SERVICE, CUSTOM]`.

### Cashier Navbar (`CashierNavbar.tsx`)

Belum sesuai kebutuhan FNB. Perlu **tambah** item berikut:

```ts
{ href: "/cashier/tables", label: "Meja & Bill", icon: LayoutGrid,
  requiredTypes: [OutletType.FNB] },
{ href: "/kitchen/[outletId]", label: "Kitchen", icon: ChefHat,
  requiredTypes: [OutletType.FNB] },
```

> Catatan: walaupun KDS bisa jalan di device terpisah, shortcut dari cashier nav tetap dibutuhkan
> untuk operasional outlet kecil yang pakai satu device.

---

## 3. Per-Type: Yang Belum Ada

---

### RETAIL

**Fitur tambahan: Barcode Scan di POS**

Kasir retail perlu bisa scan barcode produk untuk tambah ke cart, bukan input manual.

**Schema — tambah field `barcode` di `ProductGoods`:**
```prisma
model ProductGoods {
  // ...existing fields...
  barcode String? @unique // EAN-13, QR, atau format lain
  sku     String? // Internal stock keeping unit

  @@index([barcode])
}
```

**Backend — tambah endpoint lookup:**
```
GET /api/products/barcode/:code?outletId=
→ Cari produk berdasarkan barcode, return product info + harga
```

**Frontend Cashier (`pos-v2`) — dua mode scan:**

Mode 1: **USB/Bluetooth Scanner** (ketik cepat seperti keyboard + Enter)
- Listen `keydown` event dengan debounce ~50ms di input field tersembunyi
- Auto-trigger lookup saat sequence selesai (diakhiri `Enter`)
- Tidak butuh library tambahan

Mode 2: **Kamera** (mobile kasir atau tablet)
- Gunakan library `@zxing/browser` — support EAN-13, QR Code, Code 128, dll
- Tombol toggle "Scan Kamera" di CartPanel
- Buka overlay kamera → deteksi barcode → auto-lookup → tutup overlay
- Install: `bun add @zxing/browser`

Kedua mode panggil endpoint yang sama:
```
GET /api/products/barcode/:code?outletId=
```

**Temuan implementasi saat ini (Cashier POS):**
- Belum ada barcode scan di ProductCatalog (USB/Bluetooth maupun kamera)
- Lookup barcode endpoint belum dipakai di UI POS

---

### SERVICE

**Fitur tambahan: Booking Reminder Otomatis**

Infrastruktur Twilio sudah ada di backend tapi belum terhubung ke booking.

**Backend — tambah job reminder:**

Buat `src/jobs/booking-reminder.job.ts`:
```ts
// Jalankan setiap 15 menit via existing job scheduler
// Query: BookingSlot status=BOOKED, startTime antara sekarang + 1 jam, reminderSent=false
// Kirim push notification ke guestCustomer via PushSubscription yang sudah ada
// Set reminderSent=true setelah berhasil kirim
```

Push notification sudah ada infrastrukturnya (`PushSubscription` model, `webpush.ts` config, `push-notification.service.ts`). Job ini tinggal memanfaatkannya.

**Payload notifikasi:**
```ts
{
  title: "Pengingat Jadwal",
  body: `${serviceName} Anda dijadwalkan 1 jam lagi (${startTime})`,
  data: { orderId, type: "booking_reminder" }
}
```

**Schema — tambah field di `BookingSlot`:**
```prisma
model BookingSlot {
  // ...existing fields...
  reminderSent Boolean @default(false)
}
```

**Dashboard Owner — toggle reminder:**
- Setting per outlet: aktifkan/nonaktifkan reminder otomatis
- Bisa tambah ke `receiptSetting` atau buat `OutletNotificationSetting` terpisah

---

### FNB

**3a. Schema: Bill System**

```prisma
enum BillStatus {
  OPEN    // Aktif, bisa tambah order
  BILLED  // Kasir sudah generate bill, menunggu bayar
  PAID    // Lunas
}

model Bill {
  id        String     @id @default(uuid())
  outletId  String
  tableId   String
  status    BillStatus @default(OPEN)
  total     Float      @default(0)
  orders    Order[]
  table     OutletTable @relation(fields: [tableId], references: [id], onDelete: Cascade)
  createdAt DateTime   @default(now())
  closedAt  DateTime?
  updatedAt DateTime   @updatedAt

  @@index([tableId])
  @@index([outletId, status])
}
```

Update `TableStatus` — tambah `BILLED`:
```prisma
enum TableStatus {
  AVAILABLE
  OCCUPIED
  RESERVED
  BILLED  // Menunggu pembayaran
}
```

Update relasi:
```prisma
model OutletTable {
  // ...existing...
  bills Bill[]
}

model Order {
  // ...existing...
  billId String?
  bill   Bill?   @relation(fields: [billId], references: [id], onDelete: SetNull)
  source String? // "table_qr" | "cashier" | "online"
}
```

**3b. Schema: Kitchen Item Status + Notes**

```prisma
enum KitchenItemStatus {
  PENDING
  PREPARING
  READY
}

model OrderItem {
  // ...existing...
  kitchenStatus KitchenItemStatus @default(PENDING)
  notes         String?  // "pedas", "tanpa bawang", dll — dari customer
}
```

> `notes` dan `kitchenStatus` keduanya diperlukan untuk FNB yang proper.
> Tanpa `kitchenStatus` per item, dapur tidak bisa track progress ketika 1 meja punya multiple orders
> (open bill) dengan item yang waktu masaknya berbeda-beda.

**3b-UI. Cashier POS & KDS (Gap saat ini)**

- Cashier POS belum punya input `notes` per item di cart (contoh: `pedas`, `tanpa bawang`)
- Halaman `/cashier/tables` belum ada
- `KitchenTicket.tsx` masih display-only, belum ada aksi update status per item (`PENDING` → `PREPARING` → `READY`)
- Update status item perlu emit socket agar sinkron ke KDS/cashier lain secara realtime

**3c. Backend: Bill Endpoints**

```
POST /api/bills               → Generate bill untuk meja
                                - Validasi: meja harus OCCUPIED
                                - Hitung total semua Order aktif di meja
                                - Set Bill.status = OPEN, Table.status = BILLED
GET  /api/bills/:id           → Detail bill + semua order + items
PUT  /api/bills/:id/pay       → Mark lunas → pakai flow payment yang sudah ada
                                - Set Bill.status = PAID, Table.status = AVAILABLE
GET  /api/bills?outletId=&status= → List bills
```

Aturan bisnis:
- 1 meja hanya boleh 1 bill aktif (`OPEN` atau `BILLED`) secara bersamaan
- Order baru ke meja berstatus `BILLED` → ditolak
- Customer tidak bisa order dari QR jika meja `BILLED`

**3d. Backend: QR Meja**

```
GET /api/tables/:id/qr → Return QR code (base64 PNG) encode URL customer app
```

URL yang di-encode: `https://[customer-app]/outlet/[slug]?tableId=[tableId]&tableName=[tableName]`
Library: `qrcode` (npm).

**3e. Frontend Cashier: Halaman `/cashier/tables`**

Flow:
```
Grid semua meja (status badge: AVAILABLE / OCCUPIED / BILLED)
  └── Klik meja OCCUPIED
        → Sheet: list order aktif + items + total sementara
        → Tombol "Generate Bill"
  └── Klik meja BILLED
        → Sheet: detail bill + total
        → Tombol "Proses Pembayaran" → flow payment yang sudah ada
        → Setelah paid → meja kembali AVAILABLE
```

**3f. Frontend Customer: Self-Order via QR**

Flow aktual saat ini (sudah sebagian berjalan):
```
QR mengarah ke /outlet/[slug]?tableId=xxx&tableName=xxx
  └── OutletContent.tsx baca query params
    └── simpan tableId/tableName ke cart context
       └── tampilkan floating pill "Table Ordering Active"
          └── table info ikut terkirim saat checkout/payment
```

Yang belum ada:
```
1) Validasi status meja sebelum order:
  - AVAILABLE / OCCUPIED: boleh order
  - BILLED: blok order + tampilkan pesan "Bill sedang diproses, hubungi kasir"

2) Notes per item di cart customer (untuk instruksi dapur)

3) Outlet type awareness di frontend-customer:
  - Interface outlet di types/index.ts belum punya field type (RETAIL/SERVICE/FNB/EVENT/CUSTOM)
  - Tabs outlet (products/services/tickets/jam operasional) masih tampil semua, belum difilter per type

4) Tidak perlu menambah route baru /table/[tableId]
  - Pendekatan query params di outlet page sudah lebih clean dan cukup dipertahankan
```

---

### EVENT

**Fitur tambahan 1: Resend Tiket**

Customer kadang kehilangan tiket atau notifikasi tidak sampai.
Owner/kasir perlu bisa kirim ulang tiket ke nomor HP customer.

**Backend:**
```
POST /api/tickets/:code/resend
→ Kirim ulang QR tiket via WhatsApp/SMS ke guestCustomer.phone (Twilio)
→ Throttle: max 3x per tiket per hari
```

**Frontend Dashboard (Owner):**
- Tombol "Kirim Ulang Tiket" di detail order atau halaman tiket

**Fitur tambahan 2: Export Daftar Tiket**

Organizer event butuh daftar semua tiket untuk keperluan registrasi offline.

**Backend:**
```
GET /api/orders/:orderId/tickets/export → CSV/PDF semua TicketCode dalam satu order
GET /api/products/:productId/tickets/export → Semua tiket untuk satu produk event (admin view)
```

**Frontend Dashboard (Owner):**
- Tombol export di halaman detail produk event
- Format: CSV (nama, phone, kode tiket, status)

---

## 4. Urutan Implementasi

### Prioritas Tinggi (blocker untuk go-live F&B)
1. Schema: `Bill`, update `TableStatus`, update `Order` + `OrderItem` (termasuk `kitchenStatus` + `notes`)
2. Backend: bill endpoints + validasi aturan bisnis
3. Dashboard: halaman `/cashier/tables` + tambah nav item (`Kitchen`, `Meja & Bill`) di `CashierNavbar.tsx`
4. Cashier POS: tambah input `notes` per item di cart (sinkron ke `OrderItem.notes`)
5. Update KDS (`KitchenTicket.tsx`) untuk support update `kitchenStatus` per item via socket
6. Frontend customer: pertahankan flow query params QR, tambahkan validasi status meja (`BILLED` harus blok order)
7. Perbaiki sidebar gating (Loyalty + Customers untuk EVENT)

### Prioritas Sedang
8. Schema: `barcode` + `sku` di `ProductGoods`
9. Backend: `GET /api/products/barcode/:code`
10. Cashier POS: barcode scan di ProductCatalog (USB scanner mode)
11. Cashier POS: kamera scan mode — `bun add @zxing/browser`
12. Frontend-customer: tambah field `type` di interface outlet + filter tabs berdasarkan type
13. Backend: QR generate endpoint untuk meja (`/outlet/[slug]?tableId=&tableName=`)
14. EVENT: resend tiket endpoint + UI

### Prioritas Rendah
15. Schema: `reminderSent` di `BookingSlot`
16. Backend: booking reminder job → push notification (SERVICE)
17. EVENT: export daftar tiket CSV
