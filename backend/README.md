# BOSS (Business One Stop System) Backend API

Sistem backend untuk platform manajemen bisnis multi-outlet yang mendukung **e-commerce**, **point of sale**, dan **manajemen layanan**. Dibangun dengan **Express.js**, **TypeScript**, dan **Prisma ORM**.

---

## Fitur Utama

- **Multi-Business & Multi-Outlet**: Kelola banyak bisnis dan cabang
- **Dual Product Types**: Produk fisik (GOODS) dan layanan (SERVICE)
- **Smart Fee Structure**: Fee Midtrans 0.7% otomatis, Biaya Admin Aplikasi 2%
- **Flexible Fee Bearer**: Owner atau Customer bisa menanggung fee berdasarkan pengaturan bisnis
- **Payment Gateway**: Integrasi Midtrans untuk QRIS & pembayaran online dengan auto fee calculation
- **Real-time Processing**: RabbitMQ untuk notifikasi & background jobs
- **Guest Orders**: Pemesanan tanpa registrasi untuk kemudahan customer
- **WhatsApp Integration**: Notifikasi otomatis via WhatsApp API
- **Booking System**: Sistem booking untuk layanan dengan slot management
- **Comprehensive API**: RESTful API dengan dokumentasi OpenAPI 3.0
- **TypeScript**: Kode lebih aman & maintainable
- **Prisma ORM**: Query database PostgreSQL dengan mudah
- **JWT Auth**: Sistem autentikasi berbasis token
- **Winston Logger**: Logging harian otomatis
- **Testing**: Sudah terintegrasi dengan Jest & Supertest

---

## Struktur Folder

```
├── src/
│   ├── app.ts           # Inisialisasi express & middleware
│   ├── index.ts         # Entry point server
│   ├── config/          # Konfigurasi environment & prisma
│   ├── constants/       # Konstanta global (status, message, dsb)
│   ├── controller/      # Handler request
│   ├── errors/          # Custom error
│   ├── middleware/      # Middleware (logging, rate-limit, error)
│   ├── repositories/    # Query ke database
│   ├── routes/          # Routing API
│   ├── schemas/         # Validasi skema request/response (zod)
│   ├── service/         # Bisnis logic
│   ├── types/           # TypeScript types
│   └── utils/           # Helper utilities
├── prisma/              # Schema & migration database
├── tests/               # Testing
├── logs/                # File log aplikasi
```

---

## Script yang Tersedia

| Script            | Perintah                | Deskripsi                                   |
| ----------------- | ----------------------- | ------------------------------------------- |
| Start Development | `npm run dev`           | Menjalankan server dalam mode development   |
| Build             | `npm run build`         | Build project TypeScript ke JavaScript      |
| Start Production  | `npm start`             | Menjalankan server hasil build (production) |
| Test              | `npm test`              | Menjalankan seluruh unit test               |
| Test Watch        | `npm run test:watch`    | Menjalankan test dengan mode watch          |
| Test Coverage     | `npm run test:coverage` | Menampilkan laporan coverage test           |
| DB Migrate        | `npm run db:migrate`    | Menjalankan migrasi database Prisma         |
| DB Generate       | `npm run db:generate`   | Generate client Prisma                      |
| DB Seed           | `npm run db:seed`       | Mengisi database dengan data awal (seeding) |
| DB Studio         | `npm run db:studio`     | Membuka Prisma Studio (GUI database)        |
| DB Reset          | `npm run db:reset`      | Reset database dan migrasi ulang            |
| DB Prepare        | `npm run db:prepare`    | Generate ulang Prisma client                |
| Docs Install      | `npm run docs:install`  | Install dependencies untuk dokumentasi      |
| Docs Generate     | `npm run docs:generate` | Generate dokumentasi HTML                   |
| Docs Serve        | `npm run docs:serve`    | Serve dokumentasi untuk development         |

---

## 📖 Dokumentasi API

### OpenAPI Specification

- **File**: `openapi.json` - Spesifikasi API lengkap dalam format OpenAPI 3.0
- **Interactive Docs**: `docs/index.html` - Dokumentasi interaktif dengan UI yang user-friendly

### Postman Collection

- **Collection**: `BOSS-API-Postman-Collection-Fixed.json` - Koleksi lengkap endpoint API dengan response examples
- **Features**: Auto-authentication, error handling, dan environment variables
- **Coverage**: 46+ endpoints dengan dokumentasi lengkap

