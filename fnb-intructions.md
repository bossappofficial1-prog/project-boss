# F&B Flow — AI Agent Instructions
> Project: POS System | Outlet Type: FNB | Scope: Backend · Frontend-Customer · Dashboard (Kasir) · KDS

---

## Prinsip Utama

F&B memiliki **4 mode order** yang berbeda state machine-nya:

| Mode | Siapa yang order | Bayar kapan | Meja |
|------|-----------------|-------------|------|
| **A. Dine-in Open Bill** | Customer scan QR meja | Setelah makan | Wajib |
| **B. Takeaway via QR** | Customer scan QR tanpa meja | Sebelum kitchen proses | Tidak ada |
| **C. POS Kasir — Langsung Bayar** | Kasir input di dashboard | Saat kasir input | Opsional |
| **D. POS Kasir — Open Bill** | Kasir buka bill untuk meja | Setelah makan | Wajib |

---

## State Machines

### OutletTable.status
```
AVAILABLE → OCCUPIED   (Mode A & D: saat Order dibuat untuk meja ini)
OCCUPIED  → AVAILABLE  (saat Order COMPLETED atau CANCELLED)
```
Mode B dan C tidak mengubah status meja.

### Order.orderStatus

| Status | Artinya |
|--------|---------|
| `ON_GOING` | Order aktif, kitchen proses, bisa tambah item (open bill) |
| `AWAITING_PAYMENT` | Bill ditutup, menunggu pembayaran |
| `CONFIRMED` | Pembayaran lunas, kitchen konfirmasi selesai |
| `COMPLETED` | Selesai seluruhnya |
| `CANCELLED` | Dibatalkan |

### Transisi per Mode

**Mode A & D (Open Bill):**
```
ON_GOING → AWAITING_PAYMENT → CONFIRMED → COMPLETED
ON_GOING → CANCELLED
```

**Mode B (Takeaway QR):**
```
AWAITING_PAYMENT → CONFIRMED (setelah bayar) → ON_GOING (kitchen mulai proses) → COMPLETED
AWAITING_PAYMENT → CANCELLED
```

**Mode C (POS Langsung Bayar):**
```
CONFIRMED → ON_GOING → COMPLETED
(payment langsung SUCCESS saat kasir input, tidak lewat AWAITING_PAYMENT)
```

### Order.paymentStatus
```
PENDING               → belum ada aksi bayar
PROOF_SUBMITTED       → customer upload bukti (transfer/QRIS offline)
AWAITING_VERIFICATION → kasir sedang review bukti
SUCCESS               → lunas
REJECTED_MANUAL       → bukti ditolak, kembali ke PENDING
```

---

## Mode A — Dine-in Open Bill (Customer Scan QR Meja)

### Flow
```
1. Customer scan QR meja
2. Sistem cek meja:
   - AVAILABLE  → sesi baru, minta nama + nomor HP
   - OCCUPIED   → join order aktif meja (open bill)
3. Customer pilih menu → submit
4. Order dibuat / item di-append → orderStatus: ON_GOING
5. Kitchen terima tiket via KDS (real-time)
6. Customer bisa tambah order lagi → kembali ke step 3
7. Kasir / customer trigger "Tutup Tagihan"
   → orderStatus: AWAITING_PAYMENT
   → menu di-lock, tidak bisa tambah item
8. Customer pilih metode bayar:
   - Upload bukti → paymentStatus: PROOF_SUBMITTED
   - Kasir konfirmasi cash/POS → langsung SUCCESS
9. Kasir approve bukti → paymentStatus: SUCCESS
   → orderStatus: COMPLETED
   → table.status: AVAILABLE
```

### Rules
- Meja `OCCUPIED` → **wajib** append ke order aktif, **dilarang** buat Order baru (throw 409)
- `orderStatus = AWAITING_PAYMENT` → tolak semua request tambah item
- Tutup tagihan hanya bisa dilakukan kasir atau dari halaman customer jika outlet mengizinkan
- `OutletTable.status` dan `Order` wajib diupdate dalam **satu DB transaction**

---

## Mode B — Takeaway via QR (Tanpa Meja)

