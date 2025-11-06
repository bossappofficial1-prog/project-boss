30/06/2025

## **Daftar Fitur & Perubahan**

### UI/UX

1. **Logo & Warna**
   - Ganti opsi logo 1 warna merah.
2. **Splash Screen**
   - Tambahkan animasi saat aplikasi dibuka.
3. **Landing Page**
   - Hilangkan menu outlet.
   - Pindahkan fitur pencarian ke home.

---

### Akun & Registrasi

4. **Daftar Akun Bisnis**

   - Login hanya untuk UMKM, dengan form login terpisah.
   - Info lengkap dilengkapi nanti via notifikasi di dashboard.

5. **Customer Tanpa Login**
   - Customer bisa explore outlet tanpa login.
   - Membership ditambahkan oleh admin UMKM.

---

### Produk & Booking

6. **Pembelian Produk**

   - Tambah produk ke keranjang, lalu pembayaran bisa banyak produk sekaligus.

7. **Booking**

   - Customer isi identitas saat booking, tanpa login.

8. **UMKM**
   - Admin UMKM bisa input produk, atau jasa, via form dan excel (downlaod template dari sistem).

---

### Dashboard & Manajemen Data

9. **Dashboard**

   - Kolom total produk & total layanan dalam satu tampilan.
   - Collapsable sidebar untuk desktop.
   - Tambah menu sidebar: **Statistik order per bulan/minggu + filter**.

10. **Order ID (Nomor fraktur)**

- Format urut berdasarkan tanggal + angka urut.
- Contoh: `2906202501`.

11. **Transaksi**

- Bisa pilih metode pembayaran (cash/digital).
- Laporan bisa filter berdasarkan metode.

12. **Refund**

- Sistem refund khusus admin.
- Proses refund offline, tapi status dicatat si sistem.

13. **On/Off layanan yang disediakan**

- Layanan bisa di-off, disembunyikan, atau nonaktif di jam tertentu.

14. **Data Member UMKM**

- Member didata offline.
- Diskon khusus member via dashboard UMKM.

15. **Fee Cas**

- Fee cas bisa ditentukan saat tambah produk (apakah dibebankan ke customer atau owner).

16. **Notifikasi via whatsapp**

- Setelah pesan layanan, notifikasi masuk via chat WA admin ke nomor customer.

17. **Print Transaksi**

- Tambahkan opsi cetak transaksi di menu owner.

---

## **Daftar prioritas**

1. High

   - Perubahan UI/UX (1-3)
   - Perubahan Akun & Registrasi (4-5)
   - Produk & booking (6-7)
   - Membership (14)
   - Dashboard & Manajemen Data (9-11)
   - On/off layanan (13)

2. Medium

   - Dashboard & Manajemen Data (9)
   - Fee cas (15) [testing integrasi dengan midtrans]
   - Refund (12) [alternatif, masuk ke data pengeluaran, namun akan diusahakan]
   -

3. Low
   - Input data via excel (8) [butuh riset dan testing]
   - Notifikasi via whatsapp (16) [butuh riset terkait biaya dll]
   - Print struk transaksi (17) [butuh riset terkait integrasi dengan thermal printer]

---

01/11/2025

## **POS Per Outlet**

### Perencanaan & Desain

- [ ] Validasi flow POS di `dashboard/docs/pos-flow.puml` dengan stakeholder.
- [ ] Susun wireframe low-fi untuk layar kasir goods dan layanan.
- [ ] Definisikan kontrak API POS (produk, order, transaksi, booking) beserta skema respons baku.
- [ ] Rancang model saldo tunai (cash drawer) dan alur buka/tutup kasir per outlet.

### Backend

- [ ] Endpoint agregasi produk/layanan per outlet dengan dukungan pencarian, filter stok, dan status.
- [ ] Endpoint create/update guest customer serta lookup membership berdasarkan nomor HP.
- [ ] Endpoint pembuatan order goods/service yang menangani diskon membership, promo, dan fee bearer.
- [ ] Endpoint transaksi multi-metode (cash, QRIS, online Midtrans, transfer manual) termasuk upload bukti.
- [ ] Endpoint manajemen booking slot dan antrian layanan (list, reserve, release, assign staff).
- [ ] Endpoint cash drawer: buka kasir, catat setoran awal, pencatatan pengeluaran tunai, tutup kasir dengan rekonsiliasi.
- [ ] Event/notification (socket/RabbitMQ) untuk order baru, perubahan status pembayaran, dan update queue.

### Frontend Dashboard (POS Kasir)

- [ ] Implementasi context POS per outlet (state keranjang, pelanggan, preferensi outlet).
- [ ] Halaman katalog goods/service dengan UI touch-friendly dan mode dark default.
- [ ] Form pelanggan dengan opsi lewati, lookup membership otomatis, dan preset walk-in.
- [ ] Keranjang interaktif dengan kalkulasi subtotal, diskon, promo kode, dan fee real-time.
- [ ] Integrasi form metode pembayaran termasuk modal QRIS, upload bukti manual, dan pengambilan token Midtrans.
- [ ] Flow booking/antrian layanan: pemilihan slot, validasi jam operasional, assign staff, status queue.
- [ ] Modul saldo tunai: setoran awal, transaksi tunai masuk/keluar, penutupan kasir.
- [ ] Ringkasan order + struk digital (Preview, cetak, kirim via WA/email bila tersedia kontak).
- [ ] Histori transaksi harian dengan filter metode bayar dan status verifikasi manual.

### Testing & Dokumentasi

- [ ] Unit test backend untuk kalkulasi order, penanganan fee, dan booking slot.
- [ ] Integration/E2E test POS flow (goods dan layanan) menggunakan Playwright atau Cypress dashboard.
- [ ] Simulasi manual cash drawer (buka-tutup kasir) untuk memastikan saldo sesuai.
- [ ] Dokumentasi operasional POS untuk kasir dan owner (panduan singkat + FAQ).
- [ ] Update README/dashboard docs dengan petunjuk setup fitur POS baru.
