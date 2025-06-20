# Business One Stop System (BOSS)

## Deskripsi

BOSS adalah sistem informasi, kasir, dan semi-ecommerce berbasis web. Proyek ini menyediakan fitur utama seperti pemesanan antrian, pemesanan barang, dan integrasi pembayaran dengan antarmuka yang responsif, modern, dan minimalis.

### Fitur Utama

- **UMKM**
    - Dashboard pengelolaan barang/layanan yang ditawarkan.
    - Manajemen stok produk.
    - Manajemen antrian pelanggan.
    - Laporan penjualan dan performa bisnis.
- **Pelanggan**
    - Dashbaord minimalis untuk pelanggan.
    - Laman home yang menampilkan umkm dan layanan mereka.
    - Pemesanan antrian untuk layanan.
    - Pembayaran produk ataupun antrian melalui Midtrans.
- **Admin**
    - Dashboard admin untuk mengelola seluruh sistem.
    - Manajemen pengguna (UMKM, pelanggan).
    - Laporan dan analitik performa sistem.

## Tech Stack

- **Frontend**
  - **Nuxt.js**: Framework Vue.js untuk aplikasi web yang cepat dan SEO-friendly.
  - **Nuxt UI**: Pustaka UI berbasis Tailwind CSS untuk komponen modern.
  - **Nuxt/icon**: Ikon kustom untuk antarmuka pengguna.
  - **Nuxt/image**: Optimasi gambar untuk performa lebih baik.
- **Backend**
  - **Express.js**: Server-side framework untuk API.
  - **Prisma**: ORM untuk interaksi database.
  - **PostgreSQL**: Database relasional untuk menyimpan data.
  - **JWT**: Autentikasi berbasis token untuk keamanan API.
  - **RabbitMQ**: Sistem antrian untuk pemrosesan pesan asinkron.
  - **Redis**: Cache untuk meningkatkan performa aplikasi.
- **Integrasi Pembayaran**: Menggunakan SDK resmi misalnya Midtrans untuk menangani transaksi.

## Prasyarat

- Node.js
- PostgreSQL

## Instalasi

1. Clone repositori ini:

   ```bash
   git clone https://github.com/PitokDf/project-boss.git
   cd project-boss
   ```

2. Instal dependensi:

   - Frontend

   ```bash
   cd frontend
   npm install
   ```

   - Backend

   ```bash
    cd backend
    npm install
   ```

3. Jalankan proyek di mode pengembangan:
   - Masing-masing bagian frontend dan backend harus dijalankan secara terpisah.
   ```bash
   npm run dev
   ```

## Developer

- Backend Developer [Pito Desri Pauzi](https://pitok.my.id/)
- Frontend Developer [Baghaztra Van Ril](https://bgztra.my.id/)
- UI/UX Engineer [Afca Arel Pratama](#)

## Lisensi

MIT License