### Generate Interactive Documentation

```sh
# Install redoc-cli (hanya perlu sekali)
npm run docs:install

# Generate dokumentasi HTML
npm run docs:generate

# Serve untuk development
npm run docs:serve
```

### Import ke Postman

1. Buka Postman
2. Import file `BOSS-API-Postman-Collection-Fixed.json`
3. Set environment variable `base_url` sesuai server Anda (default: http://localhost:3000/api)
4. Test endpoint Register → Login untuk auto-authentication
5. Token JWT akan otomatis tersimpan dan digunakan untuk endpoint yang memerlukan authentication

---

## Quick Start

### 1. Clone & Install

```sh
git clone <repository-url>
cd project-boss/backend
npm install
```

### 2. Konfigurasi Environment

Salin `.env.example` ke `.env` dan sesuaikan:

```sh
cp .env.example .env
```

Pastikan konfigurasi berikut telah diatur:

- `DATABASE_URL`: Connection string PostgreSQL
- `MIDTRANS_SERVER_KEY` & `MIDTRANS_CLIENT_KEY`: Kredensial Midtrans
- `WHATSAPP_API_TOKEN`: Token untuk WhatsApp API
- `RABBITMQ_URL`: Connection string RabbitMQ

### 3. Setup Database

- Pastikan PostgreSQL berjalan.
- Edit `DATABASE_URL` di `.env` sesuai database Anda.

### 4. Migrasi & Seed Database

```sh
npm run db:migrate
npm run db:seed
```

### 5. Jalankan Server

```sh
npm run dev
```

Server berjalan di: [http://localhost:3000](http://localhost:1234)
API Base URL: [http://localhost:3000/api](http://localhost:1234/api/v1)

---

## 🏗️ Arsitektur Sistem

### Core Entities

- **Business**: Representasi bisnis/perusahaan dengan setting default fee bearer
- **Outlet**: Cabang atau lokasi bisnis
- **Product**: Produk fisik (GOODS) atau layanan (SERVICE)
- **Order**: Transaksi pembelian dengan smart fee calculation
- **User**: Pengguna sistem dengan role-based access

### Fee Structure & Payment Flow

1. **Midtrans Fee**: Otomatis 0.7% dari subtotal order
2. **App Fee**: 2% dari subtotal untuk biaya admin aplikasi
3. **Fee Bearer Configuration**:
   - Default setting di Business level
   - OWNER: Owner menanggung semua fee
   - CUSTOMER: Customer menanggung fee (ditambahkan ke total)

### Payment Flow

1. **Create Order**: Customer membuat pesanan dengan guest atau authenticated user
2. **Fee Calculation**:
   - Midtrans fee (0.7%) selalu dihitung dari subtotal
   - App fee (2%) untuk biaya admin aplikasi
   - Fee ditambahkan ke total jika feeBearer = CUSTOMER
3. **Payment Gateway**: Integrasi dengan Midtrans untuk QRIS/transfer
4. **Webhook Processing**: Otomatis update status pembayaran
5. **Notification**: WhatsApp notifikasi ke customer & merchant
6. **Order Management**: Workflow status dari PENDING → PAID → READY → COMPLETED

### Withdrawal System

1. **Minimum Transactions**: Withdrawal dapat dilakukan setelah 100 transaksi selesai
2. **Withdrawal Fees**:
   - Midtrans Fee: Rp 4.000 untuk transfer bank
   - App Fee: 2% dari jumlah yang ditarik
3. **Net Revenue Calculation**: Revenue bersih setelah dipotong fee yang ditanggung owner

### Message Queue Architecture

- **Publisher**: Centralized message publishing dengan type safety
- **Consumers**: Domain-separated workers (notifications, service orders)
- **RabbitMQ**: Reliable message delivery untuk async processing

---

## 🔧 Configuration

Pastikan environment variables berikut telah dikonfigurasi di `.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/boss_db"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=false

# WhatsApp API
WHATSAPP_API_TOKEN=your-whatsapp-token
WHATSAPP_API_URL=https://api.whatsapp.com/send

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379
```

---

## 🚀 Deployment

### Using Docker

```sh
# Build image
docker build -t boss-backend .

# Run container
docker run -p 3000:3000 --env-file .env boss-backend
```

### Manual Deployment

```sh
# Build untuk production
npm run build

# Start production server
npm start
```

---

## 🧪 Testing

### Run Tests

```sh
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### API Testing dengan Postman

1. Kunjingi [API Dokumentasi](https://documenter.getpostman.com/view/41481931/2sB34midWB)
2. Set environment variable `base_url` ke `http://localhost:1234/api/c1`
3. Jalankan test flow: Register → Login → Create Business → Create Outlet → Create Product → Create Order
4. Token akan otomatis tersimpan setelah login untuk endpoint yang memerlukan authentication

---

## Fee Structure Detail

### Midtrans Fee (0.7%)

- **Perhitungan**: 0.7% dari subtotal order
- **Berlaku**: Untuk semua order dengan payment method online/QRIS
- **Contoh**: Order Rp 100.000 → Midtrans fee Rp 700

### Biaya Admin Aplikasi (2%)

- **Perhitungan**: 2% dari subtotal order
- **Berlaku**: Untuk semua order sebagai biaya operasional platform
- **Contoh**: Order Rp 100.000 → App fee Rp 2.000

### Fee Bearer Configuration

- **OWNER**: Owner menanggung semua fee (Customer bayar sesuai harga produk)
- **CUSTOMER**: Customer menanggung fee (Fee ditambahkan ke total pembayaran)
- **Setting**: Dikonfigurasi di level Business, bisa berbeda per bisnis

### Withdrawal System

**Syarat Withdrawal:**

- Minimum 100.000 saldo
- Dana yang bisa ditarik adalah revenue bersih setelah dipotong fee

**Biaya Withdrawal:**

- **Midtrans Fee**: Rp 4.000 (biaya transfer bank)
- **App Fee**: 2% dari jumlah yang ditarik
- **Contoh**: Withdraw Rp 1.000.000 → Fee Rp 24.000 → Diterima Rp 976.000

### Contoh Kalkulasi

**Scenario 1: Order - Fee Bearer CUSTOMER**

- Subtotal: Rp 100.000
- Midtrans Fee: Rp 700 (0.7%)
- App Fee: Rp 2.000 (2%)
- **Total Customer Bayar**: Rp 102.700

**Scenario 2: Order - Fee Bearer OWNER**

- Subtotal: Rp 100.000
- Midtrans Fee: Rp 700 (ditanggung owner)
- App Fee: Rp 2.000 (ditanggung owner)
- **Total Customer Bayar**: Rp 100.000
- **Owner Terima**: Rp 97.300 (setelah dipotong fee)

**Scenario 3: Withdrawal setelah 100+ transaksi**

- Total Revenue: Rp 10.000.000
- Fee yang ditanggung owner: Rp 270.000 (misalnya)
- Net Revenue: Rp 9.730.000
- Request Withdrawal: Rp 5.000.000
- Withdrawal Fee: Rp 104.000 (Rp 4.000 + 2% × Rp 5.000.000)
- **Diterima Owner**: Rp 4.896.000

---

## 📝 License

MIT License - lihat file [LICENSE](LICENSE) untuk detail lengkap.

---

## Testing

Jalankan semua test:

```sh
npm test
```

---

## Jalankan dengan Docker

```sh
docker build -t boss-backend .
docker run -p 1234:1234 --env-file .env boss-backend
```

---

## Tools & Library

- [Express](https://expressjs.com/) - Web framework untuk Node.js
- [TypeScript](https://www.typescriptlang.org/) - JavaScript dengan static typing
- [Prisma](https://www.prisma.io/) - Modern database toolkit dan ORM
- [Jest](https://jestjs.io/) - JavaScript testing framework
- [Supertest](https://github.com/visionmedia/supertest) - HTTP assertion library
- [Winston](https://github.com/winstonjs/winston) - Logging library
- [Helmet](https://helmetjs.github.io/) - Security middleware
- [express-rate-limit](https://github.com/nfriedly/express-rate-limit) - Rate limiting middleware
- [Midtrans](https://midtrans.com/) - Payment gateway integration
- [RabbitMQ](https://www.rabbitmq.com/) - Message broker
- [Socket.IO](https://socket.io/) - Real-time communication
- [Zod](https://zod.dev/) - TypeScript-first schema validation

---

## Author

**Pito Desri Pauzi**

- Backend Developer & System Architect
- Specialized in Node.js, TypeScript, and Microservices

---
