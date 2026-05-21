# Manager Role & Privilege System — Implementation Plan

## Overview

Manager adalah role pada tabel `Staff` yang login melalui halaman yang sama dengan kasir (`/auth/login/cashier`), tetapi mendapat dashboard berbeda dengan akses berbasis privilege.

Ketentuan utama:
- Owner dapat membuat akun manager di **semua jenis outlet** (tidak dibatasi tipe bisnis)
- Owner menginput **email, nama, dan PIN** saat membuat akun manager
- Owner menetapkan **privileges** saat pembuatan akun
- Manager login menggunakan **nama dan PIN**
- Manager memiliki **layout dan route sendiri**, tetapi **menggunakan komponen yang sama dengan owner**

---

## Schema Changes

### 1. Update `Staff` model — tambah `role` field

```prisma
enum StaffRole {
  CASHIER
  MANAGER
}

model Staff {
  // ... existing fields ...
  name        String
  email       String?         // input saat owner buat akun manager
  pin         String          // hashed PIN untuk login
  role        StaffRole       @default(CASHIER)
  privileges  StaffPrivilege[]
}
```

### 2. New `StaffPrivilege` model

```prisma
model StaffPrivilege {
  id        String             @id @default(uuid())
  staffId   String
  privilege StaffPrivilegeType
  createdAt DateTime           @default(now())
  staff     Staff              @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@unique([staffId, privilege])
}

enum StaffPrivilegeType {
  OUTLET_MANAGEMENT     // Manajemen outlet
  PRODUCT_MANAGEMENT    // Produk
  TRANSACTION_VIEW      // Lihat riwayat transaksi
  TRANSACTION_DELETE    // Hapus/approve penghapusan transaksi
}
```

### 3. Update `TransactionDeleteRequest` — track siapa yang approve

```prisma
model TransactionDeleteRequest {
  // ... existing fields ...
  approvedByRole String?   // "owner" | "manager"
  approvedById   String?   // userId (owner) atau staffId (manager)
}
```

---

## Backend Implementation

### New Files

| File | Purpose |
|------|---------|
| `backend/src/schemas/staff-privilege.schema.ts` | Zod validation untuk assign/remove privilege |
| `backend/src/repositories/staff-privilege.repository.ts` | CRUD operations untuk StaffPrivilege |
| `backend/src/service/staff-privilege.service.ts` | Business logic: assign, revoke, check privileges |
| `backend/src/controller/staff-privilege.controller.ts` | Request handlers |
| `backend/src/routes/staff-privilege.route.ts` | API routes |
| `backend/src/middleware/privilege.middleware.ts` | `authorizePrivilege(type)` middleware |

### Modified Files

| File | Change |
|------|--------|
| `backend/src/service/auth.service.ts` | Tambah `managerLogin()` — login via nama + PIN, return role + privileges di session Redis & JWT |
| `backend/src/middleware/auth.middleware.ts` | Tambah `authorizeStaffRole()` + `authorizePrivilege()` |
| `backend/src/schemas/staff.schema.ts` | Tambah `role`, `email`, `pin` field di create/update schema |
| `backend/src/repositories/staff.repository.ts` | Include `privileges` + `role` di `findById` dan `findByName` |
| `backend/src/service/transaction-delete.service.ts` | Accept manager sebagai approver, track `approvedByRole` + `approvedById` |
| `backend/src/controller/transaction-delete.controller.ts` | Tambah direct-delete endpoint untuk manager |
| `backend/src/routes/transaction-delete.route.ts` | Tambah route direct-delete dengan privilege middleware |

### New API Endpoints

```
POST   /api/auth/manager/login                      # Manager login (nama + PIN)

POST   /api/staff/:id/privileges                    # Owner assign privileges ke staff
GET    /api/staff/:id/privileges                    # Get staff privileges
DELETE /api/staff/:id/privileges/:type              # Remove privilege

POST   /api/transaction-deletes/:id/direct-delete   # Manager langsung hapus (butuh TRANSACTION_DELETE)
```

### Auth Flow — Manager Login

```
Manager login → POST /api/auth/manager/login
  payload: { name, pin }
  → Backend: StaffRepository.findByName() → verifikasi PIN (bcrypt compare)
  → Include role + privileges dari StaffPrivilege
  → Redis session: { id, name, email, outletId, businessId, userType: "MANAGER", role: "MANAGER", privileges: [...] }
  → JWT: { sessionId, role: "MANAGER", userType: "MANAGER", outletId, businessId, privileges: [...] }
  → Response: { staff: { id, name, email, role, privileges: [...], outletId }, token }
  → Frontend: redirect ke /manager/dashboard
```

