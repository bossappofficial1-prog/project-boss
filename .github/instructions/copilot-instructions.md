---
applyTo: "**"
---

# Intruksi untuk backend

## Backend Dibuat menggunakan:

1. expres js (typescript)
2. Prisma ORM
3. zod untuk schema
4. redis untuk cronjob dan chaching

### Struktur response selalu

```json
{
  success: boolean;
  message: string;
  data: any;
  errors: any;
  path: string;
}
```

## Separation of Concern

### Pisahkan antara route, controller, service, dan repository.

- Cara membuat router

```typescript
import { Router } from "express";

const testRouter = Router();

testRouter("/", testController.getData);
// Routing lainnya
export default testRouter;
```

lalu daftarkan ke index.route.ts

```typescript
import testRouter from "./test.route";

router.use("/test", testRouter);
```

- Cara membuat controller

```typescript
import {Request, Response} from 'express';

const testController = asyncHandler(async(req: Request, res: Response))=>{
  const data = await TestService.test()
  return ResponseUtil.success(res, data)
}
```

atau

```typescript
import {Request, Response} from 'express';

export class TestController {
  public getData = asyncHandler(async(req: Request, res: Response))=>{
    const data = await TestService.test()
    return ResponseUtil.success(res, data)
  }
}

export const testRouter = new TestController()
```

- Cara membuat service

```typescript
export class TestService {
  static async getData() {
    const rawData = await TestServiceRepository.get();

    return rawData;
  }
}
```

- Cara membuat repository

```typescript
import { db } from "../config/prisma";

export class TestRepository {
  static async get() {
    return db.test.findMany();
  }
}
```

- schema dibuat mengunakan zod dan di buat di dalam folder backend/src/schemas

#### Penamaan file

- nama-file.service.ts
- nama-file.route.ts
- nama-file.controller.ts
- nama-file.repository.ts

ada juga utilis fungsi yang dapat kamu gunakan, dia ada di backend/src/utils/\*\*\*

- Service TIDAK BOLEH langsung mengakses Prisma
- Semua query database WAJIB melalui repository
- Semua request body, query, dan params WAJIB divalidasi menggunakan Zod
- Validasi dilakukan di controller sebelum memanggil service
- Jika validasi gagal, sudah ditangan oleh midleware errorHandler
- Redis digunakan untuk:
  - caching data read-heavy
  - job scheduling / cronjob
- Logic redis ditempatkan di service atau util, bukan di controller

## Instruksi untuk Frontend dan dashboard (Next.js)

### Tech Stack & Library

1. Framework: Next.js (App Router)
2. State Management & Fetching: TanStack Query (React Query) v5
3. UI Component: shadcn/ui (Tailwind CSS)
4. Validation: Zod
5. HTTP Client: Axios (via apiClient)

### Struktur Folder Frontend

- src/app: Page, Layout, dan Server Components.
- src/components/ui: Komponen dasar dari shadcn/ui.
- src/components/shared: Komponen reusable (Navbar, Sidebar, dll).
- src/hooks/api: Custom hooks React Query untuk fetching data.
- src/lib: Konfigurasi library (api client, query client).
- src/utils: Fungsi helper.

### Aturan Custom Hooks (React Query)

Semua proses pengambilan data (fetching) wajib menggunakan custom hooks yang diletakkan di dalam folder src/hooks/api.

Struktur File Hook: use-[nama-fitur].ts
Di dalam setiap file hook, Anda harus mendefinisika

1. Interface Request: Jika API membutuhkan payload atau parameter.
2. Interface Response: Struktur data inti yang ada di dalam data.
3. Fungsi API: Menggunakan apiClient.
4. Export Hook: Menggunakan useQuery untuk Read atau useMutation untuk Write.

#### Contoh Implementasi:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apis/base";

// 1. Tipe Data (Dibuat di dalam file hook)
export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

// 2. Fungsi Fetcher
const fetchUserProfile = async (): Promise<ApiResponse<UserProfile>> => {
  const { data } = await apiClient.get("/test/profile");
  return data;
};

// 3. Hook Export
export const useUserProfile = () => {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: fetchUserProfile,
  });
};
```

### Aturan UI & Styling (shadcn/ui)

- Komponen Dasar: Selalu gunakan komponen dari components/ui.
- Form: Wajib menggunakan komponen reusable-form.tsx yang mengintegrasikan react-hook-form dan zod untuk konsistensi pembuatan form `/dashboard/components/ui/reuseable-form.tsx`.
- Design Tokens:
  - Gunakan rounded-md untuk semua elemen yang memiliki sudut tumpul (buttons, cards, inputs).
  - Gunakan shadow-md untuk memberikan kedalaman atau elevasi pada komponen container/card.
- Responsivitas: Gunakan pendekatan Mobile First dengan utility classes Tailwind (contoh: w-full md:w-1/2).
- Loading State: Gunakan Skeleton dari shadcn saat status isLoading dari React Query bernilai true.
- Tabel: Gunakan data-table.tsx pada `/dashboard/components/ui/data-table.tsx`
- SOC: Selalu pisahkan page ke dalam beberapa komponent terpisah, dan cukup panggil \*\*Content.tsx di page.tsx. di page.tsx gunakan metadata untuk title dan yang relefan.
- spacing: space-\*-3, gap-3, rounded-md

### Error Handling

- Integrasi Query: Error dari API harus ditangkap melalui properti error yang disediakan oleh React Query.
- Umpan Balik Pengguna: Gunakan komponen toast dari shadcn/ui untuk menampilkan pesan error atau sukses yang diambil dari ApiResponse.message.

### Aturan Penamaan File

- Hooks: use-nama-fitur.ts (kebab-case).
- Components: NamaKomponen.tsx (PascalCase).
- Pages: Sesuai standar Next.js (page.tsx, layout.tsx, loading.tsx).

### Other

- Jangan terlalu banyak menggunakan komentar: contohnya ini (`// ─── Helpers ────────────────────────────────────────────`). gunakan comentar yang penting saja, dan tidak terlalu panjang
- buat global function jika itu kemungkinan bakalan digunakan secara berulang, contoh formatcurreny, formatdateisstring, dll