### Flow
```
1. Customer scan QR outlet (tanpa tableId)
2. Minta nama + nomor HP
3. Customer pilih menu → submit
4. Order dibuat → orderStatus: AWAITING_PAYMENT, paymentStatus: PENDING
5. Tampilkan halaman pembayaran (total + info rekening/QRIS)
6. Customer upload bukti → paymentStatus: PROOF_SUBMITTED
7. Kasir approve → paymentStatus: SUCCESS
   → orderStatus: ON_GOING (kitchen mulai proses)
8. KDS terima tiket
9. Kitchen selesai → kasir mark COMPLETED
   → (opsional) notif ke customer bahwa pesanan siap diambil
```

### Rules
- **Kitchen baru proses SETELAH payment SUCCESS** — ini kebalikan dari Mode A
- Tidak ada `tableId`, tidak ada perubahan `OutletTable`
- Jika bukti ditolak → `paymentStatus: REJECTED_MANUAL` → customer upload ulang → order tidak dihapus
- Timeout opsional: jika `AWAITING_PAYMENT` > X menit tanpa aksi → auto `CANCELLED`

---

## Mode C — POS Kasir, Langsung Bayar

### Flow
```
1. Kasir buka halaman POS di dashboard
2. (Opsional) pilih meja atau kosongkan untuk takeaway
3. Kasir input / scan produk
4. Kasir input data customer (nama, HP) atau skip jika anonim
5. Kasir pilih metode bayar: CASH / QRIS_OFFLINE / OWNER_TRANSFER
6. Kasir klik "Proses Pembayaran"
   → Order dibuat langsung dengan:
      orderStatus: CONFIRMED
      paymentStatus: SUCCESS
      Transaction.isManual: true
7. Kitchen terima tiket via KDS
8. Kasir mark COMPLETED saat pesanan siap/diserahkan
```

### Rules
- **Tidak melewati AWAITING_PAYMENT** — payment dianggap selesai di tempat
- Jika ada meja yang dipilih → `table.status: OCCUPIED` saat order dibuat, `AVAILABLE` saat COMPLETED
- Kasir bisa batalkan sebelum submit → tidak ada data yang masuk DB
- Setelah submit, pembatalan harus lewat flow CANCELLED dengan alasan

---

## Mode D — POS Kasir, Open Bill untuk Meja

### Flow
```
1. Kasir buka halaman POS → pilih meja
2. Jika meja AVAILABLE:
   → Kasir input customer (nama, HP) → buat Order baru
   → orderStatus: ON_GOING, table.status: OCCUPIED
3. Jika meja OCCUPIED:
   → Load order aktif meja tersebut
   → Kasir append item baru
4. Kitchen terima tiket / item baru via KDS
5. Kasir bisa tambah item lagi kapan saja (step 3)
6. Saat customer selesai → kasir klik "Tutup Tagihan"
   → orderStatus: AWAITING_PAYMENT
7. Kasir proses bayar:
   - Cash/QRIS langsung → paymentStatus: SUCCESS → orderStatus: COMPLETED → table: AVAILABLE
   - Transfer → tunggu bukti dari customer → flow verifikasi
```

### Rules
- Sama seperti Mode A, meja `OCCUPIED` → **wajib** append, bukan buat Order baru
- Kasir punya akses penuh: tambah item, hapus item (sebelum kitchen proses), tutup tagihan
- Perbedaan dengan Mode A: inisiator adalah **kasir**, bukan customer

---

## Open Bill: Penanganan Item Baru di KDS

Karena Mode A dan D memungkinkan item ditambah di tengah sesi, KDS harus:

- Tandai setiap `OrderItem` dengan `createdAt`
- Item yang baru di-append ke order yang sudah ada → tampilkan badge **"BARU"** selama 60 detik
- Tiket di KDS tidak hilang saat item baru masuk — tiket yang sama diperbarui (update in place)
- Emit socket `order:itemsAdded` → KDS refresh tiket tanpa reload

---

## Socket Events Catalog

| Event | Emitter | Subscriber | Payload |
|-------|---------|-----------|---------|
| `order:new` | Backend | KDS, Dashboard | `{ orderId, tableId, mode, items }` |
| `order:itemsAdded` | Backend | KDS, Dashboard | `{ orderId, newItems }` |
| `order:statusChanged` | Backend | KDS, Dashboard, Customer | `{ orderId, orderStatus, paymentStatus }` |
| `payment:proofSubmitted` | Backend | Dashboard (kasir) | `{ orderId, proofUrl }` |
| `payment:verified` | Backend | Customer | `{ orderId, status }` |
| `order:completed` | Backend | KDS, Dashboard | `{ orderId, tableId? }` |