### Owner Create Manager Flow

```
Owner buat akun manager → POST /api/staff
  payload: { name, email, pin, role: "MANAGER", privileges: [...], outletId }
  → Backend: hash PIN dengan bcrypt
  → Simpan Staff record dengan role MANAGER
  → Simpan StaffPrivilege records sesuai privileges yang dipilih
  → Response: staff object
```

> **Catatan:** Tidak ada pembatasan tipe bisnis outlet — semua outlet dapat memiliki manager.

### Privilege Middleware

```typescript
// authorizePrivilege(StaffPrivilegeType.TRANSACTION_DELETE)
// 1. Cek userType === "MANAGER"
// 2. Cek staff.privileges includes required privilege type
// 3. Cek staff.outletId matches resource outletId (scope validation)
```

### Direct Delete Flow (Manager)

```
Manager klik "Hapus" pada transaksi
  → POST /api/transaction-deletes/:id/direct-delete
  → Backend: cek privilege TRANSACTION_DELETE
  → Backend: restore stock (GOODS: currentStock + qty, TICKET: soldCount - qty, cancel ticket codes)
  → Backend: refund loyalty points jika ada
  → Backend: delete transaction + order + related records
  → Backend: create TransactionDeleteRequest record untuk audit trail:
     - status: APPROVED
     - requestedBy: managerStaffId
     - approvedByRole: "manager"
     - approvedById: managerStaffId
  → Response: success
```

---

## Frontend Implementation

### Login Page Update

**File:** `dashboard/app/auth/login/cashier/page.tsx`

```typescript
// Setelah login berhasil:
if (response.staff.role === "MANAGER") {
  router.push("/manager/dashboard");
} else {
  router.push("/cashier/pos");
}
```

> Manager login menggunakan form **nama + PIN** (bukan email + password).
> Bisa dibuat tab/toggle di halaman `/auth/login/cashier` antara "Kasir" dan "Manager".

### New Files — Manager Area

| File | Purpose |
|------|---------|
| `dashboard/app/manager/layout.tsx` | Layout dengan sidebar, privilege-based navigation — **komponen sidebar sama dengan owner** |
| `dashboard/app/manager/dashboard/page.tsx` | Home page manager |
| `dashboard/app/manager/outlets/page.tsx` | Manajemen outlet (butuh OUTLET_MANAGEMENT) — **reuse komponen owner** |
| `dashboard/app/manager/products/page.tsx` | Manajemen produk (butuh PRODUCT_MANAGEMENT) — **reuse komponen owner** |
| `dashboard/app/manager/transactions/page.tsx` | Riwayat transaksi + delete approval (butuh TRANSACTION_VIEW / TRANSACTION_DELETE) — **reuse komponen owner** |

### Modified Files

| File | Change |
|------|--------|
| `dashboard/lib/apis/auth.ts` | Tambah `managerLogin(name, pin)` — return type include `role` + `privileges` |
| `dashboard/components/features/owner/staff/StaffModal.tsx` | Tambah role select; jika Manager dipilih → tampilkan field email + PIN + privilege checkboxes |
| `dashboard/components/features/owner/staff/StaffTable.tsx` | Tampilkan role badge + privilege tags + "Edit Privileges" button |
| `dashboard/lib/apis/transaction-delete.ts` | Tambah `directDelete` API call |

### Manager Layout & Component Reuse

Manager menggunakan **layout dan route sendiri** (`/manager/*`), tetapi **komponen UI diimpor dari direktori owner**:

```
dashboard/
├── app/
│   ├── owner/               ← route owner
│   └── manager/             ← route manager (terpisah)
│       ├── layout.tsx       ← layout manager sendiri
│       ├── dashboard/
│       ├── outlets/
│       ├── products/
│       └── transactions/
└── components/
    └── features/
        └── owner/           ← komponen owner
            ├── outlet/      ← dipakai ulang oleh manager
            ├── product/     ← dipakai ulang oleh manager
            └── transaction/ ← dipakai ulang oleh manager
```

Contoh import di halaman manager:

```typescript
// dashboard/app/manager/outlets/page.tsx
import { OutletTable } from "@/components/features/owner/outlet/OutletTable";
import { OutletModal } from "@/components/features/owner/outlet/OutletModal";
```

### Manager Layout Sidebar

