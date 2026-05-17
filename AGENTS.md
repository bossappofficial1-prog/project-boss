read skills @.agents/skills/ui-guidelines-dashbord if you work on dahboard

## Backend Coding Standards

Ketika menulis kode di folder `backend/`, WAJIB ikuti pola class-based:

- **Controller** → extends `BaseController` (`src/controller/base.controller.ts`)
- **Service** → extends `BaseService` (`src/service/base.service.ts`)
- **Repository** → class dengan static methods, satu-satunya layer yang boleh akses `db` (Prisma)

### Aturan Utama:

1. Service TIDAK BOLEH langsung akses Prisma (`db`) — semua lewat Repository
2. Controller TIDAK BOLEH punya business logic — hanya extract request + panggil service
3. Semua response pakai `ResponseUtil`
4. Error handling pakai `AppError`
5. Validasi input pakai Zod schema di middleware

Referensi lengkap: `.github/instructions/backend-coding-standards.md`
