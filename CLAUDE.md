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

Panduan struktur folder Next.js 16 dengan konvensi **kebab-case** secara keseluruhan.

---

## Konvensi penamaan

| Tipe                        | Konvensi   | Contoh                               |
| --------------------------- | ---------- | ------------------------------------ |
| Semua folder                | kebab-case | `use-auth/`, `product-card/`         |
| File komponen React         | kebab-case | `login-form.tsx`, `button.tsx`       |
| Nama function di dalam file | PascalCase | `export function LoginForm()`        |
| Hooks                       | kebab-case | `use-auth.ts`                        |
| Services / Actions          | kebab-case | `auth.service.ts`, `auth.actions.ts` |
| Types / Schemas             | kebab-case | `auth.types.ts`, `auth.schema.ts`    |
| Next.js special files       | lowercase  | `page.tsx`, `layout.tsx`, `proxy.ts` |

> **Catatan:** Nama function/class komponen React di dalam file tetap PascalCase karena JSX membedakan komponen (`<LoginForm />`) vs HTML element (`<div />`).

---

## Folder tree

```
my-app/
├── public/
│   └── images/
│
├── src/
│   ├── app/                              # App Router — routing only
│   │   ├── auth/                       # Route group, tidak mempengaruhi URL
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── admin/                  # Route group — shared layout
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   │
│   │   ├── owner/                  # Route group — shared layout
│   │   │   ├── layout.tsx
│   │   ├── cashier/                 # Route group — shared layout
│   │   │   ├── layout.tsx
│   │   ├── api/
│   │   │   └── webhooks/
│   │   │       └── route.ts
│   │   │
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Landing page /
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   └── globals.css
│   │
│   ├── features/                         # Domain logic — inti aplikasi
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── login-form.tsx        # export function LoginForm()
│   │   │   │   └── register-form.tsx     # export function RegisterForm()
│   │   │   ├── hooks/
│   │   │   │   └── use-auth.ts
│   │   │   ├── actions/                  # Server actions
│   │   │   │   └── auth.actions.ts
│   │   │   ├── services/                 # Business logic / API calls
│   │   │   │   └── auth.service.ts
│   │   │   ├── types/
│   │   │   │   └── auth.types.ts
│   │   │   └── index.ts                  # Public API feature ini
│   │   │
│   │   └── products/
│   │       ├── components/
│   │       │   ├── product-card.tsx      # export function ProductCard()
│   │       │   └── product-list.tsx      # export function ProductList()
│   │       ├── hooks/
│   │       │   └── use-products.ts
│   │       ├── actions/
│   │       │   └── product.actions.ts
│   │       ├── services/
│   │       │   └── product.service.ts
│   │       ├── types/
│   │       │   └── product.types.ts
│   │       └── index.ts
│   │
│   ├── components/                       # Shared UI lintas feature
│   │   ├── ui/                           # Primitif
│   │   │   ├── button.tsx                # export function Button()
│   │   │   ├── input.tsx
│   │   │   └── modal.tsx
│   │   └── layouts/
│   │       ├── navbar.tsx                # export function Navbar()
│   │       └── sidebar.tsx
│   │
│   ├── lib/                              # Utilities & config singleton
│   │   ├── db.ts                         # Prisma client
│   │   ├── auth.ts                       # Auth config (next-auth dll)
│   │   ├── utils.ts
│   │   └── validations/
│   │       └── auth.schema.ts            # Zod schemas
│   │
│   ├── hooks/                            # Global shared hooks
│   │   └── use-debounce.ts
│   │
│   ├── stores/                           # Client state (zustand, jotai)
│   │   └── cart.store.ts
│   │
│   ├── types/                            # Global types & interfaces
│   │   ├── index.ts
│   │   └── api.types.ts
│   │
│   └── proxy.ts                          # Next.js 16 — pengganti middleware.ts
│
├── .env.local
├── .env.example
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── package.json
```

---

## Penjelasan per folder

### `src/app/`

Murni untuk routing. Hanya berisi file konvensi Next.js: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, dan `route.ts`. Tidak ada logic bisnis di sini.

Route groups `(auth)` dan `(dashboard)` digunakan untuk mengelompokkan route tanpa mempengaruhi URL, sekaligus memungkinkan layout yang berbeda per grup.

### `src/features/`

Inti aplikasi, diorganisasi per domain. Setiap feature berdiri sendiri dan mengekspos public API melalui `index.ts`. Struktur internal setiap feature:

- `components/` — UI spesifik feature ini
- `hooks/` — React hooks spesifik feature
- `actions/` — Server actions (mutasi data)
- `services/` — Business logic, API calls, data fetching
- `types/` — Type definitions spesifik feature
- `index.ts` — Re-export public API, menjaga dependency antar feature tetap eksplisit

### `src/components/`

UI yang dipakai lintas feature.

- `ui/` — Komponen primitif tanpa logic bisnis (button, input, modal, badge, dll)
- `layouts/` — Komponen layout seperti Navbar dan Sidebar

### `src/lib/`

Konfigurasi singleton dan utilities global.

- `db.ts` — Instance Prisma client
- `auth.ts` — Konfigurasi next-auth atau auth library lain
- `utils.ts` — Helper functions (format tanggal, currency, dll)
- `validations/` — Zod schemas yang dipakai di server actions maupun client

### `src/hooks/`

Hooks yang dipakai di lebih dari satu feature. Jika hook hanya dipakai di satu feature, letakkan di dalam folder feature tersebut.

### `src/stores/`

Client-side global state menggunakan Zustand, Jotai, atau sejenisnya. Gunakan hanya untuk state yang benar-benar global (cart, theme, dll).

### `src/types/`

Type definitions global yang tidak spesifik ke satu feature, seperti response shape dari API eksternal.

### `src/proxy.ts`

Pengganti `middleware.ts` di Next.js 16. Khusus untuk routing, redirect, rewrite, dan header manipulation. Jangan taruh logic autentikasi atau business logic di sini — pindahkan ke `layout.tsx` atau server actions.

```ts
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

## Contoh `index.ts` feature

```ts
// src/features/auth/index.ts
export { LoginForm } from "./components/login-form";
export { RegisterForm } from "./components/register-form";
export { useAuth } from "./hooks/use-auth";
export type { User, AuthState } from "./types/auth.types";
```

Import dari luar feature cukup:

```ts
import { LoginForm, useAuth } from "@/features/auth";
```

### Key Rules

- API calls selalu lewat `lib/apis/`, jangan fetch langsung di komponen
- Data fetching pakai React Query (hooks di `hooks/api/`)
- Komponen reusable ada di `components/shared/` dan `components/ui/` — cek dulu sebelum buat yang baru

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