```
Manager Dashboard     → /manager/dashboard       (selalu tampil)
├── Manajemen Outlet  → /manager/outlets          (OUTLET_MANAGEMENT)
├── Produk            → /manager/products         (PRODUCT_MANAGEMENT)
└── Riwayat Transaksi → /manager/transactions     (TRANSACTION_VIEW)
    └── Hapus Transaksi                           (TRANSACTION_DELETE — sub-feature)
```

Sidebar hanya merender menu yang sesuai dengan privileges manager yang sedang login.

### Staff Creation UI (StaffModal.tsx)

```
Role: [ Kasir ▼ ]
      [ Manager ]

Jika Manager dipilih → tampilkan field tambahan:
  Email     : [input email]
  PIN       : [input PIN — 6 digit]

  Privileges:
  [ ] Manajemen Outlet
  [ ] Produk
  [ ] Lihat Riwayat Transaksi
  [ ] Hapus Transaksi

Submit → POST /api/staff (dengan role, email, pin, privileges)
```

> Tidak ada pembatasan outlet — owner dapat membuat manager di outlet apapun.

### Staff List UI (StaffTable.tsx)

```
Nama   | Email            | Role    | Privileges                | Actions
-------|------------------|---------|---------------------------|------------------
Budi   | —                | Kasir   | —                         | Edit, Delete
Andi   | andi@example.com | Manager | Outlet, Produk, Transaksi | Edit, Privileges, Delete
```

### Transaction Delete Page (Manager)

```
Riwayat Transaksi
├── Section: Menunggu Persetujuan (pending requests dari kasir)
│   └── Approve / Reject buttons (TRANSACTION_DELETE)
├── Section: Riwayat Penghapusan (approved/rejected history)
│   └── Menampilkan: siapa yang request, siapa yang approve, kapan
└── Direct Delete: tombol "Hapus" di setiap transaksi (TRANSACTION_DELETE)
    └── Confirm dialog → langsung hapus, stock kembali, audit trail tercatat
```

---

## Data Flow

```
1. Owner membuat akun Manager
   → Owner pilih role "Manager" + isi email, nama, PIN + centang privileges
   → POST /api/staff
   → Backend: hash PIN → simpan Staff + StaffPrivilege records

2. Manager login
   → POST /api/auth/manager/login { name, pin }
   → Backend: findByName → bcrypt compare PIN
   → Returns: { role: "MANAGER", privileges: [...] }
   → Frontend redirect: /manager/dashboard

3. Manager akses menu
   → Layout baca privileges dari JWT/session
   → Render sidebar hanya menu yang dimiliki
   → Middleware cek privilege di setiap API call

4. Manager delete transaksi (direct)
   → Klik "Hapus" → confirm → POST /api/transaction-deletes/:id/direct-delete
   → Backend: restore stock, delete records, create audit trail
   → approvedByRole: "manager", approvedById: managerStaffId

5. Manager approve request dari kasir
   → Klik "Setujui" → POST /api/transaction-deletes/:id/approve
   → Backend: restore stock, delete records
   → approvedByRole: "manager", approvedById: managerStaffId
```

---

## Todo List

### Phase 1: Schema & Migration
- [ ] 1.1 Tambah enum `StaffRole` di `schema.prisma`
- [ ] 1.2 Tambah field `role`, `email`, `pin` di model `Staff`
- [ ] 1.3 Tambah model `StaffPrivilege`
- [ ] 1.4 Tambah enum `StaffPrivilegeType`
- [ ] 1.5 Update model `TransactionDeleteRequest` — tambah `approvedByRole` + `approvedById`
- [ ] 1.6 Jalankan `npx prisma migrate dev`

### Phase 2: Backend — Privilege System
- [ ] 2.1 Buat `backend/src/schemas/staff-privilege.schema.ts`
- [ ] 2.2 Buat `backend/src/repositories/staff-privilege.repository.ts`
- [ ] 2.3 Buat `backend/src/service/staff-privilege.service.ts`
- [ ] 2.4 Buat `backend/src/controller/staff-privilege.controller.ts`
- [ ] 2.5 Buat `backend/src/routes/staff-privilege.route.ts`
- [ ] 2.6 Buat `backend/src/middleware/privilege.middleware.ts`
- [ ] 2.7 Register routes di `index.routes.ts`

