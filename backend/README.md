# 🚀 Project Boss Backend

Selamat datang di **Project Boss** — backend modern untuk manajemen bisnis UMKM. Dirancang agar scalable, mudah dikembangkan, dan siap produksi.

---

## ✨ Fitur Utama

- Multi-bisnis & multi-outlet dalam satu akun
- Manajemen produk & stok (barang & jasa)
- Transaksi & pembayaran digital (Midtrans: QRIS, e-wallet, dsb)
- Dompet virtual & penarikan dana
- Upload gambar (Cloudinary & Multer)
- Autentikasi modern (Passport.js, Google OAuth, JWT)
- API dokumentasi (Swagger UI)
- Keamanan & logging (Helmet, CORS, Compression, Winston, Morgan)
- Siap Docker: deploy di mana saja

---

## 🛠️ Stack Teknologi

| Stack                   | Keterangan          |
| ----------------------- | ------------------- |
| Node.js                 | Runtime JS/TS       |
| TypeScript              | Bahasa utama        |
| Express.js              | Web framework       |
| Prisma ORM              | Database PostgreSQL |
| Passport.js             | Autentikasi & OAuth |
| Midtrans                | Pembayaran digital  |
| Cloudinary              | Penyimpanan gambar  |
| Multer                  | Upload file         |
| Swagger                 | Dokumentasi API     |
| Docker                  | Containerization    |
| Winston/Morgan          | Logging             |
| Helmet/CORS/Compression | Security & Optimasi |

---

## 📁 Struktur Folder

```
├── src/        # Kode utama (controller, routes, middleware, dsb)
├── prisma/     # Skema & migrasi database
├── public/     # File statis (gambar, dsb)
├── logs/       # Log aplikasi
```

---

## 🚦 Cara Cepat Menjalankan (Development)

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Siapkan environment**
   ```bash
   cp .env.example .env
   # Edit .env sesuai kebutuhan (DATABASE_URL, MIDTRANS, CLOUDINARY, dsb)
   ```
3. **Migrasi & generate Prisma Client**
   ```bash
   npm run db:migrate
   npm run db:generate
   ```
4. **(Opsional) Seed data awal**
   ```bash
   npm run db:seed
   ```
5. **Jalankan server development**
   ```bash
   npm run dev
   # Akses di http://localhost:4444
   ```

---

## 🐳 Jalankan dengan Docker

1. **Build image**
   ```bash
   docker build -t project-boss-backend .
   ```
2. **Run container**
   ```bash
   docker run -p 4444:4444 --env-file .env project-boss-backend
   ```

---

## 📖 Dokumentasi API

API Dokumentasi siap diakses di: [`BOSS API Documentation`](https://documenter.getpostman.com/view/41481931/2sB2xChUg3)

---

## ⚡ Script Penting (NPM)

| Script                | Fungsi                         |
| --------------------- | ------------------------------ |
| npm run dev           | Jalankan server development    |
| npm run build         | Build TypeScript ke dist/      |
| npm start             | Jalankan server production     |
| npm test              | Jalankan semua test Jest       |
| npm run test:watch    | Test mode watch                |
| npm run test:coverage | Laporan coverage               |
| npm run db:migrate    | Migrasi database (Prisma)      |
| npm run db:generate   | Generate Prisma Client         |
| npm run db:seed       | Seed data awal                 |
| npm run db:studio     | Buka Prisma Studio             |
| npm run db:reset      | Reset database & migrasi ulang |

---

## 🧪 Pengetesan Profesional

Project siap untuk pengujian profesional menggunakan **Jest** (unit & integration test) dan **Supertest** (API endpoint test).

### Cara Menambahkan & Menjalankan Test

1. **Buat file test** di folder `tests/` atau di samping file yang ingin diuji, contoh:
   - `src/controllers/auth.controller.test.ts`
   - `tests/business.e2e.test.ts`
2. **Contoh test API (Supertest + Jest)**

   ```ts
   // tests/auth.e2e.test.ts
   import request from "supertest";
   import app from "../src/app";

   describe("Auth API", () => {
     it("should return 401 for invalid login", async () => {
       const res = await request(app)
         .post("/api/auth/login")
         .send({ email: "wrong@mail.com", password: "salah" });
       expect(res.statusCode).toBe(401);
     });
   });
   ```

3. **Jalankan semua test**
   ```bash
   npm test
   # atau
   npx jest
   ```
   > Untuk coverage report: `npx jest --coverage`

---

## ⚠️ Tips Penting

- Pastikan file `.env` sudah diisi dengan benar.
- Untuk production, menggunakan database & credential Midtrans yang aman.
- Upload gambar langsung ke Cloudinary.

---

## 📄 Lisensi

MIT
