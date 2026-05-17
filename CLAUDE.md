# Project Boss

## Services Overview

| Service             | Port | Stack                | Deskripsi               |
| ------------------- | ---- | -------------------- | ----------------------- |
| `backend`           | 1234 | Bun + Express + TS   | Core REST API           |
| `dashboard`         | 3010 | Next.js (App Router) | Admin & Owner dashboard |
| `frontend-customer` | 3000 | Next.js (App Router) | Customer-facing PWA     |

## Common Commands

```bash
cd backend           && bun dev
cd dashboard         && bun dev
cd frontend-customer && bun dev
```

---

## Backend (`/backend`)

### Architecture

Layered (class-based): `routes` → `Controller (class)` → `Service (class)` → `Repository (class)`

**WAJIB:** Semua service dan controller harus menggunakan class yang extends dari base class.

- Controller extends `BaseController` (di `src/controller/base.controller.ts`)
- Service extends `BaseService` (di `src/service/base.service.ts`)
- Repository tetap class dengan static methods

Lihat detail lengkap di `.github/instructions/backend-coding-standards.md`

```
src/
├── routes/         # Route definitions
├── controller/     # Request handling, response formatting
├── service/        # Business logic
├── repositories/   # DB queries (Prisma only, no raw SQL)
├── schemas/        # Zod validation schemas
├── middleware/     # Auth, rate-limit, upload, zod validator
├── queues/         # Background job queues (BullMQ)
├── jobs/           # Job processors
├── config/         # Redis, Prisma, Socket.IO, RabbitMQ, dll
├── utils/          # Helpers (jwt, logger, response, dll)
├── types/          # TypeScript types
├── socket/         # Socket.IO logic
└── errors/         # AppError class
```

### Integrations

- **Database:** PostgreSQL via Prisma ORM
- **Cache / Queue:** Redis + RabbitMQ
- **Realtime:** Socket.IO
- **Payment:** Midtrans
- **Search:** Elasticsearch
- **PDF:** Puppeteer + Handlebars templates (`/templates/*.hbs`)
- **Auth:** JWT + Passport
- **SMS:** Twilio
- **Notif:** Web Push

### Key Rules

- Semua DB query lewat Prisma, jangan raw SQL
- Validasi input pakai Zod schema di `schemas/`, apply via `zod.middleware.ts`
- Response format pakai helper di `utils/response.ts`
- Error handling pakai class `AppError` di `errors/app-error.ts`
- Puppeteer: jalankan dengan `--no-sandbox` di Docker/Linux
- Docker image sudah dioptimasi — hindari dependency besar tanpa cek ukuran image

---

## Dashboard (`/dashboard`)

### Structure

```
app/
├── admin/          # Admin role pages
├── owner/          # Owner role pages
├── cashier/        # Cashier role pages
├── auth/           # Login, register, reset password
└── subscription/   # Subscription pages

components/
├── ui/             # shadcn/ui + custom base components
├── shared/         # DataTable, Pagination, KPISCard, dll
├── modals/         # Reusable modals
├── layout/         # Header, Sidebar, DashboardLayout
├── cashier/        # Cashier-specific components
└── owner/          # Owner-specific components

lib/
├── apis/           # API call functions per domain
├── services/       # Service layer
└── withdrawals/    # Withdrawal feature module

hooks/
├── api/            # React Query hooks per domain
└── *.ts            # General hooks
```

### Key Rules

- API calls selalu lewat `lib/apis/`, jangan fetch langsung di komponen
- Data fetching pakai React Query (hooks di `hooks/api/`)
- Komponen reusable ada di `components/shared/` dan `components/ui/` — cek dulu sebelum buat yang baru
- Role-based rendering pakai `components/auth/RoleBasedRender.tsx`

---

## Frontend Customer (`/frontend-customer`)

### Structure

```
src/
├── app/
│   └── (app)/      # Main app routes (route group)
├── components/
│   ├── ui/         # Base UI components
│   └── shared/     # Shared components
├── hooks/          # React hooks
├── services/       # API call functions per domain
├── context/        # React contexts (Socket, Snackbar, AppBar)
├── providers/      # React providers
├── lib/            # Utils, API client
├── types/          # TypeScript types
├── constants/      # Constants
└── messages/       # i18n strings (id.json, en.json)
```

### Key Notes

- PWA dengan Serwist service worker (`src/sw.ts`)
- i18n support: Indonesia (`id`) dan English (`en`) via `next-intl`
- API calls lewat `src/services/` atau `src/lib/api.ts`
- Socket.IO context ada di `src/context/SocketContext.tsx`
- Runtime menggunakan bun
