# Wireframe Low-Fi POS Per Outlet

Dokumen ini menjadi referensi visual awal sebelum implementasi UI. Fokus pada alur kasir untuk produk goods, layanan dengan booking, serta integrasi saldo tunai.

## 1. Layout Utama

```
┌───────────────────────────────┬─────────────────────────────┐
│ Header POS                    │ Status Outlet + Aksi Cepat  │
├───────────────────────────────┴─────────────────────────────┤
│ Katalog Produk/Layanan (Left)                               │
│  - Search bar + filter tabs                                  │
│  - Grid kartu item (image, nama, harga, stok/durasi)         │
│  - Sticky bar "Keranjang" saat mobile                       │
├───────────────┬─────────────────────────────────────────────┤
│ Keranjang     │ Panel Pelanggan + Pembayaran + Drawer Tunai │
│  - List item  │  - Pelanggan (lookup/skip)                   │
│  - Summary    │  - Pembayaran (metode, detail)               │
│  - Promo      │  - Booking/Queue (khusus service)            │
│               │  - Saldo tunai (setoran awal, pengeluaran)   │
└───────────────┴─────────────────────────────────────────────┘
```

### Header POS

- **Outlet selector** (readonly, info nama & alamat).
- **Info kasir aktif** + tombol `Buka/Tutup Kasir` (cash drawer).
- Shortcut ke `Riwayat Transaksi` dan indikator koneksi (normal/offline).

## 2. Blok Katalog Produk & Layanan

### Komponen

- Search input + tombol `Cari`.
- Filter tabs: `Semua`, `Produk`, `Layanan`, `Favorit`, `Habis`.
- Toggle tampilan list/grid (opsional).
- Kartu item:
  - Thumbnail (fallback placeholder).
  - Nama 2 baris + status (stok, aktif/nonaktif, promo badge).
  - Harga + info fee bearer.
  - Tombol `Tambah` (goods) atau `Pilih Waktu` (service).

### Kebutuhan Data

- `/products/outlet/{id}` dengan parameter `type`, `status`, `search`, `page`.
- Field minimum: `id`, `name`, `price`, `type`, `status`, `quantity`, `serviceDurationMinutes`, `image`, `transactionFeeBearer`.
- Untuk layanan: `bookingSlotsSummary` (slot tersedia hari ini) + `staffAssignments` opsional.

## 3. Keranjang

### Komponen

- Daftar item (nama, qty, harga per item, total). Tombol `+/-` dan `Hapus`.
- Informasi stok real-time (alert jika stok kurang).
- Input kode promo (opsional) + status validasi.
- Ringkasan biaya: subtotal, diskon membership, diskon promo, fee midtrans/app, total bayar.
- Tombol `Reset Keranjang`.

### Kebutuhan Data

- Validasi stok via endpoint order simulation atau GET `products/{id}`.
- Endpoint promo: `POST /promos/validate`.
- Konfigurasi fee: dari `Business` dan `Outlet` preferences.

## 4. Panel Pelanggan

### Komponen

- Field nomor HP (auto-focus) + tombol `Lewati`.
- Fetch otomatis data membership: tampilkan nama, tipe member, diskon default.
- Field opsional: nama, email, catatan.
- Checkbox `Simpan sebagai member baru` bila data baru.

### Kebutuhan Data

- `/guest-customers/lookup?phone=`.
- `/memberships/lookup?phone=&businessId=`.
- Endpoint pembuatan guest customer + membership (jika diaktifkan).

## 5. Panel Pembayaran

### Komponen

1. **Metode Pembayaran** list (radio): `Cash`, `QRIS`, `Online`, `Transfer Manual`.
2. Sub-komponen per metode:
   - Cash: konfirmasi jumlah diterima, kalkulasi kembalian.
   - QRIS: modal preview gambar QR outlet + timer.

- Online: pilih kanal (`QRIS Dinamis`, `VA BCA`, `GoPay`), tampilkan fee (3% app + 2% transaksi), dan munculkan dialog instruksi Midtrans (QR/image, kode bayar, VA, step-by-step).
- Transfer manual: upload bukti, input nomor referensi, catatan.

3. Tombol `Buat Pesanan` (enabled jika keranjang + metode valid).

### Kebutuhan Data

- Konfigurasi outlet: `manualBankName`, `manualQrImageUrl`, `defaultTransactionFeeBearer`.
- Endpoint transaksi: `POST /orders` -> response termasuk `transaction.midtrans` detail (QR, VA, instruksi, expiredAt).
- Endpoint upload bukti: `POST /transactions/{id}/proof`.

## 6. Panel Booking / Queue (Layanan)

### Komponen

- Picker tanggal (default hari ini) dengan batas min/max.
- Picker waktu (manual) + validasi jam operasional.
- Daftar slot tersedia (cards kecil; status available/booked/blocked).
- Dropdown assign staff (opsional).
- Switch `Masuk Antrian` bila skip slot.

### Kebutuhan Data

- `/outlets/{id}/operating-hours`.
- `/products/{id}/booking-slots?date=`.
- Endpoint `POST /booking-slots/reserve` atau logic di endpoint order.
- Data staff per outlet: `/staff/outlet/{id}`.

## 7. Panel Saldo Tunai (Cash Drawer)

### Komponen

- Status kasir: `Belum dibuka / Sedang aktif / Ditutup`.
- Input `Setoran awal` saat buka kasir.
- List transaksi tunai hari berjalan (cash in/out) + catatan.
- Tombol `Catat Pengeluaran Tunai`.
- Tombol `Tutup Kasir` -> modal input `Total uang fisik` + upload foto (opsional).

### Kebutuhan Data

- Endpoint `POST /cash-drawers/open` & `POST /cash-drawers/close`.
- Endpoint `GET /cash-drawers/current?outletId=`.
- Endpoint `POST /cash-drawers/transactions` untuk cash in/out.

## 8. Output Struk

### Komponen

- Modal preview (mirip thermal). Konten: identitas outlet, order id, tanggal, kasir, pelanggan, rincian item, diskon, fee, total, info pembayaran, footer.
- Tombol aksi: `Print`, `Kirim WhatsApp`, `Kirim Email`, `Download PDF` (opsional).

### Kebutuhan Data

- Data order lengkap dari response `POST /orders` atau `GET /orders/{id}`.
- Integrasi layanan kirim WA/email (opsional via queue).

## 9. Histori Transaksi POS

### Komponen

- Tabel/list ringkas (tanggal, order id, pelanggan, metode, total, status).
- Filter tanggal, metode bayar, status verifikasi.
- Aksi per baris: `Lihat detail`, `Kirim ulang struk`, `Verifikasi manual`.

### Kebutuhan Data

- Endpoint `GET /orders?outletId=&dateFrom=&dateTo=&paymentMethod=`.
- Endpoint `PATCH /transactions/{id}/verify` untuk manual approve/reject.

## 10. Responsive & Interaksi

- Mobile: keranjang dan panel pembayaran menjadi drawer bawah; katalog full width.
- Shortcut keyboard: `F1` fokus search, `F2` buka pelanggan, `F3` buka cash drawer.
- Offline mode: indikator + ability menyimpan order draft cash.

---

Dengan wireframe ini, kita bisa lanjut ke desain hi-fi atau langsung turunkan spesifikasi API berdasarkan kebutuhan data di setiap blok. Silakan review dan beri masukan sebelum masuk tahap berikutnya.
