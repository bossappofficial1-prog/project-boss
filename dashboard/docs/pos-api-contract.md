# Kontrak API POS Per Outlet

Dokumen ini mendefinisikan endpoint yang dibutuhkan UI POS kasir. Semua endpoint berbasis REST JSON, diautentikasi dengan bearer token dan berada di namespace `/api/v1` (kecuali disebut lain).

## 1. Konvensi Umum

- **Respons standar**
  ```json
  {
    "success": true,
    "message": "",
    "data": {}
  }
  ```
- **Error** memakai `success: false`, `error` dan kode status HTTP sesuai (`400`, `401`, `404`, `409`, `422`, `500`).
- ID memakai UUID string.
- Semua nilai rupiah menggunakan `Float` (dua digit desimal) sesuai schema Prisma.
- Field tanggal/timestamp dalam ISO 8601 (UTC).

## 2. Data Reference

### 2.1 Outlet Preference

```
GET /owner/outlets/{outletId}/pos-preferences
```

Respons contoh:

```json
{
  "success": true,
  "data": {
    "outlet": {
      "id": "...",
      "name": "Outlet A",
      "businessId": "...",
      "address": "",
      "manualQrImage": "https://...",
      "manualBankName": "BCA",
      "manualBankAccount": "123456789",
      "manualAccountHolder": "PT UMKM",
      "defaultTransactionFeeBearer": "OWNER",
      "cashDrawerRequired": true,
      "collectCustomerData": {
        "phone": true,
        "name": false,
        "email": false
      }
    },
    "business": {
      "id": "...",
      "defaultTransactionFeeBearer": "OWNER",
      "allowMembershipDiscount": true,
      "promoEnabled": true
    }
  }
}
```

## 3. Katalog Produk & Layanan

### 3.1 Daftar Produk / Layanan Per Outlet

```
GET /owner/outlets/{outletId}/products
?type=GOODS|SERVICE
&status=ACTIVE|INACTIVE
&search=keyword
&page=1&limit=30
```

Respons ringkas:

```json
{
  "success": true,
  "data": [
    {
      "id": "prod-1",
      "name": "Americano",
      "description": "",
      "type": "GOODS",
      "status": "ACTIVE",
      "price": 25000,
      "quantity": 20,
      "serviceDurationMinutes": null,
      "image": "https://...",
      "transactionFeeBearer": "CUSTOMER",
      "promo": {
        "id": "promo-1",
        "code": "HEMAT10",
        "value": 10,
        "type": "PERCENTAGE"
      },
      "bookingSlotsSummary": {
        "availableToday": 5,
        "nextAvailable": "2025-11-01T10:00:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 120,
    "totalPages": 4
  }
}
```

### 3.2 Detail Produk (untuk validasi stok)

```
GET /owner/products/{productId}
```

## 4. Guest Customer & Membership

### 4.1 Lookup Guest Customer

```
GET /owner/guest-customers/lookup?phone=628123456789
```

Respons minimal:

```json
{
  "success": true,
  "data": {
    "guestCustomer": {
      "id": "guest-1",
      "name": "Budi",
      "phone": "628123456789",
      "email": null
    }
  }
}
```

Jika tidak ditemukan, `data` bernilai `null` namun `success: true`.

### 4.2 Lookup Membership

```
GET /owner/memberships/lookup?phone=628123456789&businessId={businessId}
```

Respons contoh:

```json
{
  "success": true,
  "data": {
    "membership": {
      "id": "member-1",
      "memberCode": "VIP001",
      "memberType": "VIP",
      "discountPercentage": 10,
      "isActive": true
    }
  }
}
```

### 4.3 Buat / Mutakhirkan Guest Customer

```
POST /owner/guest-customers
```

Payload:

```json
{
  "name": "Budi",
  "phone": "628123456789",
  "email": "",
  "businessId": "...",
  "membership": {
    "createIfNotExists": true,
    "memberType": "REGULAR",
    "discountPercentage": 5
  }
}
```

## 5. Promo & Fee

### 5.1 Validasi Promo

```
POST /owner/promos/validate
```

Payload:

```json
{
  "businessId": "...",
  "code": "HEMAT10",
  "orderSubtotal": 150000
}
```

Respons:

```json
{
  "success": true,
  "data": {
    "promoId": "promo-1",
    "type": "PERCENTAGE",
    "value": 10,
    "discountAmount": 15000
  }
}
```

### 5.2 Simulasi Fee (opsional)

```
POST /owner/orders/fee-preview
```

Payload memuat `subtotal`, `chargedTo`, `paymentMethod`, dll.

## 6. Booking & Queue Layanan

### 6.1 Jam Operasional Outlet

```
GET /owner/outlets/{outletId}/operating-hours
```

### 6.2 Daftar Slot Booking

```
GET /owner/products/{productId}/booking-slots?date=2025-11-01
```

### 6.3 Reservasi Slot (jika pre-book)

```
POST /owner/booking-slots/reserve
```

Payload:

```json
{
  "productId": "svc-1",
  "slotId": "slot-1",
  "guestCustomerId": "guest-1"
}
```

Respons mengembalikan detail slot dan status reservasi sementara (expired otomatis dalam 5 menit jika order tidak dibuat).

### 6.4 Lepaskan Slot (bila batal)

```
POST /owner/booking-slots/{slotId}/release
```

### 6.5 Manajemen Queue (walk-in)

```
POST /owner/outlets/{outletId}/queues
```

Payload ringkas:

```json
{
  "guestCustomerId": "guest-1",
  "productId": "svc-1",
  "bookingDate": "2025-11-01T08:00:00Z"
}
```