### Phase 3: Backend — Auth & Staff Updates
- [ ] 3.1 Tambah `managerLogin(name, pin)` di `auth.service.ts`
- [ ] 3.2 Tambah route `POST /api/auth/manager/login` di `auth.route.ts`
- [ ] 3.3 Update `auth.middleware.ts` — tambah `authorizeStaffRole()` + `authorizePrivilege()`
- [ ] 3.4 Update `staff.schema.ts` — tambah `role`, `email`, `pin` field
- [ ] 3.5 Update `staff.repository.ts` — include privileges + role, tambah `findByName()`
- [ ] 3.6 Update `staff.service.ts` — hash PIN saat create, handle role + privileges

### Phase 4: Backend — Transaction Delete Enhancement
- [ ] 4.1 Update `transaction-delete.service.ts` — accept manager sebagai approver
- [ ] 4.2 Tambah method `directDeleteTransaction()` di service
- [ ] 4.3 Update `transaction-delete.controller.ts` — tambah direct-delete handler
- [ ] 4.4 Update `transaction-delete.route.ts` — tambah route direct-delete
- [ ] 4.5 Update `TransactionDeleteRequest` schema — tambah `approvedByRole` + `approvedById`

### Phase 5: Frontend — Login & API
- [ ] 5.1 Tambah `managerLogin(name, pin)` di `dashboard/lib/apis/auth.ts`
- [ ] 5.2 Update `dashboard/app/auth/login/cashier/page.tsx` — tambah tab/toggle Manager login (nama + PIN), redirect berdasarkan role
- [ ] 5.3 Update `dashboard/lib/apis/transaction-delete.ts` — tambah `directDelete` API
- [ ] 5.4 Buat `dashboard/hooks/api/use-staff-privilege.ts`

### Phase 6: Frontend — Manager Dashboard
- [ ] 6.1 Buat `dashboard/app/manager/layout.tsx` — sidebar privilege-based, reuse komponen owner
- [ ] 6.2 Buat `dashboard/app/manager/dashboard/page.tsx`
- [ ] 6.3 Buat `dashboard/app/manager/outlets/page.tsx` — import komponen dari `features/owner/outlet`
- [ ] 6.4 Buat `dashboard/app/manager/products/page.tsx` — import komponen dari `features/owner/product`
- [ ] 6.5 Buat `dashboard/app/manager/transactions/page.tsx` — import komponen dari `features/owner/transaction`

### Phase 7: Frontend — Staff Management UI
- [ ] 7.1 Update `StaffModal.tsx` — role select; jika Manager → tampilkan field email, PIN, dan privilege checkboxes
- [ ] 7.2 Update `StaffTable.tsx` — role badge + privilege tags + edit privileges button
- [ ] 7.3 Update staff API hooks untuk handle role, email, pin, dan privileges

### Phase 8: Testing & Cleanup
- [ ] 8.1 Test login flow: kasir → /cashier/pos, manager → /manager/dashboard
- [ ] 8.2 Test login manager: nama + PIN yang benar → berhasil, salah → error
- [ ] 8.3 Test privilege middleware: akses tanpa privilege → 403
- [ ] 8.4 Test direct delete: manager hapus transaksi → stock kembali, audit trail tercatat
- [ ] 8.5 Test approve/reject: manager approve request kasir → berhasil
- [ ] 8.6 Test scope: manager hanya bisa akses outlet sendiri
- [ ] 8.7 Test komponen reuse: halaman manager render komponen owner dengan benar
- [ ] 8.8 Jalankan linter & typecheck

---

## Notes

- Manager bisa dibuat di **semua jenis outlet**, tidak ada batasan tipe bisnis
- Manager login menggunakan **nama + PIN** (bukan email + password)
- **Email** pada akun manager bersifat opsional — untuk keperluan notifikasi atau identifikasi
- Manager scope = single outlet (berdasarkan `staff.outletId`)
- Manager **reuse komponen owner** — tidak duplikasi kode UI, hanya layout dan route yang berbeda
- Manager bisa langsung hapus transaksi (bypass approval) — semua data tercatat di `TransactionDeleteRequest` untuk audit trail
- Owner tetap bisa lihat semua delete history termasuk yang dilakukan manager
- Privilege terpisah: `TRANSACTION_VIEW` (lihat) vs `TRANSACTION_DELETE` (hapus/approve)
- `approvedBy` di `TransactionDeleteRequest` menyimpan:
  - `approvedByRole`: "owner" atau "manager"
  - `approvedById`: userId (owner) atau staffId (manager)
  - Ini menjaga backward compatibility dengan field `approvedBy` yang existing
