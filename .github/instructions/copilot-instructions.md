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

## Separation of Concern (Class-Based Pattern)

### WAJIB: Semua controller dan service menggunakan class dengan base class inheritance.

Referensi lengkap ada di: `.github/instructions/backend-coding-standards.md`

### Cara membuat Controller (extends BaseController)

```typescript
import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { TestService } from "../service/test.service";

class TestController extends BaseController {
  getAll = this.handler(async (req: Request, res: Response) => {
    const data = await TestService.getAll();
    return this.success(res, data);
  });

  getById = this.handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await TestService.getById(id);
    return this.success(res, data);
  });

  create = this.handler(async (req: Request, res: Response) => {
    const result = await TestService.create(req.body);
    return this.success(res, result, 201);
  });

  update = this.handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await TestService.update(id, req.body);
    return this.success(res, result);
  });

  delete = this.handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await TestService.delete(id);
    return this.success(res, null);
  });
}

export const testController = new TestController();
```

### Cara membuat Service (extends BaseService)

```typescript
import { BaseService } from "./base.service";
import { TestRepository } from "../repositories/test.repository";
import { CreateTestInput } from "../schemas/test.schema";

export class TestService extends BaseService {
  static async getAll() {
    return TestRepository.findAll();
  }

  static async getById(id: string) {
    const data = await TestRepository.findById(id);
    if (!data) this.notFound("Data tidak ditemukan");
    return data;
  }

  static async create(input: CreateTestInput) {
    return TestRepository.create(input);
  }

  static async update(id: string, input: any) {
    await this.getById(id);
    return TestRepository.update(id, input);
  }

  static async delete(id: string) {
    await this.getById(id);
    return TestRepository.delete(id);
  }
}
```

### Cara membuat Repository

```typescript
import { db } from "../config/prisma";

export class TestRepository {
  static async findById(id: string) {
    return db.test.findUnique({ where: { id } });
  }

  static async findAll() {
    return db.test.findMany();
  }

  static async create(data: any) {
    return db.test.create({ data });
  }

  static async update(id: string, data: any) {
    return db.test.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return db.test.delete({ where: { id } });
  }
}
```

### Cara membuat Router

```typescript
import { Router } from "express";
import { testController } from "../controller/test.controller";
import { validateSchema } from "../middleware/zod.middleware";
import { createTestSchema } from "../schemas/test.schema";

const testRouter = Router();

testRouter.get("/", testController.getAll);
testRouter.get("/:id", testController.getById);
testRouter.post("/", validateSchema(createTestSchema), testController.create);
testRouter.patch("/:id", testController.update);
testRouter.delete("/:id", testController.delete);

export default testRouter;
```

Lalu daftarkan ke `index.route.ts`:

```typescript
import testRouter from "./test.route";
router.use("/test", testRouter);
```

- Schema dibuat menggunakan Zod di folder `backend/src/schemas/`

#### Penamaan file

- nama-file.service.ts
- nama-file.route.ts
- nama-file.controller.ts
- nama-file.repository.ts

Ada juga utility functions di `backend/src/utils/**`

### Aturan Ketat:

- Service TIDAK BOLEH langsung mengakses Prisma — semua lewat Repository
- Semua query database WAJIB melalui Repository
- Semua request body, query, dan params WAJIB divalidasi menggunakan Zod
- Validasi dilakukan di middleware (bukan di controller/service)
- Jika validasi gagal, sudah ditangani oleh middleware errorHandler
- Redis digunakan untuk caching dan job scheduling
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