## 7. Order & Transaksi

### 7.1 Buat Order

```
POST /owner/orders
```

Payload contoh goods:

```json
{
  "outletId": "outlet-1",
  "guestCustomer": {
    "id": "guest-1",
    "name": "Budi",
    "phone": "628123456789"
  },
  "items": [{ "productId": "prod-1", "quantity": 2 }],
  "paymentMethod": "ONLINE", // CASH | QRIS | ONLINE | MANUAL_TRANSFER
  "onlinePaymentChannel": "qris_dynamic", // Khusus ONLINE
  "promoId": "promo-1",
  "membershipId": "member-1",
  "cashReceived": 60000,
  "bookingDate": "2025-11-01T08:00:00Z",
  "bookingSlotId": "slot-1",
  "staffId": "staff-1"
}
```

Respons:

```json
{
  "success": true,
  "message": "Order created",
  "data": {
    "order": {
      "id": "order-1",
      "orderStatus": "AWAITING_PAYMENT",
      "paymentStatus": "SUCCESS",
      "totalAmount": 53500,
      "discountAmount": 5000,
      "midtransFee": 1000,
      "appFee": 1500,
      "chargedTo": "CUSTOMER",
      "paymentMethod": "online",
      "guestCustomer": { "id": "guest-1", "name": "Budi" },
      "bookingSlot": {
        "id": "slot-1",
        "startTime": "2025-11-01T08:00:00Z",
        "endTime": "2025-11-01T08:30:00Z"
      }
    },
    "transaction": {
      "id": "trx-1",
      "status": "PENDING",
      "isManual": false,
      "paymentMethod": "online",
      "paymentUrl": null,
      "midtrans": {
        "channel": "qris_dynamic",
        "amount": 53500,
        "expiredAt": "2025-11-01T09:00:00Z",
        "qrUrl": "https://midtrans.qris/image.png",
        "qrString": "000201010212...",
        "paymentCode": null,
        "vaNumbers": [],
        "instructions": [
          {
            "title": "Pembayaran via aplikasi e-wallet",
            "steps": [
              "Buka aplikasi e-wallet",
              "Pilih menu Scan QR",
              "Arahkan kamera ke QR yang ditampilkan kasir",
              "Konfirmasi nominal dan selesaikan pembayaran"
            ]
          }
        ]
      }
    }
  }
}
```

> **Catatan biaya:**
>
> - `appFee` = 3% dari subtotal (dibulatkan ke atas) untuk menutup biaya aplikasi.
> - `midtransFee` = 2% dari subtotal (dibulatkan ke atas) sesuai charge Midtrans.
> - Nilai `totalAmount` sudah termasuk `appFee` + `midtransFee` ketika metode = ONLINE.

### 7.2 Update Status Pembayaran Manual

```
PATCH /owner/transactions/{transactionId}/verify
```

Payload:

```json
{
  "status": "SUCCESS", // SUCCESS | REJECTED_MANUAL
  "notes": "Transfer diterima"
}
```

### 7.3 Upload Bukti Pembayaran Manual

```
POST /owner/transactions/{transactionId}/proof
```

Form-data dengan `file`.

### 7.4 Ambil Detail Order + Struk

```
GET /owner/orders/{orderId}
```

Menjadi sumber data untuk struk (kasir & histori).

## 8. Cash Drawer (Saldo Tunai)

### 8.1 Buka Kasir

```
POST /owner/cash-drawers/open
```

Payload:

```json
{
  "outletId": "outlet-1",
  "openingBalance": 300000,
  "note": "Shift pagi"
}
```

### 8.2 Ambil Status Kasir Saat Ini

```
GET /owner/cash-drawers/current?outletId=outlet-1
```

Kembalian:

```json
{
  "success": true,
  "data": {
    "id": "drawer-1",
    "status": "OPEN",
    "openingBalance": 300000,
    "currentBalance": 455000,
    "openedAt": "2025-11-01T01:00:00Z",
    "openedBy": { "id": "user-1", "name": "Kasir A" }
  }
}
```

### 8.3 Catat Transaksi Tunai

```
POST /owner/cash-drawers/{drawerId}/transactions
```

Payload:

```json
{
  "type": "OUT", // IN | OUT | ADJUSTMENT
  "amount": 50000,
  "reference": "order-1", // optional
  "note": "Pembelian bahan"
}
```

### 8.4 Tutup Kasir

```
POST /owner/cash-drawers/{drawerId}/close
```

Payload:

```json
{
  "closingAmount": 450000,
  "note": "Shift selesai",
  "photoUrl": "https://..." // optional upload terpisah
}
```

Respons menyertakan selisih.

## 9. Histori & Laporan

### 9.1 Daftar Order Harian

```
GET /owner/orders
?outletId=outlet-1
&dateFrom=2025-11-01&dateTo=2025-11-01
&paymentMethod=CASH|QRIS|ONLINE|MANUAL_TRANSFER
&status=SUCCESS|PENDING|AWAITING_VERIFICATION
&page=1&limit=50
```

### 9.2 Kirim Ulang Struk

```
POST /owner/orders/{orderId}/send-receipt
```

Payload:

```json
{
  "channel": "WHATSAPP", // EMAIL | WHATSAPP
  "target": "628123456789"
}
```

---

Dokumen ini dapat diperluas bila ada fitur tambahan (misal offline draft, integrasi thermal printer, atau shift kasir). Setelah disepakati, kita gunakan sebagai referensi implementasi backend dan integrasi React Query di frontend POS.
