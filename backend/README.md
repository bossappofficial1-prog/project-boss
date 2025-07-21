# Express + TypeScript + Prisma Boilerplate

Template backend siap pakai menggunakan **Express.js**, **TypeScript**, dan **Prisma ORM**. Cocok untuk membangun REST API modern, aman, dan scalable.

---

## Fitur Utama

- **TypeScript**: Kode lebih aman & maintainable
- **Prisma ORM**: Query database PostgreSQL dengan mudah
- **Express 5**: Framework web minimalis & powerful
- **Rate Limiting**: Perlindungan dari brute-force
- **JWT Auth**: Siap untuk implementasi autentikasi
- **Winston Logger**: Logging harian otomatis
- **Testing**: Sudah terintegrasi dengan Jest & Supertest
- **Dockerized**: Siap deploy dengan Docker

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

## Quick Start

### 1. Clone & Install

```sh
git clone https://github.com/PitoDf/express-app-useable
cd express-app-useable # bisa ganti nama folder sesuai dengan kebutuhan
npm install
```

or install via npm module

```sh
npx install-express-pitok create <nama-projek>
```

### 2. Konfigurasi Environment

Salin `.env.example` ke `.env` dan sesuaikan:

```sh
cp .env.example .env
```

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

Server berjalan di: [http://localhost:6789](http://localhost:1234)

---

## Testing

Jalankan semua test:

```sh
npm test
```

---

## Jalankan dengan Docker

```sh
docker build -t my-express-app .
docker run -p 1234:4444 --env-file .env my-express-app
```

---

## Tools & Library

- [Express](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Prisma](https://www.prisma.io/)
- [Jest](https://jestjs.io/)
- [Supertest](https://github.com/visionmedia/supertest)
- [Winston](https://github.com/winstonjs/winston)
- [Helmet](https://helmetjs.github.io/)
- [express-rate-limit](https://github.com/nfriedly/express-rate-limit)

---

## Author

Pito Desri Pauzi

---

##