Semua join room berdasarkan `outletId`:
```js
socket.emit("join:outlet", { outletId })
```

---

## Error Cases & Guard

| Kasus | Handling |
|-------|----------|
| Buat Order baru di meja OCCUPIED | 409 — arahkan ke order aktif |
| Tambah item saat `AWAITING_PAYMENT` | 400 — "Tagihan sedang diproses" |
| Upload bukti saat `paymentStatus = SUCCESS` | 400 — "Pembayaran sudah dikonfirmasi" |
| Takeaway diproses kitchen sebelum bayar | Guard di backend: cek `paymentStatus = SUCCESS` sebelum emit KDS |
| Outlet `isOpen = false` | Blokir semua aksi order di semua mode |
| Socket disconnect di KDS | Auto-reconnect + refetch `GET /api/orders/board` |
| Kasir hapus item yang sudah dikerjakan kitchen | Warn kasir, require konfirmasi, catat alasan |

---

## API Endpoints Wajib (Backend)

```
# Resolusi outlet
GET    /api/outlets/slug/:slug                      → resolve slug → outlet data

# Customer
POST   /api/guest-customers/identify                → cari/buat by phone

# Meja
GET    /api/outlets/:outletId/tables                → daftar meja + status
GET    /api/tables/:tableId/active-order            → cek order aktif di meja

# Order
POST   /api/orders                                  → buat order baru (semua mode)
POST   /api/orders/:id/items                        → append item (open bill)
DELETE /api/orders/:id/items/:itemId                → hapus item (guard: belum diproses)
PATCH  /api/orders/:id/close-bill                   → tutup tagihan → AWAITING_PAYMENT
POST   /api/orders/:id/payment-proof                → upload bukti bayar
POST   /api/orders/:id/pay-direct                   → kasir bayar langsung (cash/POS)
POST   /api/orders/:id/verify-payment               → approve / reject bukti
PATCH  /api/orders/:id/complete                     → mark COMPLETED
PATCH  /api/orders/:id/cancel                       → batalkan + alasan

# KDS & Dashboard
GET    /api/orders/board?outletId=                  → semua order aktif
```

### Body POST /api/orders (perbedaan per mode)
```json
Mode A / D (open bill):
{
  "outletId": "...",
  "tableId": "...",
  "tableNumber": "...",
  "guestCustomerId": "...",
  "items": [{ "productId": "...", "quantity": 1 }],
  "orderStatus": "ON_GOING",
  "paymentStatus": "PENDING"
}

Mode B (takeaway QR):
{
  "outletId": "...",
  "guestCustomerId": "...",
  "items": [...],
  "orderStatus": "AWAITING_PAYMENT",
  "paymentStatus": "PENDING"
}

Mode C (POS langsung):
{
  "outletId": "...",
  "tableId": "...",          ← opsional
  "guestCustomerId": "...",  ← opsional
  "items": [...],
  "orderStatus": "CONFIRMED",
  "paymentStatus": "SUCCESS",
  "isManualPayment": true,
  "manualMethod": "CASH"
}
```

---

## Aturan Ketat per Layer

### Backend
- Setiap mutation Order **wajib** validasi `orderStatus` saat ini sebelum eksekusi
- `OutletTable.status` dan `Order` harus diupdate dalam **satu DB transaction**
- Mode B: emit `order:new` ke KDS **hanya setelah** `paymentStatus = SUCCESS`
- Mode C: tidak perlu flow verifikasi — langsung `SUCCESS`

### Frontend-Customer
- Deteksi mode dari URL: ada `tableId` → Mode A, tidak ada → Mode B
- Selalu cek `GET /tables/:tableId/active-order` saat load halaman meja
- Lock seluruh UI menu saat `orderStatus = AWAITING_PAYMENT`

### Dashboard (Kasir)
- POS harus bisa handle Mode C dan D dari UI yang sama (toggle: "Langsung Bayar" vs "Open Bill")
- Real-time notif untuk: order baru masuk, bukti bayar masuk, item ditambah ke open bill
- Validasi status di sisi client sebelum kirim request

### KDS
- Tampilkan order dengan `orderStatus = ON_GOING` **dan** `paymentStatus = SUCCESS` (untuk Mode B)
- Item baru di order aktif → highlight badge "BARU"
- KDS adalah **read-only** — tidak ada write action dari KDS
- Auto-reconnect + refetch saat socket disconnect